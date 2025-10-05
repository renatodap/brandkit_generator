# 🚀 Deployment Guide - Production Ready

Complete guide to deploying your Brand Kit Generator to production with all features enabled.

---

## 📋 Pre-Deployment Checklist

- [x] All tests passing (`npm test`)
- [x] Build succeeds (`npm run build`)
- [x] TypeScript has no errors (`npm run type-check`)
- [x] ESLint passes (`npm run lint`)
- [x] Environment variables documented
- [x] Error tracking configured (Sentry)
- [x] Rate limiting configured (Upstash)
- [ ] Hugging Face API key ready
- [ ] Sentry account created (optional but recommended)
- [ ] Upstash Redis created (optional but recommended)

---

## Step 1: Set Up Hugging Face (Required)

### Create API Key

1. Go to [huggingface.co](https://huggingface.co) and sign up/login
2. Navigate to Settings → [Access Tokens](https://huggingface.co/settings/tokens)
3. Click **"New token"**
4. Name: `Brand Kit Generator Production`
5. Type: **Read**
6. Click **"Generate token"**
7. **Copy the token** (starts with `hf_...`)

### Add to Vercel

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   ```
   Name: HUGGINGFACE_API_KEY
   Value: hf_your_actual_token_here
   Environments: ✓ Production ✓ Preview ✓ Development
   ```
4. Click **Save**

---

## Step 2: Set Up Sentry (Recommended)

### Why Sentry?
- See every error in real-time
- Performance monitoring
- Session replay for debugging
- **Free tier: 5,000 errors/month**

### Create Account

1. Go to [sentry.io](https://sentry.io/signup/) and sign up
2. Create a new project:
   - Platform: **Next.js**
   - Project name: `brandkit-generator`
   - Alert me: **On**
3. Copy your **DSN** (looks like `https://xxx@o123.ingest.sentry.io/456`)

### Configure Vercel

Add these environment variables in Vercel:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your_actual_dsn@sentry.io/project_id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=brandkit-generator
```

### Test Sentry

After deployment:
1. Visit your app
2. Trigger an error (try invalid input)
3. Check Sentry dashboard - error should appear within seconds!

---

## Step 3: Set Up Upstash Rate Limiting (Recommended)

### Why Upstash?
- Prevent API abuse
- Protect your Hugging Face credits
- Distributed rate limiting
- **Free tier: 10,000 commands/day**

### Create Redis Database

1. Go to [console.upstash.com](https://console.upstash.com) and sign up
2. Click **"Create Database"**
   - Name: `brandkit-ratelimit`
   - Type: **Regional**
   - Region: Choose closest to your users
   - Eviction: **No eviction**
3. Click **"Create"**

### Get Credentials

1. Click on your database
2. Scroll to **"REST API"** section
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Configure Vercel

Add to Vercel environment variables:

```bash
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Current Rate Limit**: 10 requests per minute per IP
**To change**: Edit `lib/rate-limit.ts`

---

## Step 4: Configure App Settings

### Add Remaining Variables

In Vercel, add:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-actual-domain.vercel.app
NEXT_PUBLIC_APP_NAME="Brand Kit Generator"
```

**After first deployment**, update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL.

---

## Step 5: Deploy to Vercel

### Option A: Automatic (GitHub Integration)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repo: `renatodap/brandkit_generator`
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add all environment variables (from steps above)
6. Click **"Deploy"**

### Option B: CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts to add environment variables
```

### Verify Deployment

1. Visit your Vercel URL
2. Test brand kit generation
3. Check Sentry dashboard for events
4. Test rate limiting (make 11 requests quickly - 11th should fail)

---

## Step 6: Post-Deployment

### Update Environment URLs

After first deployment:
1. Copy your Vercel URL (e.g., `https://brandkit-generator.vercel.app`)
2. Update in Vercel:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-actual-url.vercel.app
   ```
3. Redeploy (or wait for next git push)

### Test Everything

- [ ] Homepage loads correctly
- [ ] Form validation works
- [ ] Brand kit generation succeeds
- [ ] Download works (ZIP file)
- [ ] Error appears in Sentry (test with invalid input)
- [ ] Rate limiting works (11th request in 1 min fails)
- [ ] Legal pages accessible (Privacy, Terms)
- [ ] Mobile responsive

---

## 📊 Monitoring Your Production App

### Sentry Dashboard

**What to monitor**:
- **Issues** - All errors grouped by type
- **Performance** - Slow API calls
- **Releases** - Track errors by deployment
- **Alerts** - Set up notifications

**Key Metrics**:
- Error rate < 1%
- Average response time < 2s
- Apdex score > 0.9

### Upstash Dashboard

**What to monitor**:
- **Commands/day** - Should be < 10,000 (free tier)
- **Hit rate** - Higher = better caching
- **Response time** - Should be < 50ms

### Vercel Analytics

**Built-in metrics**:
- **Real Experience Score** (aim for > 75)
- **Core Web Vitals**
- **Top pages**
- **Error rate**

---

## 🔧 Troubleshooting

### Build Fails in Vercel

**Error**: `HUGGINGFACE_API_KEY is required`

**Solution**: The app now uses runtime validation, so this shouldn't happen. If it does:
1. Verify `HUGGINGFACE_API_KEY` is set in Vercel
2. Check it's enabled for "Production" environment
3. Redeploy

### Sentry Not Receiving Errors

**Check**:
1. `NEXT_PUBLIC_SENTRY_DSN` is correct
2. DSN starts with `https://` and contains `@sentry.io`
3. Trigger a test error: Submit form with empty business name
4. Wait 30 seconds, check Sentry dashboard

### Rate Limiting Not Working

**Symptoms**: Can make unlimited requests

**Solutions**:
1. Verify Upstash credentials in Vercel
2. Check Upstash database is active
3. Rate limiting **fails open** (allows requests) if Redis is unreachable
4. Check browser DevTools → Network → Response headers for `X-RateLimit-*`

### Logo Generation Slow

**Expected**:
- First request: 20-30 seconds (cold start)
- Subsequent: 5-10 seconds

**If slower**:
- Check Hugging Face status
- Verify API key has no rate limits
- Consider upgrading Hugging Face plan

---

## 🚀 Performance Optimization

### Enable Caching (Future)

```typescript
// app/api/generate-brand-kit/route.ts
export const revalidate = 3600; // Cache for 1 hour
```

### CDN for Assets

Use Vercel's built-in CDN or add Cloudflare:
1. Point domain to Cloudflare
2. Enable "Proxy" (orange cloud)
3. Configure cache rules

### Upgrade Rate Limits

For production traffic:

```typescript
// lib/rate-limit.ts
limiter: Ratelimit.slidingWindow(100, '1 m'), // 100/min
```

---

## 🔒 Security Best Practices

### API Keys

- ✅ **Never commit** `.env.local` to git
- ✅ **Rotate keys** every 90 days
- ✅ **Use separate keys** for dev/staging/prod
- ✅ **Monitor usage** in Hugging Face dashboard

### Rate Limiting

- ✅ **Start conservative** (10/min)
- ✅ **Monitor abuse** in Upstash
- ✅ **Adjust as needed** based on traffic
- ✅ **Consider IP whitelisting** for internal use

### Error Tracking

- ✅ **Scrub sensitive data** in Sentry
- ✅ **Set up alerts** for critical errors
- ✅ **Review weekly** for patterns
- ✅ **Create issues** for recurring errors

---

## 📈 Scaling Considerations

### Traffic Growth

| Users/Day | Recommendations |
|-----------|-----------------|
| < 100 | Free tiers are fine |
| 100-1,000 | Upgrade Upstash to Pro ($10/mo) |
| 1,000-10,000 | Add caching, consider Hugging Face Pro |
| 10,000+ | CDN, database for caching, queue system |

### Cost Estimates (Monthly)

**Free tier** (0-100 users/day):
- Vercel: Free
- Hugging Face: Free (30k requests)
- Sentry: Free (5k errors)
- Upstash: Free (10k commands/day)
- **Total: $0/month**

**Growth tier** (100-1k users/day):
- Vercel: Free (probably still within limits)
- Hugging Face: ~$50/month (if you exceed free tier)
- Sentry: $26/month (Team plan)
- Upstash: $10/month (Pro)
- **Total: ~$86/month**

**Scale tier** (1k-10k users/day):
- Vercel: $20/month (Pro)
- Hugging Face: $200-500/month (Dedicated)
- Sentry: $80/month (Business)
- Upstash: $20/month (or move to own Redis)
- **Total: ~$320-620/month**

---

## ✅ Production Checklist

Before going live:

- [ ] All environment variables added in Vercel
- [ ] Sentry dashboard configured with alerts
- [ ] Upstash Redis active and connected
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (auto with Vercel)
- [ ] Legal pages updated with your info
- [ ] Privacy policy email correct
- [ ] Terms of service reviewed
- [ ] Error tracking tested
- [ ] Rate limiting tested
- [ ] All tests passing: `npm test`
- [ ] Lighthouse score > 90 (run on deployed URL)
- [ ] Accessibility audit passed
- [ ] Mobile devices tested
- [ ] Multiple browsers tested (Chrome, Firefox, Safari)

---

## 🎉 You're Live!

Your production-ready brand kit generator is now deployed!

### Next Steps:

1. **Monitor first week**:
   - Check Sentry daily for errors
   - Review Upstash usage
   - Gather user feedback

2. **Iterate**:
   - Fix critical bugs immediately
   - Add requested features
   - Optimize slow endpoints

3. **Scale**:
   - Upgrade services as needed
   - Add caching layer
   - Consider database for user accounts

### Support Resources:

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Sentry**: [docs.sentry.io](https://docs.sentry.io)
- **Upstash**: [docs.upstash.com](https://docs.upstash.com)
- **Hugging Face**: [huggingface.co/docs](https://huggingface.co/docs)

---

**Congratulations on your production deployment!** 🚀

Questions? Check `PRODUCTION_FEATURES.md` or `README.md`
