# 🗄️ Supabase Setup Guide

Complete guide to setting up Supabase for the Brand Kit Generator.

---

## Prerequisites

- A Supabase account (free tier is fine): https://app.supabase.com/

---

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com/
2. Click "New Project"
3. Fill in:
   - **Project name**: `brandkit-generator` (or your choice)
   - **Database Password**: Generate a strong password (save it somewhere safe!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (500MB database, 50k MAU)
4. Click "Create new project"
5. Wait 2-3 minutes for project to initialize

---

## Step 2: Run Database Schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `supabase-schema.sql` in your project root
4. Copy the ENTIRE contents
5. Paste into Supabase SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)
7. You should see: ✅ "Success. No rows returned"
8. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
   You should see: `users`, `brand_kits`, `share_tokens`

---

## Step 3: Get API Keys

1. Click **Project Settings** (gear icon in bottom left)
2. Click **API** in the left menu
3. You'll see several important values:

### Copy These Values:

#### A) Project URL
```
URL: https://abcdefghijkl.supabase.co
```
→ Copy this for `NEXT_PUBLIC_SUPABASE_URL`

#### B) Anon (Public) Key
```
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### C) Service Role Key (Secret)
**⚠️ IMPORTANT: Keep this secret! Never commit to Git!**
```
service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Copy this for `SUPABASE_SERVICE_KEY`

---

## Step 4: Add to .env.local

1. Open `.env.local` in your project root (create if doesn't exist)
2. Add the Supabase variables:

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace** `your-project-id` and the `eyJ...` keys with YOUR actual values from Step 3.

---

## Step 5: Verify Connection (Optional)

Create a test file to verify Supabase is working:

```typescript
// test-supabase.ts
import { supabase } from './lib/supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .single();

  if (error) {
    console.error('❌ Supabase connection failed:', error);
  } else {
    console.log('✅ Supabase connected successfully!');
  }
}

testConnection();
```

Run with: `npx tsx test-supabase.ts`

---

## Step 6: Enable Row Level Security (Already Done!)

The SQL schema already enabled RLS and created policies. Verify with:

```sql
-- Run in Supabase SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'brand_kits', 'share_tokens');
```

All should show `rowsecurity = true` ✅

---

## Step 7: Test RLS Policies (Optional)

Run this in SQL Editor to verify policies work:

```sql
-- This should return empty (RLS blocks access without user context)
SELECT * FROM brand_kits;

-- This should work (uses service role key)
SELECT count(*) FROM brand_kits;
```

---

## Common Issues & Troubleshooting

### Issue 1: "Invalid API key"
**Solution**: Make sure you copied the FULL key, including all characters after `eyJ...`

### Issue 2: "relation 'brand_kits' does not exist"
**Solution**: Re-run the schema SQL (Step 2). Check for errors in the output.

### Issue 3: "RLS policy violation"
**Solution**: Check that you're setting the user context correctly in your code. See `lib/supabase.ts` for the implementation.

### Issue 4: "Connection timeout"
**Solution**: Check your project region. If it's far from you, there might be latency.

### Issue 5: "Database is paused"
**Solution**: Free tier databases pause after 1 week of inactivity. Click "Resume" in Supabase dashboard.

---

## Database Limits (Free Tier)

| Resource | Limit |
|----------|-------|
| Database Size | 500 MB |
| Monthly Active Users | 50,000 |
| API Requests | Unlimited |
| Bandwidth | 5 GB |
| Storage | 1 GB |

**Upgrade when needed**: $25/month for Pro tier (8GB database, 100k MAU)

---

## Monitoring Your Database

### Check Usage

1. Go to **Project Settings** → **Billing**
2. View your current usage:
   - Database size
   - Bandwidth
   - API requests

### View Logs

1. Go to **Logs** in left sidebar
2. Select **Postgres Logs** to see database queries
3. Select **API Logs** to see API requests

### Performance

1. Go to **Database** → **Performance**
2. View slow queries and optimize as needed

---

## Backup & Security

### Automated Backups

Free tier: **Daily backups for 7 days**
Pro tier: **Daily backups for 30 days**

### Manual Backup

1. Go to **Database** → **Backups**
2. Click **Create backup** for instant snapshot

### Security Best Practices

✅ **DO**:
- Keep service role key secret (never in Git)
- Use RLS policies for all tables
- Validate all inputs
- Use parameterized queries (handled by Supabase client)

❌ **DON'T**:
- Expose service role key in client-side code
- Disable RLS on production tables
- Trust user input without validation

---

## Next Steps

After Supabase is set up:

1. ✅ Database configured
2. ✅ API keys in `.env.local`
3. ✅ RLS policies active
4. ⏭️ **Next**: Set up Clerk authentication
5. ⏭️ **Then**: Test the full auth + database flow

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com/
- **SQL Editor**: Run queries directly in Supabase dashboard
- **Support**: https://supabase.com/support

---

## Summary Checklist

Before continuing, make sure:

- [ ] Supabase project created
- [ ] Schema SQL executed successfully
- [ ] Tables created (users, brand_kits, share_tokens)
- [ ] API keys copied
- [ ] `.env.local` updated with Supabase variables
- [ ] RLS policies enabled and working
- [ ] Connection tested (optional but recommended)

**Once all checked, you're ready to set up Clerk!** 🎉
