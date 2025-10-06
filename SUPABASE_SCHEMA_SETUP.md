# 🚀 Supabase Multi-Tenant Schema Setup Guide

## Overview

This schema supports **Persimmon Labs** as a multi-tenant platform where multiple companies can:
- Sign up and onboard
- Access their private dashboard at `/dashboard/[company-slug]`
- Use tools like the Brand Kit Generator
- Manage team members with role-based access control

---

## 📋 Schema Components

### Tables Created

1. **`companies`** - Client companies using the platform
   - Company profile and contact info
   - Onboarding data (goals, target audience, pain points, etc.)
   - Subscription tier and status
   - Custom settings

2. **`company_users`** - User-to-company relationships (many-to-many)
   - Links auth.users to companies
   - Roles: owner, admin, editor, member, viewer
   - Permissions and access control

3. **`brand_kits`** - AI-generated brand kits (per company)
   - Logo, colors, fonts, tagline
   - Favorites and published status
   - Belongs to a company

4. **`share_tokens`** - Public share links for brand kits
   - Expiring links
   - View tracking
   - Optional password protection

5. **`activity_logs`** - Audit trail for important actions
   - Company-level activity tracking
   - User actions and metadata

---

## 🔐 Security Features

### Row-Level Security (RLS)
- ✅ Users can only see data for companies they belong to
- ✅ Role-based permissions (owner/admin can manage, members can view)
- ✅ Brand kits are isolated per company
- ✅ Public share links work without authentication

### Multi-Tenancy
- ✅ Complete data isolation between companies
- ✅ Company-scoped dashboards (`/dashboard/acme-corp`)
- ✅ Shared users across multiple companies (optional)

---

## 🎯 Quick Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project:
   ```
   https://supabase.com/dashboard/project/abtunlcxubymirloekto/sql/new
   ```

2. You should see the SQL Editor interface

### Step 2: Copy the Schema

1. Open the file: `supabase-schema-persimmon-labs.sql`
2. Select all content (Ctrl+A)
3. Copy (Ctrl+C)

### Step 3: Paste and Execute

1. Paste into the Supabase SQL Editor (Ctrl+V)
2. Click the **"RUN"** button (or press Ctrl+Enter)
3. Wait for execution to complete (~5-10 seconds)

### Step 4: Verify Success

You should see a success message in the output:
```
✅ Persimmon Labs Multi-Tenant Schema Created Successfully!

📋 Tables Created:
   • companies
   • company_users
   • brand_kits
   • share_tokens
   • activity_logs

🔒 Security: RLS enabled on all tables
```

### Step 5: Verify Tables Exist

Run this query to confirm:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'company_users', 'brand_kits', 'share_tokens', 'activity_logs')
ORDER BY table_name;
```

You should see 5 rows returned.

---

## 🏢 Creating Your First Company

After the schema is set up, you'll need to create your first company and link a user to it.

### Option 1: Via SQL (Manual)

```sql
-- 1. Create a company
INSERT INTO companies (name, slug, industry, company_size, business_type, subscription_tier, onboarding_data)
VALUES (
  'Persimmon Labs Demo',
  'persimmon-demo',
  'Technology',
  '1-10',
  'B2B',
  'pro',
  '{
    "goals": ["client_onboarding", "brand_development"],
    "target_audience": "Small to medium businesses",
    "pain_points": ["Time-consuming branding process", "Lack of design resources"]
  }'::jsonb
)
RETURNING id;

-- 2. Sign up a user at your app: /sign-up
--    Let's say their user_id is: 123e4567-e89b-12d3-a456-426614174000

-- 3. Link the user to the company as owner
INSERT INTO company_users (company_id, user_id, role, job_title)
VALUES (
  '<company_id_from_step_1>',
  '123e4567-e89b-12d3-a456-426614174000',
  'owner',
  'Founder'
);
```

### Option 2: Via API (Recommended for Production)

Create an API endpoint at `/api/onboarding/create-company` that:
1. Creates the company record
2. Links the current user as owner
3. Logs the activity
4. Returns the company slug for redirection

---

## 📊 Schema Diagram

```
auth.users (Supabase Auth)
    |
    | (many-to-many)
    |
company_users ────────── companies
    |                        |
    | (has role)             | (has many)
    |                        |
    └──────────────> brand_kits
                            |
                            | (has many)
                            |
                      share_tokens
```

---

## 🔄 Onboarding Flow

### 1. User Signs Up
- User creates account via Supabase Auth at `/sign-up`
- User record created in `auth.users`

### 2. Company Onboarding
- User completes onboarding form at `/onboarding`
- Company record created in `companies` table with:
  - Basic info (name, industry, size)
  - Onboarding responses (goals, pain points, etc.)
  - Subscription tier

### 3. User-Company Link
- Record created in `company_users` linking user to company
- User assigned "owner" role

### 4. Dashboard Access
- User redirected to `/dashboard/[company-slug]`
- Can access brand kit tool at `/dashboard/[company-slug]/tools/brand-kit`

---

## 🛠️ Service Layer Updates Needed

You'll need to update the brand kit service to work with companies:

### Current Service
```typescript
// lib/services/brand-kit-service.ts
export async function createBrandKit(userId: string, data: CreateBrandKitInput)
```

### Updated Service (Multi-Tenant)
```typescript
// lib/services/brand-kit-service.ts
export async function createBrandKit(
  companyId: string,
  userId: string,
  data: CreateBrandKitInput
) {
  const supabase = await createClient();

  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .insert({
      company_id: companyId,  // 👈 NEW: Company association
      created_by_user_id: userId,
      business_name: data.businessName,
      business_description: data.businessDescription,
      industry: data.industry,
      logo_url: data.logoUrl,
      logo_svg: data.logoSvg || null,
      colors: data.colors as any,
      fonts: data.fonts as any,
      tagline: data.tagline || null,
      design_justification: data.designJustification || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create brand kit: ${error.message}`);
  return brandKit;
}
```

---

## 🧪 Testing the Setup

### 1. Create a Test Company
```sql
INSERT INTO companies (name, slug, industry)
VALUES ('Test Company', 'test-co', 'Technology')
RETURNING *;
```

### 2. Sign Up a User
- Go to: `http://localhost:3000/sign-up`
- Create an account
- Check Supabase Auth dashboard for the user ID

### 3. Link User to Company
```sql
-- Replace with actual IDs
INSERT INTO company_users (company_id, user_id, role)
VALUES (
  '<company_id>',
  '<user_id>',
  'owner'
);
```

### 4. Test Access
- Navigate to: `/dashboard/test-co/tools/brand-kit`
- Generate a brand kit
- Verify it's saved with the correct company_id

---

## 📝 Onboarding Data Examples

### Example 1: SaaS Startup
```json
{
  "company": {
    "name": "CloudSync Pro",
    "slug": "cloudsync-pro",
    "industry": "Technology",
    "company_size": "1-10",
    "business_type": "B2B",
    "website": "https://cloudsync.example.com"
  },
  "onboarding_data": {
    "goals": ["brand_awareness", "lead_generation", "product_launch"],
    "target_audience": "CTOs and IT managers at mid-size companies",
    "pain_points": [
      "Generic branding doesn't stand out",
      "No in-house design team",
      "Need consistent brand across multiple channels"
    ],
    "current_tools": ["Canva", "Google Workspace"],
    "budget": "1000-5000",
    "timeline": "1-2 months",
    "custom_fields": {
      "primary_color_preference": "Blue or Purple",
      "brand_personality": "Professional yet approachable",
      "competitors": ["Dropbox Business", "Box.com"]
    }
  }
}
```

### Example 2: E-Commerce
```json
{
  "company": {
    "name": "EcoWear Boutique",
    "slug": "ecowear",
    "industry": "Fashion",
    "company_size": "1-10",
    "business_type": "B2C"
  },
  "onboarding_data": {
    "goals": ["brand_identity", "social_media_presence"],
    "target_audience": "Environmentally conscious millennials and Gen Z",
    "pain_points": [
      "Need cohesive brand for Instagram",
      "Want to convey sustainability values",
      "Limited design budget"
    ],
    "brand_values": ["Sustainability", "Transparency", "Quality"],
    "custom_fields": {
      "brand_mood": "Natural, earthy, minimalist",
      "avoid": "Fast fashion aesthetics"
    }
  }
}
```

---

## 🚨 Important Notes

### Multi-Tenant Isolation
- All queries MUST filter by company_id
- RLS policies enforce this at the database level
- Even with service role key, always include company_id

### Role Hierarchy
1. **Owner** - Full control, can delete company
2. **Admin** - Can manage users and settings
3. **Editor** - Can create/edit content
4. **Member** - Can view and create own content
5. **Viewer** - Read-only access

### Soft Deletes
- Companies and brand_kits use `deleted_at` for soft deletes
- Always filter: `WHERE deleted_at IS NULL`
- Allows data recovery and audit trails

---

## ✅ Checklist

Before going live:
- [ ] Schema executed in Supabase
- [ ] Tables verified (5 tables created)
- [ ] RLS policies active
- [ ] Test company created
- [ ] User signed up and linked to company
- [ ] Brand kit generator works with company_id
- [ ] Dashboard accessible at `/dashboard/[slug]`
- [ ] Service layer updated for multi-tenancy
- [ ] Onboarding flow captures company data
- [ ] Activity logging implemented

---

## 🆘 Troubleshooting

### "Could not execute SQL"
- Make sure you're in the SQL Editor (not the Table Editor)
- Try running in smaller sections if it times out
- Check for syntax errors

### "RLS Policy Prevents Access"
- Verify user is linked in `company_users` table
- Check user's `status = 'active'`
- Confirm company's `deleted_at IS NULL`

### "Company Not Found"
- Verify slug is lowercase with hyphens only
- Check company exists: `SELECT * FROM companies WHERE slug = 'your-slug'`
- Ensure user has access via `company_users`

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenancy Patterns](https://supabase.com/docs/guides/database/multi-tenancy)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Ready to set up?** Open the SQL Editor and paste the schema! 🚀
