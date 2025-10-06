# 🔐 Clerk Authentication Setup Guide

Complete guide to setting up Clerk authentication for the Brand Kit Generator.

---

## Prerequisites

- A Clerk account (free tier is fine): https://clerk.com/
- Supabase already set up (see `SUPABASE_SETUP_GUIDE.md`)

---

## Step 1: Create Clerk Application

1. Go to https://dashboard.clerk.com/
2. Click "**Create application**"
3. Fill in:
   - **Application name**: `Brand Kit Generator` (or your choice)
   - **Choose how users will sign in**:
     - ✅ **Email** (recommended)
     - ✅ **Google** (optional, great for quick signups)
     - ✅ **GitHub** (optional, for developers)
   - Leave other social providers unchecked (can add later)
4. Click "**Create application**"

---

## Step 2: Get API Keys

After creating the application, you'll see the Quick start page:

1. Look for the **API Keys** section
2. You'll see two keys:

### Copy These Values:

#### A) Publishable Key (Public)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```
→ This is safe to expose in client-side code

#### B) Secret Key (Private)
**⚠️ IMPORTANT: Keep this secret! Never commit to Git!**
```
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```
→ This must ONLY be used server-side

---

## Step 3: Add to .env.local

1. Open `.env.local` in your project root
2. Add the Clerk variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk URLs (already configured in code)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Replace** the placeholder values with YOUR actual keys from Step 2.

---

## Step 4: Configure Clerk Application Settings

### A) Paths Configuration

1. In Clerk Dashboard, go to **Configure** → **Paths**
2. Set the following:

| Setting | Value |
|---------|-------|
| Sign-in URL | `/sign-in` |
| Sign-up URL | `/sign-up` |
| Home URL | `/dashboard` |
| After sign-in URL | `/dashboard` |
| After sign-up URL | `/dashboard` |

3. Click **Save**

### B) Session Settings (Optional but Recommended)

1. Go to **Configure** → **Sessions**
2. Settings:
   - **Session lifetime**: 7 days (default is fine)
   - **Inactivity timeout**: 1 hour (or adjust to your needs)
3. Click **Save**

### C) Email Settings

1. Go to **Configure** → **Email & SMS**
2. Customize email templates (optional):
   - Verification email
   - Password reset email
   - Welcome email
3. For production, set up custom email domain (optional)

---

## Step 5: Test Authentication Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Click "**Sign In**" in the header
   - You should see Clerk's sign-in modal appear ✅

4. Click "**Sign up instead**"
   - Create a test account with your email
   - Check your email for verification code
   - Enter code to verify

5. After signing in:
   - You should be redirected to `/dashboard` ✅
   - You should see your user button in the header ✅

---

## Step 6: Configure Social Providers (Optional)

### Enable Google Sign-In

1. In Clerk Dashboard, go to **Configure** → **Social Connections**
2. Click **+ Add connection**
3. Select **Google**
4. Two options:

   **Option A: Use Clerk's credentials (easy)**
   - Click **Use Clerk credentials** (recommended for testing)
   - Done!

   **Option B: Use your own Google OAuth app (production)**
   - Create Google OAuth app at: https://console.cloud.google.com/
   - Copy Client ID and Client Secret
   - Paste into Clerk
   - Add authorized redirect URL: `https://your-clerk-domain.clerk.accounts.dev/oauth/callback/google`

5. Click **Save**

### Enable GitHub Sign-In (Similar Process)

1. Go to **Social Connections**
2. Click **+ Add connection** → **GitHub**
3. Use Clerk credentials or create GitHub OAuth app
4. Save

---

## Step 7: Sync Users to Supabase (Webhook)

We need to sync Clerk users to your Supabase database.

### A) Create Webhook Endpoint

The code already includes a webhook handler at `/api/webhooks/clerk`.

### B) Configure Webhook in Clerk

1. In Clerk Dashboard, go to **Configure** → **Webhooks**
2. Click **+ Add Endpoint**
3. Fill in:
   - **Endpoint URL**:
     - Development: Use ngrok or similar (see below)
     - Production: `https://yourdomain.com/api/webhooks/clerk`
   - **Subscribe to events**:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
4. Click **Create**
5. **IMPORTANT**: Copy the **Signing Secret** (starts with `whsec_`)
6. Add to `.env.local`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### C) Test Webhooks Locally (Development)

To test webhooks on localhost, use ngrok:

1. Install ngrok: https://ngrok.com/download
2. Run your dev server: `npm run dev`
3. In another terminal, run:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. In Clerk webhook settings, set endpoint to:
   ```
   https://abc123.ngrok.io/api/webhooks/clerk
   ```
6. Create a test user in Clerk
7. Check your Supabase `users` table - the user should appear! ✅

---

## Step 8: Customize Appearance (Optional)

Make Clerk UI match your brand:

1. Go to **Customize** → **Appearance**
2. Choose a theme or customize:
   - Brand colors
   - Logo
   - Button styles
   - Typography
3. Preview changes in real-time
4. Click **Save**

---

## Common Issues & Troubleshooting

### Issue 1: "Invalid publishable key"
**Solution**: Make sure you copied the FULL key, including the `pk_test_` or `pk_live_` prefix.

### Issue 2: Sign-in modal doesn't appear
**Solution**:
- Check browser console for errors
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
- Restart dev server after adding env vars

### Issue 3: "Redirect loop" after sign-in
**Solution**:
- Check that `/dashboard` route exists
- Verify `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard` is set

### Issue 4: Webhooks not receiving events
**Solution**:
- Check webhook signing secret is correct
- Verify endpoint URL is accessible (use ngrok for local testing)
- Check webhook logs in Clerk dashboard

### Issue 5: User doesn't appear in Supabase
**Solution**:
- Check webhook endpoint is working (`/api/webhooks/clerk`)
- Verify Supabase service key is set correctly
- Check Clerk webhook logs for errors

---

## Clerk Limits (Free Tier)

| Resource | Limit |
|----------|-------|
| Monthly Active Users (MAU) | 10,000 |
| Social Connections | Unlimited |
| Custom Domains | Not included |
| Webhooks | Unlimited |
| Support | Community only |

**Upgrade when needed**: $25/month for Pro (25k MAU, custom domains, email support)

---

## Security Best Practices

### ✅ DO

- Keep `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SECRET` private
- Use HTTPS in production
- Verify webhook signatures (already implemented)
- Enable 2FA for your Clerk account
- Use strong session settings

### ❌ DON'T

- Expose secret key in client-side code
- Disable HTTPS in production
- Skip webhook signature verification
- Use test keys in production

---

## Testing Checklist

Before going to production, test:

- [ ] Sign up with email
- [ ] Email verification works
- [ ] Sign in with email and password
- [ ] Sign in with Google (if enabled)
- [ ] Sign out
- [ ] User appears in Supabase `users` table
- [ ] Dashboard shows after sign-in
- [ ] User button in header works
- [ ] Sign-in modal appears when accessing protected routes
- [ ] Redirect to sign-in when not authenticated

---

## Production Deployment

### 1. Switch to Production Keys

When deploying to Vercel/production:

1. Go to Clerk Dashboard
2. Click **Go to Production** (top right)
3. Get production keys (start with `pk_live_` and `sk_live_`)
4. Update environment variables in Vercel:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
   CLERK_SECRET_KEY=sk_live_xxxxx
   ```

### 2. Update Webhook URL

Update webhook endpoint to production URL:
```
https://yourdomain.com/api/webhooks/clerk
```

### 3. Configure Custom Domain (Optional)

1. In Clerk Dashboard, go to **Configure** → **Domains**
2. Add your custom domain
3. Follow DNS setup instructions

---

## Monitoring & Analytics

### View User Analytics

1. Go to **Users** in Clerk Dashboard
2. See metrics:
   - Total users
   - New signups (daily/weekly/monthly)
   - Active users
   - Sign-in methods breakdown

### View Logs

1. Go to **Logs** in Clerk Dashboard
2. Filter by:
   - Events (sign-in, sign-up, etc.)
   - User
   - Date range

---

## Next Steps

After Clerk is set up:

1. ✅ Clerk application created
2. ✅ API keys in `.env.local`
3. ✅ Authentication working locally
4. ✅ Users syncing to Supabase
5. ⏭️ **Next**: Build the dashboard and brand kit pages
6. ⏭️ **Then**: Deploy to production

---

## Need Help?

- **Clerk Docs**: https://clerk.com/docs
- **Clerk Discord**: https://discord.com/invite/b5rXHjAg7A
- **Clerk Support**: https://clerk.com/support (Pro plan)
- **Next.js Integration Guide**: https://clerk.com/docs/quickstarts/nextjs

---

## Summary Checklist

Before continuing, make sure:

- [ ] Clerk application created
- [ ] API keys copied
- [ ] `.env.local` updated with Clerk variables
- [ ] Sign-in/sign-up working locally
- [ ] User button appears in header
- [ ] Webhooks configured (optional for MVP)
- [ ] Users syncing to Supabase (if webhook set up)
- [ ] Protected routes redirect to sign-in

**Once all checked, you're ready to build the UI!** 🎉
