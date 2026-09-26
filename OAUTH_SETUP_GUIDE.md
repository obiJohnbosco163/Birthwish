# Why Google & GitHub OAuth "Refuse to Connect" in Supabase & How to Fix (or Tag as Coming Soon)

### Why this happens:
When you click **"Continue with Google"** or **"Continue with GitHub"**, Supabase initiates an OAuth 2.0 handshake. By default in a fresh Supabase project:
1. **GitHub Provider is DISABLED** in your Supabase dashboard until you create a GitHub OAuth App and provide Client ID + Client Secret.
2. **Google Provider is DISABLED** in your Supabase dashboard until you configure a Google Cloud Console OAuth Client ID + Secret.
3. The Redirect URL must be whitelisted in Supabase under:
   `Authentication -> URL Configuration -> Redirect URLs`

---

### Step-by-Step Instructions to enable them manually in Supabase:

#### 1. Enabling GitHub OAuth:
1. Go to your GitHub account: **Settings -> Developer Settings -> OAuth Apps -> New OAuth App**
   - Application Name: `Birthwish`
   - Homepage URL: `https://pduilappwormmqgpusgv.supabase.co`
   - Authorization callback URL: `https://pduilappwormmqgpusgv.supabase.co/auth/v1/callback`
2. Click **Register Application**, then generate a **Client Secret**.
3. Open your Supabase Dashboard:
   `https://supabase.com/dashboard/project/pduilappwormmqgpusgv/auth/providers`
4. Toggle **GitHub** to **ON**, paste your **Client ID** and **Client Secret**, and click **Save**.

#### 2. Enabling Google OAuth:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create OAuth 2.0 Client ID (Web Application):
   - Authorized redirect URIs: `https://pduilappwormmqgpusgv.supabase.co/auth/v1/callback`
3. In your Supabase Dashboard:
   `https://supabase.com/dashboard/project/pduilappwormmqgpusgv/auth/providers`
4. Toggle **Google** to **ON**, paste your **Client ID** and **Client Secret**, and click **Save**.

---

### In the Meantime:
As requested, we have:
1. Tagged both Google and GitHub as **"Coming Soon"** on the landing page so users are not confused or blocked by third-party browser redirects.
2. Added an informative dialog when clicked explaining how to sign in or enable credentials.
3. Made **Email & Password Sign Up & Sign In** fully functional and prominent with:
   - Full Name
   - Email
   - Password
   - Date of Birth (Day, Month, Year select pickers)
   - Gender (Female, Male, Custom)
   - Direct integration into `auth.users` and `public.profiles`.
