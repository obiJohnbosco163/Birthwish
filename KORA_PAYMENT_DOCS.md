# Kora Payment Integration Guide (Birthwish Engine)

Comprehensive technical documentation, architecture specifications, and security practices for the **Kora Payment Integration Engine** in Birthwish.

---

## 📌 Executive Summary

The **Kora Payment Integration Engine** powers Birthwish's **Vault Holding & Cash Gift Disbursement** system. It allows well-wishers to attach monetary gifts (in Nigerian Naira, NGN) to digital birthday tributes. The funds are held securely until the birthday celebrant enters the confidential secret passcode and provides verified bank account details to claim their payout.

### Core Architecture Flow
```
[Sender / Well-Wisher] 
       │ 1. Initialize holding payment (/api/v1/payments/initialize)
       ▼
[Kora Payment Gateway] ── (Card / Bank Transfer / USSD)
       │
       ▼ 2. Async Webhook (/api/v1/payments/webhook with HMAC-SHA256 signature)
[Backend Webhook Handler]
       │ 3. Double-Check Verification (/v1/charges/{reference})
       ▼
[Firestore / Vault Holding] ── (Gift Status: 'holding' with passcode)
       │
       │ 4. Celebrant unlocks with secret passcode & verifies bank account
       ▼
[Kora Disbursement Engine] ── (/v1/transactions/disburse)
       │
       ▼ 5. Direct Bank Settlement
[Celebrant Nigerian Bank Account]
```

---

## 🔐 1. Environment & Secrets Configuration

| Variable Name | Description | Example / Default | Location |
| :--- | :--- | :--- | :--- |
| `KORA_SECRET_KEY` | Merchant Private API Secret Key | `sk_test_...` / `sk_live_...` | Server Environment / `.env` |
| `KORA_PUBLIC_KEY` | Merchant Public Key for client checkout | `pk_test_...` / `pk_live_...` | Client Environment |
| `KORA_BASE_URL` | Kora Merchant API Endpoint | `https://api.korapay.com/merchant` | Server Constant |

> ⚠️ **Security Mandate**: Never expose `KORA_SECRET_KEY` in frontend bundles or client-side scripts. All cryptographic signature verification and server-side verification must occur in secure server routes.

---

## 💳 2. Endpoint 1: Payment Checkout Initialization

### `POST /api/v1/payments/initialize`
Initiates a Kora checkout session and generates an active `checkout_url` for redirect or in-app payment.

#### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <KORA_SECRET_KEY>
```

#### Request Payload Schema
```json
{
  "amount": 10000.0,
  "currency": "NGN",
  "reference": "BW-HOLDING-1718000000-4821",
  "narration": "Birthwish Holding Gift for Amaka",
  "notification_url": "https://your-domain.com/api/v1/payments/webhook",
  "customer": {
    "name": "Chisom Emmanuel",
    "email": "chisom@example.com"
  }
}
```

#### Successful Response (`200 OK`)
```json
{
  "status": true,
  "message": "Initialization successful",
  "data": {
    "checkout_url": "https://checkout.korapay.com/pay/ch_test_9876543210",
    "reference": "BW-HOLDING-1718000000-4821"
  }
}
```

---

## 🎣 3. Endpoint 2: Cryptographic Webhook Receiver

### `POST /api/v1/payments/webhook`
Receives asynchronous payment settlement notifications from Kora. Implements HMAC-SHA256 origin authentication and the Double-Check Pattern.

### 🛡️ Webhook Security & Verification Algorithm

1. **Header Inspection**:
   Kora sends a request header `x-korapay-signature` containing an HMAC-SHA256 hex digest.
2. **Inner Data Object Hashing**:
   ⚠️ **CRITICAL KORA SPECIFICATION**: Kora signs **ONLY** the inner `data` dictionary of the root payload, **not** the entire raw HTTP body string.
3. **Serialization Uniformity**:
   Serialize the inner `data` JSON dictionary using compact separators without trailing whitespace (`separators=(',', ':')` in Python or canonical compact JSON in Node.js).
4. **Crypto HMAC Comparison**:
   Compute `HMAC_SHA256(key=KORA_SECRET_KEY, message=compact_serialized_data)` and compare using a time-constant algorithm (e.g. `hmac.compare_digest` / `crypto.timingSafeEqual`) to defeat timing attacks.
5. **The Double-Check Pattern**:
   Do not trust webhook notification status alone. Upon receiving `status: "success"`, issue an independent out-of-band `GET /v1/charges/{reference}` verification call to Kora's API before updating persistent storage or issuing credits.

#### Sample Webhook Payload
```json
{
  "event": "charge.success",
  "data": {
    "reference": "BW-HOLDING-1718000000-4821",
    "amount": 10000.0,
    "fee": 150.0,
    "currency": "NGN",
    "status": "success",
    "customer": {
      "name": "Chisom Emmanuel",
      "email": "chisom@example.com"
    },
    "payment_method": "card"
  }
}
```

---

## 🛡️ 4. Out-of-Band Double-Check Verification

### `GET https://api.korapay.com/merchant/v1/charges/{reference}`
Confirms authoritative transaction status directly from Kora.

#### Response Structure
```json
{
  "status": true,
  "message": "Charge retrieved successfully",
  "data": {
    "reference": "BW-HOLDING-1718000000-4821",
    "status": "success",
    "amount": 10000.0,
    "currency": "NGN",
    "paid_at": "2026-10-11T12:00:00Z"
  }
}
```

---

## 🏦 5. Celebrant Bank Resolution & Disbursement

When the celebrant unlocks their cash gift with the secret passcode, Birthwish invokes Kora's Nigerian Inter-Bank Settlement System:

### 1. Bank Account Name Resolution (`POST /v1/misc/banks/resolve`)
Resolves a 10-digit NUBAN account number against Nigerian commercial and microfinance banks (Access, GTBank, Zenith, Kuda, Moniepoint, OPay, PalmPay, etc.).
```json
{
  "bank": "058",
  "account": "0123456789"
}
```

### 2. Fund Disbursement (`POST /v1/transactions/disburse`)
Transfers the held cash gift directly to the verified celebrant's bank account.
```json
{
  "reference": "BW-DISBURSE-1718000000-9124",
  "destination": {
    "type": "bank_account",
    "amount": 10000.0,
    "currency": "NGN",
    "narration": "Birthwish Birthday Gift for Amaka",
    "bank_account": {
      "bank": "058",
      "account": "0123456789"
    },
    "customer": {
      "name": "Amaka Grace",
      "email": "amaka@example.com"
    }
  }
}
```

---

## 🚀 6. Server Reference Implementations

### Python (FastAPI & HTTPX)
```bash
pip install fastapi uvicorn httpx pydantic
uvicorn main:app --reload
```
```python
import os, hmac, hashlib, json, httpx
from fastapi import FastAPI, Request, Header, HTTPException, status
from pydantic import BaseModel, EmailStr

app = FastAPI(title="Kora Payment Integration Engine")
KORA_SECRET_KEY = os.getenv("KORA_SECRET_KEY", "sk_test_YourSecretKeyGoesHere")
KORA_BASE_URL = "https://api.korapay.com/merchant"

class CustomerInfo(BaseModel):
    name: str
    email: EmailStr

class PaymentInitializationPayload(BaseModel):
    amount: float
    currency: str = "NGN"
    reference: str
    narration: str
    notification_url: str
    customer: CustomerInfo

@app.post("/api/v1/payments/initialize")
async def initialize_payment(payload: PaymentInitializationPayload):
    url = f"{KORA_BASE_URL}/v1/charges/initialize"
    headers = {"Authorization": f"Bearer {KORA_SECRET_KEY}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload.model_dump(), headers=headers)
        data = res.json()
        if res.status_code == 200 and data.get("status") is True:
            return data
        raise HTTPException(status_code=400, detail=data.get("message", "Initialization Failed"))

@app.post("/api/v1/payments/webhook")
async def kora_webhook(request: Request, x_korapay_signature: str = Header(None)):
    if not x_korapay_signature:
        raise HTTPException(status_code=401, detail="Missing signature header.")
    body = await request.body()
    payload = json.loads(body)
    data_obj = payload.get("data", {})
    serialized = json.dumps(data_obj, separators=(',', ':'))
    computed = hmac.new(KORA_SECRET_KEY.encode(), serialized.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(computed, x_korapay_signature):
        raise HTTPException(status_code=401, detail="Invalid signature origin.")
    
    reference = data_obj.get("reference")
    if data_obj.get("status") == "success" and await double_check(reference):
        # Update Firestore / database giftStatus to 'holding'
        pass
    return {"status": "received"}

async def double_check(reference: str) -> bool:
    url = f"{KORA_BASE_URL}/v1/charges/{reference}"
    headers = {"Authorization": f"Bearer {KORA_SECRET_KEY}"}
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=headers)
        if res.status_code == 200:
            data = res.json()
            return data.get("status") is True and data.get("data", {}).get("status") == "success"
    return False
```

### TypeScript / Node.js (Express & Crypto)
```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY || 'sk_test_YourSecretKeyGoesHere';
const KORA_BASE_URL = 'https://api.korapay.com/merchant';

app.post('/api/v1/payments/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-korapay-signature'] as string;
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature header' });
  }

  const dataObj = req.body.data || {};
  const serialized = JSON.stringify(dataObj);
  const computedHash = crypto
    .createHmac('sha256', KORA_SECRET_KEY)
    .update(serialized)
    .digest('hex');

  if (computedHash !== signature) {
    return res.status(401).json({ error: 'Invalid signature origin verification' });
  }

  const { reference, status } = dataObj;
  if (status === 'success') {
    // Execute double-check verification out-of-band
    const checkRes = await fetch(`${KORA_BASE_URL}/v1/charges/${reference}`, {
      headers: { Authorization: `Bearer ${KORA_SECRET_KEY}` },
    });
    const checkData = await checkRes.json();
    if (checkData.status === true && checkData.data?.status === 'success') {
      console.log(`Payment confirmed: ${reference}`);
    }
  }

  return res.status(200).json({ status: 'received' });
});
```
