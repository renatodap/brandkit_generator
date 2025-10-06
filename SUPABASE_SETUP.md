# Supabase Setup Guide

## 🎯 Overview

This guide will help you set up Supabase for the Brand Kit Generator app with authentication and database functionality.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com)
- The Supabase CLI (optional, but recommended)

## 🚀 Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: Brand Kit Generator (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup to complete (~2 minutes)

## 🔑 Step 2: Get Your Environment Variables

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these values:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anon/Public Key (safe to use in browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Service Role Key (NEVER expose in browser!)
SUPABASE_SERVICE_KEY=eyJhbGc...
```

4. Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

## 🗄️ Step 3: Set Up Database Schema

1. Go to **SQL Editor** in the Supabase dashboard
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` (in the root of this project)
4. Paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- `brand_kits` table with all columns
- `share_tokens` table for public sharing
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for `updated_at` timestamps

## 🔐 Step 4: Configure Authentication

### Enable Email Authentication

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Find **Email** provider
3. Ensure these settings:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (recommended for production)
   - Set **Site URL**: `http://localhost:3000` (development) or your production URL
   - Set **Redirect URLs**: Add both:
     - `http://localhost:3000/dashboard`
     - `https://yourdomain.com/dashboard` (if deployed)

### Email Templates (Optional but Recommended)

1. Go to **Authentication** > **Email Templates**
2. Customize these templates:
   - **Confirm signup**: Welcome email with verification link
   - **Magic Link**: Passwordless sign-in link
   - **Change Email**: Confirmation for email changes
   - **Reset Password**: Password reset link

### URL Configuration

1. Go to **Authentication** > **URL Configuration**
2. Set:
   - **Site URL**: `http://localhost:3000` (or production URL)
   - **Redirect URLs**: Add:
     - `http://localhost:3000/**`
     - `https://yourdomain.com/**`

## ✅ Step 5: Verify Setup

### Test Database Connection

Run this query in SQL Editor to verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see: `brand_kits` and `share_tokens`

### Test RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

You should see policies for both tables.

### Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/sign-up`
3. Create a test account
4. Check your email for verification (if enabled)
5. Sign in at `http://localhost:3000/sign-in`
6. You should be redirected to `/dashboard`

## 🎨 Step 6: Test Brand Kit Generation

1. Sign in to your account
2. Go to the homepage (`/`)
3. Generate a brand kit
4. Verify it appears in your dashboard
5. Test features:
   - ⭐ Favorite
   - 🔗 Share
   - 📥 Download
   - 🗑️ Delete

## 🔍 Step 7: Monitor Database

### View Data in Supabase

1. Go to **Table Editor** in Supabase dashboard
2. Select `brand_kits` table
3. You should see your generated brand kits
4. Click on any row to view/edit details

### Check Auth Users

1. Go to **Authentication** > **Users**
2. You should see your test user(s)
3. View user metadata and confirm email status

## 🛡️ Security Checklist

- [ ] Environment variables added to `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] RLS policies enabled on all tables
- [ ] Service role key never used in client-side code
- [ ] Email verification enabled (production)
- [ ] Redirect URLs configured correctly
- [ ] Test user created and can sign in
- [ ] Brand kits saving to database

## 🚨 Common Issues

### Issue: "Invalid API key"
**Solution**: Double-check your environment variables match the Supabase dashboard exactly.

### Issue: "Row Level Security policy violation"
**Solution**:
- Ensure RLS policies were created (check SQL Editor)
- Verify you're signed in when accessing protected routes
- Check that `auth.uid()` matches `user_id` in queries

### Issue: Email verification not working
**Solution**:
- Check SMTP settings in **Authentication** > **Settings**
- For development, you can disable email confirmation
- Check spam folder for confirmation emails

### Issue: "relation brand_kits does not exist"
**Solution**: Run the `supabase-schema.sql` script in SQL Editor.

### Issue: CORS errors
**Solution**:
- Verify Site URL in Supabase settings
- Add your domain to Redirect URLs
- Restart your development server

## 📚 Database Schema Reference

### `brand_kits` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | Foreign key to `auth.users` |
| `business_name` | VARCHAR(255) | Business name |
| `business_description` | TEXT | Optional description |
| `industry` | VARCHAR(100) | Industry category |
| `logo_url` | TEXT | Logo image URL (data URL or storage URL) |
| `logo_svg` | TEXT | SVG code (if available) |
| `colors` | JSONB | Array of color objects |
| `fonts` | JSONB | Primary and secondary fonts |
| `tagline` | TEXT | Brand tagline |
| `is_favorite` | BOOLEAN | Favorite status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `share_tokens` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `brand_kit_id` | UUID | Foreign key to `brand_kits` |
| `token` | VARCHAR(64) | Unique share token |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `expires_at` | TIMESTAMPTZ | Expiration (30 days default) |

## 🔄 Next Steps

1. **Storage (Optional)**: Set up Supabase Storage for logo uploads instead of data URLs
2. **Realtime (Optional)**: Enable realtime subscriptions for collaborative features
3. **Edge Functions (Optional)**: Move AI generation to Supabase Edge Functions
4. **Analytics**: Set up Supabase Analytics to track usage

## 📖 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## 💡 Tips

- Use Supabase CLI for migrations in production
- Enable connection pooling for better performance
- Set up database backups (automatic with paid plans)
- Monitor query performance in Supabase dashboard
- Use prepared statements to prevent SQL injection
- Leverage Supabase Storage for file uploads (future enhancement)

---

**Need Help?** Check the Supabase Discord or documentation at https://supabase.com/docs
