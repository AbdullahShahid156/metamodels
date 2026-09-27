# Supabase Email Template Setup — OTP Code Verification

## How to Set It Up

1. Go to your **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select the **"Confirm signup"** template  
3. **Important**: Under the email template settings, enable **"Use OTP instead of link"** (this is the toggle that makes Supabase send a 6-digit code instead of a magic link)
4. Replace the existing HTML with the template below
5. Click **Save**

---

## HTML Template to Paste

Copy everything below this line and paste it into the **"Confirm signup"** email template body:

```html
<html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
      
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background-color: #0C0F1A;
        color: #F5F5F0;
      }
      
      .container {
        max-width: 480px;
        margin: 0 auto;
        padding: 40px 24px;
      }
      
      .card {
        background: linear-gradient(145deg, rgba(20, 24, 40, 0.95), rgba(28, 32, 53, 0.9));
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 20px;
        padding: 40px 32px;
        text-align: center;
      }
      
      .logo-wrapper {
        margin-bottom: 28px;
      }
      
      .logo-icon {
        display: inline-block;
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #E2B340, #F59E0B);
        border-radius: 14px;
        line-height: 48px;
        font-size: 22px;
        font-weight: 800;
        color: #0C0F1A;
      }
      
      .logo-text {
        font-size: 22px;
        font-weight: 700;
        color: #FFFFFF;
        margin-top: 12px;
        letter-spacing: -0.02em;
      }
      
      .logo-text span {
        background: linear-gradient(135deg, #E2B340, #F59E0B);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      h1 {
        font-size: 24px;
        font-weight: 800;
        color: #FFFFFF;
        margin: 0 0 8px 0;
        letter-spacing: -0.03em;
      }
      
      .subtitle {
        font-size: 14px;
        color: #94A3B8;
        margin: 0 0 32px 0;
        line-height: 1.5;
      }
      
      .code-box {
        background: rgba(226, 179, 64, 0.08);
        border: 2px dashed rgba(226, 179, 64, 0.3);
        border-radius: 16px;
        padding: 24px;
        margin: 0 0 24px 0;
      }
      
      .code {
        font-size: 40px;
        font-weight: 800;
        letter-spacing: 12px;
        color: #F0D060;
        font-family: 'Inter', monospace;
        text-indent: 12px;
      }
      
      .code-label {
        font-size: 11px;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 600;
        margin-top: 8px;
      }
      
      .note {
        font-size: 13px;
        color: #6B7280;
        line-height: 1.6;
        margin: 0;
      }
      
      .note strong {
        color: #94A3B8;
      }
      
      .divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
        margin: 24px 0;
      }
      
      .footer {
        text-align: center;
        padding-top: 20px;
      }
      
      .footer p {
        font-size: 11px;
        color: #6B7280;
        margin: 0;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="logo-wrapper">
          <div class="logo-icon">⚡</div>
          <div class="logo-text">Meta<span>Models</span></div>
        </div>
        
        <h1>Verify Your Email</h1>
        <p class="subtitle">
          Enter this code on the verification screen to complete your signup.
        </p>
        
        <div class="code-box">
          <div class="code">{{ .Token }}</div>
          <div class="code-label">Verification Code</div>
        </div>
        
        <p class="note">
          This code expires in <strong>60 minutes</strong>.<br/>
          If you didn't create an account, you can safely ignore this email.
        </p>
        
        <div class="divider"></div>
        
        <p class="note" style="font-size: 12px;">
          Need help? Reply to this email or visit our support page.
        </p>
      </div>
      
      <div class="footer">
        <p>© 2026 MetaModels. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
```

---

## Important Supabase Settings

| Setting | Value |
|---------|-------|
| **Subject** | `Your MetaModels verification code` |
| **OTP Expiry** | 3600 seconds (1 hour) — default |
| **Enable OTP** | ✅ Must be toggled ON under "Confirm signup" template |

> **⚠️ The key step**: You MUST enable the toggle **"Use OTP instead of link"** in the Supabase dashboard under Authentication → Email Templates → Confirm signup. Without this toggle, Supabase will send a link instead of a code, and the `{{ .Token }}` variable won't render.
