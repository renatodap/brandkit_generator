# Supabase Authentication Setup Guide

## Issue: Email Verification Not Working

### Quick Fix (Development/Testing)

1. **Go to Supabase Dashboard** → Your Project → Authentication → Providers

2. **Click "Email" provider**

3. **Scroll down to "Confirm email"**
   - Toggle OFF (disable email confirmation)
   - This allows users to sign in immediately without email verification

4. **Save changes**

5. **Try creating account again** - should work instantly now

---

## Production Setup (With Email Verification)

### Step 1: Configure Redirect URLs

Go to **Authentication → URL Configuration**

**Add these redirect URLs:**
```
https://brandkit-generator-one.vercel.app/auth/callback
http://localhost:3000/auth/callback
https://brandkit-generator-one.vercel.app/
```

**Set Site URL to:**
```
https://brandkit-generator-one.vercel.app/
```

### Step 2: Configure Email Settings

Go to **Authentication → Email Templates**

**Verify these templates have correct redirect URLs:**

1. **Confirm signup template:**
   ```
   {{ .ConfirmationURL }}
   ```
   Should redirect to: `https://brandkit-generator-one.vercel.app/auth/callback?token=...`

2. **Check SMTP Settings** (optional):
   - Go to **Project Settings → Auth**
   - Configure custom SMTP if needed
   - Or use Supabase's default (limited to 4 emails/hour)

### Step 3: Test Email Flow

1. Sign up with a real email
2. Check inbox (and spam folder)
3. Click verification link
4. Should redirect to `/auth/callback` → then `/dashboard`

---

## Troubleshooting

### "Invalid login credentials" Error

**Possible causes:**
1. Email not verified yet (if confirmation is enabled)
2. Wrong password
3. User doesn't exist in database

**Check if user exists:**
- Go to Supabase → Authentication → Users
- Search for your email
- Check if user is listed and if "Email Confirmed" = true/false

### Email Not Received

**Check:**
1. Spam/junk folder
2. Supabase rate limits (4 emails/hour on free tier with default SMTP)
3. Email template configuration
4. SMTP settings

**Quick fix:**
- Disable "Confirm email" in Email provider settings
- Users can sign in immediately

### Auth Callback Not Working

**Verify:**
1. `/auth/callback` route exists (it does - we created it)
2. Redirect URL is in Supabase allow list
3. Site URL matches your deployment

---

## Current Configuration Needed

### Supabase Dashboard Settings

**Authentication → Providers → Email:**
- ✅ Enable Email provider: ON
- ⚠️ Confirm email: OFF (for testing) or ON (for production)
- ✅ Enable sign ups: ON

**Authentication → URL Configuration:**
- ✅ Site URL: `https://brandkit-generator-one.vercel.app/`
- ✅ Redirect URLs:
  - `https://brandkit-generator-one.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `https://brandkit-generator-one.vercel.app/`

**Authentication → Email Templates:**
- ✅ Confirm signup: Uses `{{ .ConfirmationURL }}`
- ✅ Reset password: Uses `{{ .ConfirmationURL }}`

---

## How Sign-Up Flow Should Work

### With Email Confirmation (Production)

1. User fills out `/sign-up` form
2. Supabase sends verification email
3. User clicks link in email
4. Link redirects to `/auth/callback?token=...`
5. Callback route exchanges token for session
6. User redirected to `/sign-in` with success message
7. User can now sign in

### Without Email Confirmation (Testing)

1. User fills out `/sign-up` form
2. Account created immediately
3. User redirected to `/sign-in`
4. User can sign in right away

---

## Recommended Settings for Now

**For immediate testing:**
```
Confirm email: OFF
```

**Before launching to users:**
```
Confirm email: ON
Custom SMTP: Configured (for reliable email delivery)
Rate limiting: Monitored
```
