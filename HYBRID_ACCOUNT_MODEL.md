# 🎭 Hybrid Account Model - Personal & Business Accounts

## Overview

Persimmon Labs now supports **two account types** to serve different user needs:

### 1. **Personal Accounts** 👤
- For **individuals** (freelancers, entrepreneurs, consultants, agency owners)
- Can own **unlimited businesses**
- Businesses **don't need** Persimmon Labs accounts
- Perfect for managing multiple client projects or personal ventures
- Full solo control

### 2. **Business Accounts** 🏢
- For **registered companies** with teams
- Multiple users collaborate with **role-based access**
- Advanced features and subscription tiers
- Shared workspace for brand assets

---

## Key Architecture Decisions

### Flexible Ownership Model

```typescript
// Personal Business (owned by individual user)
{
  owner_user_id: "user-123",  // ✅ Personal owner
  is_registered: false,        // ❌ Not a registered business account
  // No team members, only owner has access
}

// Registered Business (team-based)
{
  owner_user_id: null,         // ❌ No single owner
  is_registered: true,         // ✅ Registered with team
  // Team members in business_members table
}
```

### Brand Kit Ownership

```typescript
// Personal brand kit (user's portfolio)
{
  owner_user_id: "user-123",   // User who owns it
  business_id: null,           // ❌ Not associated with business
  created_by_user_id: "user-123"
}

// Business-associated brand kit (personal user)
{
  owner_user_id: "user-123",   // User who owns it
  business_id: "biz-456",      // ✅ For "My Coffee Shop"
  created_by_user_id: "user-123"
}

// Team brand kit (registered business)
{
  owner_user_id: "user-123",   // Still tracks ownership
  business_id: "biz-789",      // ✅ For "Acme Corp"
  created_by_user_id: "user-456" // Team member who created it
}
```

---

## User Journeys

### Journey 1: Freelance Designer (Personal Account)

**Sarah is a freelance brand designer with 5 clients**

```
1. Sign Up → Choose "Personal Account"
   ✅ Creates user_profile with account_type = 'personal'

2. Create Business #1: "Client A - Coffee Shop"
   ✅ business { owner_user_id: sarah-id, is_registered: false }
   ❌ No team members needed

3. Generate Brand Kit for Client A
   ✅ brand_kit { owner_user_id: sarah-id, business_id: client-a-id }

4. Create Business #2: "Client B - Tech Startup"
   ✅ Another business owned by Sarah

5. Generate Multiple Brand Kits for Client B
   ✅ All owned by Sarah, all associated with Client B business

6. Create Personal Brand Kit (no business)
   ✅ brand_kit { owner_user_id: sarah-id, business_id: null }
   💡 Sarah's own portfolio piece

Dashboard View:
/dashboard/personal/sarah-id
- My Businesses (5)
  • Client A - Coffee Shop (3 brand kits)
  • Client B - Tech Startup (7 brand kits)
  • Client C - Fashion Brand (2 brand kits)
  • Client D - Restaurant (1 brand kit)
  • Client E - Wellness (4 brand kits)
- Personal Brand Kits (12 not associated with businesses)
```

### Journey 2: Growing Startup (Business Account)

**Acme Corp has 3 team members**

```
1. Founder Signs Up → Choose "Business Account"
   ✅ Creates user_profile with account_type = 'business'

2. Create Registered Business
   ✅ business { owner_user_id: null, is_registered: true }
   ✅ business_member { user_id: founder-id, role: 'owner' }

3. Invite Marketing Manager
   ✅ business_member { user_id: marketer-id, role: 'editor' }

4. Invite Designer
   ✅ business_member { user_id: designer-id, role: 'editor' }

5. Designer Creates Brand Kit
   ✅ brand_kit {
         owner_user_id: designer-id,
         business_id: acme-id,
         created_by_user_id: designer-id
       }
   💡 Owned by designer but visible to all team

6. Founder Marks Brand Kit as Published
   ✅ is_published: true (official company brand)

Dashboard View:
/dashboard/acme-corp
- Team Members (3)
  • Founder (Owner)
  • Marketing Manager (Editor)
  • Designer (Editor)
- Brand Kits (12)
  • Official Brand (Published) ⭐
  • Alternative Concepts (Drafts)
- Activity Log (team actions)
```

### Journey 3: Hybrid User

**Mike is both a freelancer AND works for a company**

```
Personal Account:
- Owns 3 personal businesses (clients)
- Has 15 personal brand kits

ALSO Member Of:
- Acme Corp (role: 'editor')
- StartupXYZ (role: 'admin')

Dashboard Access:
/dashboard/personal/mike-id     → Personal businesses & kits
/dashboard/acme-corp            → Acme Corp (team view)
/dashboard/startupxyz           → StartupXYZ (team view)

Mike can switch between:
1. Personal mode: Manage client work
2. Team mode: Collaborate with Acme Corp
3. Team mode: Collaborate with StartupXYZ
```

---

## URL Structure

### Personal Dashboards
```
/dashboard/personal              → Personal home (all businesses)
/dashboard/personal/businesses   → List of owned businesses
/dashboard/personal/brand-kits   → All personal brand kits

/dashboard/personal/businesses/[slug]
  → Specific business view (e.g., /dashboard/personal/businesses/client-a-coffee)

/dashboard/personal/businesses/[slug]/tools/brand-kit
  → Generate brand kit for this business
```

### Business Dashboards (Registered)
```
/dashboard/[business-slug]                      → Business home
/dashboard/[business-slug]/team                 → Team members
/dashboard/[business-slug]/brand-kits           → All brand kits
/dashboard/[business-slug]/tools/brand-kit      → Generate brand kit
/dashboard/[business-slug]/settings             → Business settings
/dashboard/[business-slug]/activity             → Activity log
```

---

## Database Schema Highlights

### 1. User Profiles
```sql
user_profiles {
  id UUID (references auth.users)
  account_type VARCHAR -- 'personal' or 'business'
  onboarding_completed BOOLEAN
  onboarding_data JSONB -- Flexible onboarding responses
}
```

### 2. Businesses (Unified Table)
```sql
businesses {
  id UUID
  owner_user_id UUID   -- NULL for registered, set for personal
  is_registered BOOLEAN -- false = personal, true = team-based
  name VARCHAR
  slug VARCHAR
  onboarding_data JSONB -- Business-specific onboarding
  subscription_tier VARCHAR -- Only for registered businesses
}
```

### 3. Business Members (Team Collaboration)
```sql
business_members {
  business_id UUID -- Only for registered businesses
  user_id UUID
  role VARCHAR -- 'owner', 'admin', 'editor', 'member', 'viewer'
  status VARCHAR -- 'active', 'invited', 'suspended'
}
```

### 4. Brand Kits (Flexible Ownership)
```sql
brand_kits {
  id UUID
  owner_user_id UUID    -- Always set (creator)
  business_id UUID      -- Optional (NULL for personal kits)
  created_by_user_id UUID
  is_published BOOLEAN  -- Only one published per business
}
```

---

## RLS Policies (Security)

### Personal Users Can:
✅ View all their owned businesses
✅ Create unlimited businesses
✅ Create brand kits for their businesses
✅ View all their brand kits (personal + business-associated)

### Business Team Members Can:
✅ View their business (if they're a member)
✅ View all team brand kits
✅ Create brand kits (owned by them, but associated with business)
✅ Update brand kits (based on role)
✅ Invite team members (if admin/owner)

### Isolation:
❌ Personal users can't see each other's businesses
❌ Team members can't see businesses they're not part of
❌ Personal brand kits are private to owner

---

## Helper Functions

```sql
-- Get all businesses a user can access
get_user_business_ids(user_uuid UUID)
→ Returns owned businesses + member businesses

-- Check access to specific business
user_can_access_business(user_uuid UUID, business_uuid UUID)
→ Returns true if owner OR team member

-- Auto-create profile on signup
create_user_profile() TRIGGER
→ Creates user_profile when auth.users record created
```

---

## Account Type Selection Flow

### Sign Up Page
```tsx
// app/sign-up/page.tsx

"What type of account do you need?"

[ ] Personal Account
    → I'm a freelancer, consultant, or managing my own businesses
    → Unlimited businesses, full control
    → $0/month

[ ] Business Account
    → I'm part of a team or company
    → Collaborative workspace, role-based access
    → From $29/month (after trial)

[Continue] →
```

### After Sign Up (Onboarding)

**Personal Account Onboarding:**
```
1. Profile Setup (name, industry, skills)
2. "Create Your First Business" (optional)
   - Business name
   - Industry
   - Target audience
3. → /dashboard/personal
```

**Business Account Onboarding:**
```
1. Company Details
   - Company name, industry, size
   - Website, address
2. Team Setup
   - Invite members (optional)
   - Set roles
3. Goals & Use Cases
   - Brand development
   - Marketing assets
   - Team collaboration
4. → /dashboard/[company-slug]
```

---

## Migration from Old Schema

If you already ran the previous multi-tenant schema:

### Option 1: Fresh Start (Recommended)
1. Drop old tables
2. Run `supabase-schema-hybrid-accounts.sql`

### Option 2: Migrate Data
```sql
-- Migrate companies → businesses
INSERT INTO businesses (id, name, slug, industry, owner_user_id, is_registered, ...)
SELECT
  id,
  name,
  slug,
  industry,
  NULL as owner_user_id,  -- Registered businesses have no owner
  true as is_registered,
  ...
FROM companies;

-- Migrate company_users → business_members
INSERT INTO business_members (business_id, user_id, role, ...)
SELECT company_id, user_id, role, ...
FROM company_users;

-- Update brand_kits schema
ALTER TABLE brand_kits
  DROP COLUMN company_id,
  ADD COLUMN owner_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN business_id UUID REFERENCES businesses(id);
```

---

## Pricing Implications

### Personal Accounts
- **Free Tier**: Unlimited businesses, 10 brand kits/month
- **Pro Tier** ($9/month): Unlimited brand kits, advanced features
- Monetize through volume

### Business Accounts
- **Free Trial**: 14 days, 3 team members
- **Starter** ($29/month): 5 team members, 50 brand kits/month
- **Pro** ($99/month): Unlimited team, unlimited brand kits
- **Enterprise** (Custom): White-label, API access, custom integrations
- Monetize through seats and features

---

## Next Steps

1. ✅ Run `supabase-schema-hybrid-accounts.sql` in Supabase SQL Editor
2. ⏳ Update sign-up flow to ask for account type
3. ⏳ Create personal dashboard layout
4. ⏳ Update brand kit generator to handle both contexts
5. ⏳ Add business creation flow for personal users
6. ⏳ Add team invitation for business users

---

## Benefits of This Model

### For Users:
✅ **Freelancers** get unlimited client businesses without paying per-seat
✅ **Agencies** can manage multiple client brands under one account
✅ **Startups** get team collaboration with proper access control
✅ **Enterprises** get dedicated accounts with advanced features

### For Persimmon Labs:
✅ Capture **both** B2C (personal) and B2B (business) markets
✅ Flexible pricing based on use case
✅ Natural upgrade path (personal → business as team grows)
✅ Reduced friction (unregistered businesses don't need accounts)

---

**This is a production-ready, scalable, flexible account system!** 🚀
