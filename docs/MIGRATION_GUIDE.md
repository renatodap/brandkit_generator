# Team Collaboration Migration Guide

## ✅ Fixed Issue

The migration has been updated to use the correct column name: `user_id` instead of `owner_id` for the businesses table.

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Go to SQL Editor**
   - Navigate to: https://supabase.com/dashboard/project/abtunlcxubymirloekto/sql/new

2. **Copy Migration SQL**
   - Open: `supabase/migrations/team_collaboration.sql`
   - Copy the entire file contents (Ctrl+A, Ctrl+C)

3. **Paste and Run**
   - Paste into the Supabase SQL Editor
   - Click the green "Run" button
   - Wait for completion (should take 5-10 seconds)

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check the Tables tab to see the new tables:
     - `business_members`
     - `business_invitations`
     - `business_access_requests`

### Option 2: Using psql (Advanced)

If you have PostgreSQL client installed:

```bash
# Set your database password
export PGPASSWORD="your-database-password"

# Run migration
psql -h db.abtunlcxubymirloekto.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/team_collaboration.sql
```

## What the Migration Does

### Creates 3 New Tables

1. **business_members**
   - Tracks team members of each business
   - Columns: `id`, `business_id`, `user_id`, `role`, `invited_by`, `joined_at`
   - Roles: `admin`, `editor`, `viewer`

2. **business_invitations**
   - Tracks pending invitations
   - Columns: `id`, `business_id`, `email`, `role`, `token`, `status`, `expires_at`
   - Status: `pending`, `accepted`, `declined`, `expired`
   - Invitations expire after 7 days

3. **business_access_requests**
   - Tracks user requests to join businesses
   - Columns: `id`, `business_id`, `user_id`, `requested_role`, `message`, `status`
   - Status: `pending`, `approved`, `rejected`

### Updates Existing Tables

- **businesses table**: Updates RLS policies to allow team member access
- **brand_kits table**: Updates RLS policies to allow team member access

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Comprehensive policies** for each table
- **Helper functions** for permission checks
- **Automatic timestamps** with triggers

## Verification Steps

After running the migration, verify it worked:

### 1. Check Tables Exist

In Supabase Dashboard → Table Editor, you should see:
- ✅ `business_members`
- ✅ `business_invitations`
- ✅ `business_access_requests`

### 2. Check RLS Policies

In Supabase Dashboard → Authentication → Policies:
- Each table should have 3-4 policies
- Policies should reference `auth.uid()`

### 3. Test an API Endpoint

```bash
# Start your dev server
npm run dev

# Test permissions endpoint (replace with real business ID)
curl http://localhost:3000/api/businesses/YOUR_BUSINESS_ID/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
{
  "business_id": "...",
  "user_id": "...",
  "role": "owner",
  "can_view": true,
  "can_edit": true,
  "can_manage_team": true,
  "can_delete": true
}
```

## Troubleshooting

### Error: "relation already exists"

**Solution**: The migration uses `CREATE TABLE IF NOT EXISTS`, so this is safe. The error just means you've run it before.

### Error: "policy already exists"

**Solution**: The migration drops existing policies before creating new ones. If you see this, you can:
1. Manually drop the conflicting policies in Supabase Dashboard
2. Or run the migration anyway (it will skip existing policies)

### Error: "permission denied"

**Solution**: Make sure you're running the migration as the `postgres` user with proper permissions.

### Error: "column does not exist"

**Solution**: This should be fixed now! The migration uses `user_id` (the actual column name) instead of `owner_id`.

## Rolling Back (If Needed)

If you need to undo the migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS business_access_requests CASCADE;
DROP TABLE IF EXISTS business_invitations CASCADE;
DROP TABLE IF EXISTS business_members CASCADE;

-- Restore original policies on businesses table
DROP POLICY IF EXISTS "view_own_or_member_businesses" ON businesses;
DROP POLICY IF EXISTS "insert_own_business" ON businesses;
DROP POLICY IF EXISTS "update_business_with_permission" ON businesses;
DROP POLICY IF EXISTS "delete_own_business" ON businesses;

CREATE POLICY "Users can view own businesses"
ON businesses FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own businesses"
ON businesses FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own businesses"
ON businesses FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own businesses"
ON businesses FOR DELETE
USING (user_id = auth.uid());

-- Similar for brand_kits table...
```

## Next Steps

After successful migration:

1. ✅ Migration complete!
2. 📝 Build the Team Management UI
3. 🧪 Test invitation flows
4. 📧 Set up email notifications (optional)
5. 🚀 Deploy to production

See `docs/TEAM_COLLABORATION_STATUS.md` for detailed next steps.

## Support

If you encounter issues:

1. Check the Supabase Dashboard Logs
2. Review the RLS policies in the Authentication section
3. Test API endpoints directly with curl
4. Check the browser console for client-side errors
5. Review the service layer logs in your terminal

## Key Changes from Original

- ✅ **Fixed**: Changed `owner_id` to `user_id` throughout
- ✅ **Fixed**: Updated foreign key references
- ✅ **Fixed**: Updated all RLS policies
- ✅ **Fixed**: Updated service layer functions
- ✅ **Fixed**: Updated API routes

All code now correctly references `user_id` as the owner field in the `businesses` table.
