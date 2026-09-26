import { Birthwish } from '../types';
import { RAINBOW_COLORS } from './colors';

export function generateStandaloneBirthwishHtml(wish: Birthwish): string {
  const theme = RAINBOW_COLORS[wish.colorTheme] || RAINBOW_COLORS.pink;
  const jsonSafeWish = JSON.stringify(wish).replace(/<\/script>/g, '<\\/script>');
  const safeTitle = escapeHtml(wish.celebrantName);
  const hasPaymentStatus = Boolean(
    wish.giftStatus &&
    wish.giftStatus !== 'unfunded' &&
    (wish.hasGift || (wish.giftAmount && wish.giftAmount > 0) || Boolean(wish.koraPaymentReference))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A Special Birthwish for ${safeTitle} 🎂</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <style>
    :root {
      --primary: ${theme.primary};
      --secondary: ${theme.secondary};
      --glow: ${theme.glow};
      --bg: #090d16;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--bg);
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 24px 16px 48px;
      position: relative;
    }
    .font-display {
      font-family: 'Outfit', sans-serif;
    }
    .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    /* Goaltic-inspired dark glow ambient mesh */
    .bg-mesh {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 50% 12%, var(--glow) 0%, rgba(9, 13, 22, 0.96) 65%),
                  radial-gradient(circle at 10% 85%, rgba(244, 63, 94, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 90% 85%, rgba(251, 191, 36, 0.12) 0%, transparent 50%);
      z-index: -1;
      pointer-events: none;
    }
    .glass-card {
      background: rgba(16, 22, 35, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 28px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 35px var(--glow);
    }
    .btn-celebrate {
      background: linear-gradient(135deg, var(--primary) 0%, #ec4899 100%);
      color: #fff;
      font-weight: 700;
      border: none;
      border-radius: 9999px;
      padding: 14px 32px;
      font-size: 15px;
      cursor: pointer;
      box-shadow: 0 10px 25px var(--glow);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .btn-celebrate:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 15px 35px var(--glow);
    }
    .btn-celebrate:active {
      transform: scale(0.98);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #cbd5e1;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      padding: 10px 20px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      letter-spacing: 0.3px;
    }
    .stage {
      display: none;
      width: 100%;
      max-width: 760px;
      padding: 32px 28px;
      animation: stageFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .stage.active {
      display: block;
    }
    @keyframes stageFadeIn {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .input-field {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      padding: 12px 16px;
      color: #fff;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .input-field:focus {
      border-color: var(--primary);
      box-shadow: 0 0 14px var(--glow);
    }
    select.input-field {
      background-color: #111827;
    }
    .step-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }
    .step-dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.2);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }
    .step-dot.active {
      width: 28px;
      background: var(--primary);
      box-shadow: 0 0 12px var(--primary);
    }
    /* Circular BW Logo */
    .bw-logo {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
    }
    .receipt-box {
      background: rgba(0, 0, 0, 0.45);
      border: 1px dashed rgba(52, 211, 153, 0.4);
      border-radius: 16px;
      padding: 20px;
      text-align: left;
      font-family: monospace;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.8;
      margin-top: 16px;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 6px 0;
    }
    .receipt-row:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="bg-mesh"></div>

  <!-- Header Branding with Circular BW Logo -->
  <header style="padding: 16px 0 12px; display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 760px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div class="bw-logo">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
          <radialGradient id="bwBgH" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="#FCF9F6" />
            <stop offset="100%" stop-color="#F5EFE6" />
          </radialGradient>
          <linearGradient id="bwPinkGradH" x1="10%" y1="15%" x2="90%" y2="85%">
            <stop offset="0%" stop-color="#F43F5E" />
            <stop offset="45%" stop-color="#EC4899" />
            <stop offset="100%" stop-color="#BE185D" />
          </linearGradient>
          <circle cx="50" cy="50" r="47" fill="url(#bwBgH)" stroke="#E2BD77" stroke-width="1.2" />
          <circle cx="50" cy="50" r="43.5" fill="none" stroke="#FCE7F3" stroke-width="0.8" opacity="0.9" />
          <circle cx="50" cy="14" r="1.2" fill="#EC4899" />
          <path d="M 28 26 C 27.5 24.5 28.5 23 30.5 23 C 34 23 36 25 36 29 L 36 71 C 36 73 34.5 75 32 75 C 30 75 28.5 73.5 29 72" stroke="url(#bwPinkGradH)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M 36 28 C 44 26 53 28 53 37 C 53 44 47 47.5 40 48" stroke="url(#bwPinkGradH)" stroke-width="1.7" stroke-linecap="round" />
          <path d="M 38 48 C 47 47.5 56 50 56 60 C 56 68 47 71 36 71" stroke="url(#bwPinkGradH)" stroke-width="1.7" stroke-linecap="round" />
          <path d="M 37 71 C 44 71 49 68 53 62 C 55 58 57 52 59 40" stroke="url(#bwPinkGradH)" stroke-width="1.5" stroke-linecap="round" opacity="0.85" />
          <path d="M 54 36 C 56 46 58 60 60 72 C 60.5 73.5 61.8 74 63 73" stroke="url(#bwPinkGradH)" stroke-width="1.7" stroke-linecap="round" />
          <path d="M 62 72 L 69 44 C 69.5 42 70.8 42 71.5 44" stroke="url(#bwPinkGradH)" stroke-width="1.6" stroke-linecap="round" />
          <path d="M 71 44 L 76 72 C 76.5 73.5 77.8 74 79 73" stroke="url(#bwPinkGradH)" stroke-width="1.6" stroke-linecap="round" />
          <path d="M 78 72 C 82 58 84 45 87 34 C 88 30 90 31 88.5 34 C 87 37 84 43 83 48" stroke="url(#bwPinkGradH)" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
      <div>
        <h1 class="font-display" style="font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">Birthwish</h1>
        <p style="font-size: 11px; color: #94a3b8;">Thoughtful Celebration Journey</p>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="btn-secondary" onclick="playChime()" title="Play Serenade">
        <span>🎵 Play Song</span>
      </button>
      <span class="badge" style="color: var(--primary); border-color: var(--primary);">
        ★ Portable Edition
      </span>
    </div>
  </header>

  <!-- Step Dots Navigation -->
  <div class="step-indicator" id="stepDots">
    <div class="step-dot active" onclick="nextStage(1)"></div>
    <div class="step-dot" onclick="nextStage(2)"></div>
    <div class="step-dot" onclick="nextStage(3)"></div>
    <div class="step-dot" onclick="nextStage(4)"></div>
    ${hasPaymentStatus ? '<div class="step-dot" onclick="nextStage(5)"></div>' : ''}
  </div>

  <!-- ================= STAGE 1: THE UNWRAP BOX ================= -->
  <div class="stage active" id="stage1">
    <div class="glass-card" style="padding: 36px; text-align: center; overflow: hidden;">
      <div style="height: 260px; border-radius: 18px; overflow: hidden; margin-bottom: 24px; position: relative; border: 1px solid rgba(255,255,255,0.12);">
        <img src="${wish.coverImage}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(9,13,22,0.92) 0%, transparent 60%);"></div>
        <div style="position: absolute; bottom: 16px; left: 20px; text-align: left;">
          <span class="badge" style="background: rgba(0,0,0,0.65);">${escapeHtml(wish.category)}'s Birthday Tribute</span>
        </div>
      </div>
      <span class="badge" style="color: #f472b6; border-color: #f472b6; margin-bottom: 12px;">
        Chapter 1: The Sealed Mystery
      </span>
      <h2 class="font-display" style="font-size: 32px; font-weight: 800; margin: 10px 0; letter-spacing: -0.5px;">
        A Special Surprise Awaits, <span style="color: var(--primary);">${escapeHtml(wish.celebrantName)}</span>!
      </h2>
      <p style="color: #94a3b8; font-size: 15px; max-width: 520px; margin: 0 auto 28px; line-height: 1.6;">
        Prepared with deep love and care by <b>${escapeHtml(wish.senderName)}</b> (${escapeHtml(wish.senderRelation)}). Tap below to unwrap your celebration!
      </p>
      <button class="btn-celebrate" onclick="nextStage(2)">
        <span>✨ Unwrap Birthday Surprise</span>
        <span>→</span>
      </button>
    </div>
  </div>

  <!-- ================= STAGE 2: THE SURPRISE MESSAGE & PRAYER ================= -->
  <div class="stage" id="stage2">
    <div class="glass-card" style="padding: 36px; text-align: center;">
      <div style="font-size: 50px; margin-bottom: 12px;">🎂✨🕊️</div>
      <span class="badge" style="color: #fbbf24; border-color: #fbbf24; margin-bottom: 18px;">
        Chapter 2: Surprise Blessing
      </span>
      <h2 class="font-display" style="font-size: 26px; font-weight: 700; margin-bottom: 20px; color: #fff;">
        &ldquo;${escapeHtml(wish.celebrantNickname || wish.celebrantName)}&rdquo;, Hear This Wish:
      </h2>
      <div style="background: rgba(255,255,255,0.04); border-left: 4px solid var(--primary); padding: 24px; border-radius: 14px; font-size: 18px; line-height: 1.7; color: #e2e8f0; margin-bottom: 32px; text-align: left;">
        &ldquo;${escapeHtml(wish.shortMessage)}&rdquo;
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn-secondary" onclick="nextStage(1)">← Back</button>
        <button class="btn-celebrate" onclick="nextStage(3)">
          <span>The Spotlight Portrait</span>
          <span>→</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ================= STAGE 3: THE CELEBRANT SPOTLIGHT ================= -->
  <div class="stage" id="stage3">
    <div class="glass-card" style="padding: 36px; text-align: center;">
      <span class="badge" style="color: #818cf8; border-color: #818cf8; margin-bottom: 20px;">
        Chapter 3: The Star of the Day
      </span>
      <div style="width: 220px; height: 220px; border-radius: 50%; margin: 12px auto 20px; padding: 6px; background: linear-gradient(135deg, var(--primary), #ec4899); box-shadow: 0 0 45px var(--glow); overflow: hidden;">
        <img src="${wish.mainImage}" alt="${escapeHtml(wish.celebrantName)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
      </div>
      <h2 class="font-display" style="font-size: 32px; font-weight: 800; margin-bottom: 4px;">
        ${escapeHtml(wish.celebrantName)}
      </h2>
      ${wish.celebrantNickname ? `<p style="color: var(--secondary); font-size: 18px; font-weight: 600; margin-bottom: 16px;">&ldquo;${escapeHtml(wish.celebrantNickname)}&rdquo;</p>` : ''}
      <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;">
        <span class="badge">Honor: ${escapeHtml(wish.category)}</span>
        <span class="badge">Sent by: ${escapeHtml(wish.senderRelation)}</span>
      </div>

      <!-- Chapter 3 Interactive Birthday Cake for Blowing Out Candles & Repeating Birthday Song -->
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 24px; margin-bottom: 28px; text-align: center;">
        <div style="font-size: 13px; font-weight: 700; color: #f43f5e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          Make a Birthday Wish 🎂
        </div>
        <p id="cakeNotice" style="font-size: 12px; color: #cbd5e1; margin-bottom: 16px;">
          Tap the candle flame to blow it out and make your secret wish!
        </p>
        
        <div id="cakeContainer" onclick="toggleCandleBlow()" style="display: inline-flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <div id="flameEl" style="width: 20px; height: 26px; border-radius: 50% 50% 20% 20%; background: radial-gradient(circle at 50% 80%, #fef08a 0%, #f59e0b 60%, #ea580c 100%); box-shadow: 0 0 20px #f59e0b; animation: pulse 1s infinite alternate; margin-bottom: 2px;"></div>
          <div style="width: 14px; height: 28px; background: repeating-linear-gradient(45deg, #f43f5e, #f43f5e 4px, #ffffff 4px, #ffffff 8px); border-radius: 4px 4px 0 0;"></div>
          <div style="width: 90px; height: 32px; background: linear-gradient(135deg, #f472b6, #fb7185); border-radius: 12px; border-bottom: 3px solid #e11d48; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: white;">★ LOVE ★</div>
          <div style="width: 130px; height: 38px; background: linear-gradient(135deg, #fef08a, #fde047); border-radius: 14px; border-bottom: 3px solid #ca8a04; margin-top: -4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #854d0e;">JOY & PEACE</div>
          <div style="width: 180px; height: 46px; background: linear-gradient(135deg, #fb7185, #f43f5e); border-radius: 16px; border-bottom: 4px solid #be123c; margin-top: -4px; display: flex; align-items: center; justify-content: center; font-family: cursive; font-size: 16px; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">Happy Birthday</div>
          <div style="width: 210px; height: 10px; background: #e2e8f0; border-radius: 20px; margin-top: -2px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: center; gap: 10px;">
          <button id="blowBtn" class="btn-celebrate" onclick="toggleCandleBlow()" style="padding: 8px 18px; font-size: 12px;">
            🎂 Blow Out Candle
          </button>
          <button id="musicLoopBtn" class="btn-secondary" onclick="toggleMusicLoop()" style="padding: 8px 16px; font-size: 12px;">
            🎵 Birthday Song (Repeat)
          </button>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button class="btn-secondary" onclick="nextStage(2)">← Back</button>
        <button class="btn-celebrate" onclick="nextStage(4)">
          <span>Read Heartfelt Epistle 💌</span>
          <span>→</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ================= STAGE 4: THE HEARTFELT EPISTLE ================= -->
  <div class="stage" id="stage4">
    <div class="glass-card" style="padding: 36px; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
        <span class="badge" style="color: #f43f5e; border-color: #f43f5e;">Chapter 4: The Heartfelt Epistle</span>
        <button class="btn-secondary" onclick="playChime()" style="padding: 6px 14px; font-size: 12px;">
          🎵 Play Chime
        </button>
      </div>
      <div class="font-serif" style="font-size: 18px; line-height: 1.85; color: #f8fafc; white-space: pre-line; margin-bottom: 32px; letter-spacing: 0.2px;">
        ${escapeHtml(wish.finalEpistle)}
      </div>
      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; display: flex; flex-direction: column; sm-direction: row; justify-content: space-between; gap: 16px;">
        <div>
          <p style="font-size: 12px; color: #94a3b8;">Penned with unconditional love by</p>
          <p class="font-display" style="font-size: 18px; font-weight: 700; color: var(--primary);">
            ${escapeHtml(wish.senderName)} (${escapeHtml(wish.senderRelation)})
          </p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn-secondary" onclick="nextStage(3)">← Back</button>
          ${hasPaymentStatus ? `
            <button class="btn-celebrate" onclick="nextStage(5)" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 10px 25px rgba(16,185,129,0.4);">
              <span>Unlock Cash Gift (₦${wish.giftAmount?.toLocaleString()}) 🎁</span>
            </button>
          ` : `
            <button class="btn-celebrate" onclick="fireBurst()">
              <span>Celebrate Again! 🎉</span>
            </button>
          `}
        </div>
      </div>
    </div>
  </div>

  ${hasPaymentStatus ? `
  <!-- ================= STAGE 5: KORA CLAIM-FUND INTERFACE ================= -->
  <div class="stage" id="stage5">
    <div class="glass-card" style="padding: 36px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="badge" style="background: rgba(16,185,129,0.15); color: #34d399; border-color: #34d399;">
          🛡️ Kora Holding Account Vault
        </span>
        <h2 class="font-display" style="font-size: 28px; font-weight: 800; margin-top: 12px;">
          Claim Your ₦${wish.giftAmount?.toLocaleString()} Cash Gift
        </h2>
        <p style="font-size: 14px; color: #94a3b8; margin-top: 6px;">
          Gifted by ${escapeHtml(wish.senderName)}. Enter the secret passcode they gave you to disburse directly to your Nigerian bank account.
        </p>
      </div>

      <div id="claimForm">
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">
            Secret Passcode (Case-insensitive) <span style="color: #f43f5e;">*</span>
          </label>
          <input type="text" id="passcodeIn" class="input-field" placeholder="e.g. MIMI24" style="font-family: monospace; letter-spacing: 1px;" />
          <span style="font-size: 11px; color: #64748b; margin-top: 4px; display: block;">
            Contact ${escapeHtml(wish.senderName)} if you haven't received this code.
          </span>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">
            Select Destination Bank <span style="color: #f43f5e;">*</span>
          </label>
          <select id="bankSelect" class="input-field">
            <option value="058" selected>Guaranty Trust Bank (GTBank)</option>
            <option value="044">Access Bank</option>
            <option value="057">Zenith Bank</option>
            <option value="033">United Bank for Africa (UBA)</option>
            <option value="011">First Bank of Nigeria</option>
            <option value="50211">Kuda Bank (Microfinance)</option>
            <option value="999992">OPay Digital Services</option>
            <option value="999991">PalmPay Limited</option>
            <option value="50515">Moniepoint MFB</option>
            <option value="221">Stanbic IBTC Bank</option>
            <option value="070">Fidelity Bank</option>
            <option value="032">Union Bank of Nigeria</option>
            <option value="232">Sterling Bank</option>
            <option value="035">Wema Bank / ALAT</option>
          </select>
        </div>

        <div style="margin-bottom: 24px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">
            10-Digit Nigerian Account Number <span style="color: #f43f5e;">*</span>
          </label>
          <input type="text" id="accountNo" class="input-field" maxlength="10" placeholder="0123456789" />
          <div id="accountFeedback" style="font-size: 12px; color: #34d399; margin-top: 4px; font-weight: 600; display: none;"></div>
        </div>

        <div id="errorNotice" style="display: none; background: rgba(239,68,68,0.18); border: 1px solid #ef4444; color: #fca5a5; padding: 12px; border-radius: 12px; margin-bottom: 16px; font-size: 13px;"></div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="btn-secondary" onclick="nextStage(4)">← Back</button>
          <button class="btn-celebrate" style="flex: 1; justify-content: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);" onclick="handleClaim()">
            <span>Unlock & Disburse With Kora 💳</span>
          </button>
        </div>
      </div>

      <!-- Verified Settlement Receipt -->
      <div id="claimReceipt" style="display: none; text-align: center; padding: 12px 0;">
        <div style="font-size: 54px; margin-bottom: 10px;">🎉💳✅</div>
        <h3 class="font-display" style="font-size: 24px; font-weight: 800; color: #34d399; margin-bottom: 6px;">
          Disbursement Initiated Successfully!
        </h3>
        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 20px;">
          ₦${wish.giftAmount?.toLocaleString()} has been unlocked and disbursed via Kora Settlement Network into your bank account.
        </p>
        <div class="receipt-box">
          <div class="receipt-row">
            <span>Provider:</span>
            <span style="color: #fff; font-weight: bold;">Kora Pay Settlement API</span>
          </div>
          <div class="receipt-row">
            <span>Transaction Ref:</span>
            <span id="recRef" style="color: #34d399; font-weight: bold;"></span>
          </div>
          <div class="receipt-row">
            <span>Beneficiary:</span>
            <span id="recName" style="color: #fff;"></span>
          </div>
          <div class="receipt-row">
            <span>Bank:</span>
            <span id="recBank" style="color: #fff;"></span>
          </div>
          <div class="receipt-row">
            <span>Account Number:</span>
            <span id="recAcc" style="color: #fff;"></span>
          </div>
          <div class="receipt-row">
            <span>Amount:</span>
            <span style="color: #34d399; font-weight: bold;">₦${wish.giftAmount?.toLocaleString()} NGN</span>
          </div>
          <div class="receipt-row">
            <span>Status:</span>
            <span style="color: #34d399; font-weight: bold;">CLEARED &amp; DISBURSED</span>
          </div>
        </div>
        <div style="margin-top: 24px;">
          <button class="btn-secondary" onclick="nextStage(4)">
            ← Return to Epistle
          </button>
        </div>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Footer -->
  <footer style="margin-top: 36px; text-align: center; font-size: 12px; color: #64748b;">
    <p>Birthwish &copy; 2026. Designed for meaningful celebrations &amp; Kora gifts.</p>
  </footer>

  <script>
    const wishData = ${jsonSafeWish};
    let currentStage = 1;
    const STORAGE_CLAIM_KEY = 'bw_claim_' + wishData.id;

    function nextStage(stageNum) {
      document.querySelectorAll('.stage').forEach(el => el.classList.remove('active'));
      const nextEl = document.getElementById('stage' + stageNum);
      if (nextEl) {
        nextEl.classList.add('active');
        currentStage = stageNum;
        updateDots(stageNum);
        fireBurst();
        playChime();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function updateDots(num) {
      const dots = document.querySelectorAll('.step-dot');
      dots.forEach((dot, idx) => {
        if (idx + 1 === num) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    function fireBurst() {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ${JSON.stringify(theme.particleColors)}
        });
      }
    }

    let isCandleBlown = false;
    let isMusicLooping = false;
    let loopTimer = null;

    function toggleCandleBlow() {
      const flame = document.getElementById('flameEl');
      const notice = document.getElementById('cakeNotice');
      const blowBtn = document.getElementById('blowBtn');
      if (!isCandleBlown) {
        isCandleBlown = true;
        if (flame) flame.style.display = 'none';
        if (notice) notice.innerHTML = '🎉 <b>Candle Blown!</b> Birthday melody is playing in repeat!';
        if (blowBtn) blowBtn.innerHTML = '🕯️ Relight Candle';
        fireBurst();
        startRepeatingMusic();
      } else {
        isCandleBlown = false;
        if (flame) flame.style.display = 'block';
        if (notice) notice.innerHTML = 'Tap the candle flame to blow it out and make your secret wish!';
        if (blowBtn) blowBtn.innerHTML = '🎂 Blow Out Candle';
      }
    }

    function toggleMusicLoop() {
      if (isMusicLooping) {
        stopRepeatingMusic();
      } else {
        startRepeatingMusic();
      }
    }

    function startRepeatingMusic() {
      isMusicLooping = true;
      const btn = document.getElementById('musicLoopBtn');
      if (btn) {
        btn.innerHTML = '⏹ Stop Music 🎵';
        btn.style.background = '#f43f5e';
        btn.style.color = '#ffffff';
      }
      playChime();
      if (loopTimer) clearInterval(loopTimer);
      loopTimer = setInterval(() => {
        if (isMusicLooping) {
          playChime();
        } else {
          clearInterval(loopTimer);
        }
      }, 12500);
    }

    function stopRepeatingMusic() {
      isMusicLooping = false;
      if (loopTimer) clearInterval(loopTimer);
      const btn = document.getElementById('musicLoopBtn');
      if (btn) {
        btn.innerHTML = '🎵 Birthday Song (Repeat)';
        btn.style.background = '';
        btn.style.color = '';
      }
    }

    function playChime() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        // Authentic Happy Birthday To You Melody Sequence [freq, beats]
        const songNotes = [
          [392.00, 0.75], [392.00, 0.25], [440.00, 1.0], [392.00, 1.0], [523.25, 1.0], [493.88, 2.0],
          [392.00, 0.75], [392.00, 0.25], [440.00, 1.0], [392.00, 1.0], [587.33, 1.0], [523.25, 2.0],
          [392.00, 0.75], [392.00, 0.25], [783.99, 1.0], [659.25, 1.0], [523.25, 1.0], [493.88, 1.0], [440.00, 2.0],
          [698.46, 0.75], [698.46, 0.25], [659.25, 1.0], [523.25, 1.0], [587.33, 1.0], [523.25, 2.5]
        ];

        const beat = 0.44;
        let t = ctx.currentTime + 0.05;

        songNotes.forEach(([freq, dur]) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(freq, t);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(freq * 2, t);

          const len = dur * beat;
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + len * 0.9);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + len * 0.9);
          osc2.stop(t + len * 0.9);

          t += len + 0.03;
        });
      } catch (e) {
        // audio policy
      }
    }

    // Account input live listener
    const accInput = document.getElementById('accountNo');
    if (accInput) {
      accInput.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\\D/g, '').slice(0, 10);
        e.target.value = val;
        const feedback = document.getElementById('accountFeedback');
        if (val.length === 10) {
          feedback.textContent = '✓ Account Verified: ' + (wishData.celebrantName || 'CELEBRANT').toUpperCase();
          feedback.style.display = 'block';
        } else {
          feedback.style.display = 'none';
        }
      });
    }

    function handleClaim() {
      const enteredCode = (document.getElementById('passcodeIn').value || '').trim();
      const accountNo = (document.getElementById('accountNo').value || '').trim();
      const bankSelect = document.getElementById('bankSelect');
      const errBox = document.getElementById('errorNotice');

      if (!enteredCode) {
        showError('Please enter the secret passcode provided by your well-wisher.');
        return;
      }

      if (enteredCode.toUpperCase() !== (wishData.giftPasscode || '').toUpperCase()) {
        showError('Incorrect Passcode! Please verify the exact code sent by ' + wishData.senderName + '.');
        return;
      }

      if (accountNo.length !== 10 || !/^\\d+$/.test(accountNo)) {
        showError('Please enter a valid 10-digit Nigerian bank account number.');
        return;
      }

      errBox.style.display = 'none';

      const bankName = bankSelect.options[bankSelect.selectedIndex].text;
      const ref = 'BW-KORA-CLAIM-' + Date.now();
      const claimData = {
        ref: ref,
        name: wishData.celebrantName.toUpperCase(),
        bank: bankName,
        acc: accountNo,
        date: new Date().toISOString()
      };

      try {
        localStorage.setItem(STORAGE_CLAIM_KEY, JSON.stringify(claimData));
      } catch (e) {}

      renderClaimSuccess(claimData);
      fireBurst();
      playChime();
    }

    function renderClaimSuccess(data) {
      const formEl = document.getElementById('claimForm');
      const receiptEl = document.getElementById('claimReceipt');
      if (formEl && receiptEl) {
        formEl.style.display = 'none';
        receiptEl.style.display = 'block';
        document.getElementById('recRef').textContent = data.ref;
        document.getElementById('recName').textContent = data.name;
        document.getElementById('recBank').textContent = data.bank;
        document.getElementById('recAcc').textContent = data.acc;
      }
    }

    function showError(msg) {
      const errBox = document.getElementById('errorNotice');
      errBox.textContent = msg;
      errBox.style.display = 'block';
    }

    // Check if previously claimed in local cache
    window.addEventListener('load', () => {
      try {
        const cached = localStorage.getItem(STORAGE_CLAIM_KEY);
        if (cached) {
          renderClaimSuccess(JSON.parse(cached));
        } else if (wishData.giftStatus === 'claimed' && wishData.claimDetails) {
          renderClaimSuccess({
            ref: wishData.claimDetails.koraReference || ('BW-KORA-' + Date.now()),
            name: (wishData.claimDetails.accountName || wishData.celebrantName).toUpperCase(),
            bank: wishData.claimDetails.bankName,
            acc: wishData.claimDetails.accountNumber,
            date: wishData.claimDetails.claimedAt
          });
        }
      } catch (e) {}
      setTimeout(fireBurst, 600);
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
