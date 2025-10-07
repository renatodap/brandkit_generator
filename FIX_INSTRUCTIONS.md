# Fix Instructions: RLS Policy Infinite Recursion

## Problem
Error when creating a business:
```
Failed to create business: Database error: infinite recursion detected in policy for relation "business_members" (code: 42P17)
```

## Root Cause
The RLS (Row Level Security) policies on `businesses` and `business_members` tables were referencing each other, creating a circular dependency that causes infinite recursion.

## Solution
Run the SQL script `fix_rls_recursion.sql` in your Supabase database to replace the problematic policies with non-recursive versions.

---

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the SQL**
   - Open `fix_rls_recursion.sql` from your project folder
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Script**
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for "Success. No rows returned" message

5. **Verify the Fix**
   - Run this verification query:
   ```sql
   SELECT tablename, policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename IN ('businesses', 'business_members')
   ORDER BY tablename, cmd;
   ```
   - You should see policies like `businesses_insert_policy`, `business_members_select_policy`, etc.

---

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd /path/to/brandkit_generator

# Execute the SQL file
npx supabase db execute --file fix_rls_recursion.sql

# Or if you have supabase CLI installed globally:
supabase db execute --file fix_rls_recursion.sql
```

---

## After Applying the Fix

1. **Refresh your app** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

2. **Try creating a business again**
   - The error should be gone
   - Business creation should work normally

3. **Check browser console** (F12 → Console)
   - Look for success logs: `[BusinessService] Business created successfully: [id]`
   - You should NOT see any database error messages

---

## What Changed

### Before (Problematic)
- `businesses` SELECT policy checked `business_members`
- `business_members` INSERT policy checked `businesses`
- Creating a business triggered both checks → infinite loop

### After (Fixed)
- `businesses` INSERT policy: **Only checks ownership** (no `business_members` reference)
- `businesses` SELECT policy: Safely allows owner OR members (SELECT is safe)
- `business_members` policies: Use subqueries to avoid circular references
- All policies use explicit aliases to prevent ambiguity

---

## Verification Commands

After applying the fix, you can verify it worked:

```sql
-- Check all policies on businesses table
SELECT * FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'businesses';

-- Check all policies on business_members table
SELECT * FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'business_members';

-- Test: Try to create a business (should work now)
-- Run this from your app's Create Business dialog
```

---

## Troubleshooting

### If the fix doesn't work:

1. **Check if you're signed in**
   - The error message will now say: "Your session has expired. Please sign in again."

2. **Check for duplicate slugs**
   - The error message will say: "A business with this slug already exists"
   - Try a different slug

3. **Check browser console logs**
   - Press F12 → Console tab
   - Look for `[Auth]`, `[API]`, `[BusinessService]` log messages
   - They will show exactly where it's failing

4. **Verify the SQL was applied**
   - Run the verification query above
   - Make sure you see the new policy names

---

## Need Help?

If you're still having issues after applying this fix:

1. Check the browser console (F12) and copy the error logs
2. Run the verification queries to confirm policies are updated
3. Check that you're properly authenticated (signed in)

The detailed logging will show exactly what's failing!
