# Business-Based Brand Kit System - Migration Guide

## Overview

The brand kit generator has been updated to support a multi-business architecture where:
- Users can create multiple **businesses** within their personal account
- Each business can have **one brand kit** associated with it
- This provides better organization and scalability for users managing multiple brands

---

## Database Changes

### New Schema

Run the migration SQL file provided to update your Supabase database:

```bash
supabase db execute --file add_businesses_table.sql
```

**Key Changes:**
1. **New `businesses` table** - Stores user businesses with unique slugs
2. **Updated `brand_kits` table** - Now includes `business_id` foreign key (NOT NULL, UNIQUE)
3. **RLS policies updated** - Brand kits now enforce ownership through businesses table
4. **Cascading deletes** - Deleting a business deletes its associated brand kit

---

## Backend Changes Completed

### 1. TypeScript Types (`types/index.ts`)

**New types:**
- `Business` - Business entity with id, user_id, name, slug, description, industry
- `BrandKitWithBusiness` - Brand kit with associated business information

**Updated types:**
- `BrandKit` - Now includes optional `business_id` field

### 2. Validation Schemas

#### Business Validations (`lib/validations/business.ts`)
- `createBusinessSchema` - Validates business creation (name, slug, description, industry)
- `updateBusinessSchema` - Validates business updates
- `listBusinessesSchema` - Validates query parameters for listing businesses
- `generateSlug()` - Helper function to auto-generate URL-safe slugs

#### Brand Kit Validations (`lib/validations/brand-kit.ts`)
- **Updated:** `createBrandKitSchema` - Now requires `businessId` field

#### Enhanced Input Validation (`lib/validations.ts`)
- **Updated:** `enhancedBrandKitInputSchema` - Now requires `businessId` UUID

### 3. Service Layer

#### Business Service (`lib/services/business-service.ts`)
All operations enforce RLS policies (users can only access their own businesses):

- `createBusiness(userId, data)` - Create new business
- `getBusinesses(userId, query)` - List businesses with filters/pagination
- `getBusinessById(businessId, userId)` - Get single business
- `getBusinessBySlug(slug, userId)` - Get business by slug
- `updateBusiness(businessId, userId, data)` - Update business
- `deleteBusiness(businessId, userId)` - Delete business (cascades to brand kit)
- `isSlugAvailable(slug, userId, excludeId?)` - Check slug availability

#### Brand Kit Service (`lib/services/brand-kit-service.ts`)
**Updated:**
- `createBrandKit(userId, data)` - Now requires `businessId`, verifies business ownership, enforces one kit per business
- **New:** `getBrandKitByBusinessId(businessId, userId)` - Get brand kit for a specific business

### 4. API Routes

#### Business APIs

**`/api/businesses` (GET, POST)**
- `GET` - List all businesses for authenticated user
  - Query params: limit, offset, sort, order, industry
  - Returns: { businesses, total, limit, offset }
- `POST` - Create new business
  - Body: { name, slug, description?, industry? }
  - Returns: Business object

**`/api/businesses/[id]` (GET, PATCH, DELETE)**
- `GET` - Get business by ID
- `PATCH` - Update business
  - Body: { name?, slug?, description?, industry? }
- `DELETE` - Delete business (cascades to brand kit)

**`/api/businesses/check-slug` (GET)**
- Check if slug is available
- Query params: slug (required), excludeId (optional)
- Returns: { available: boolean }

#### Brand Kit APIs

**Updated: `/api/generate-brand-kit` (POST)**
- **Now requires `businessId` in request body**
- Validates business ownership before creating brand kit
- Enforces one brand kit per business constraint

---

## Frontend Changes Required

The following UI changes need to be implemented:

### 1. Business Selection Component (`components/business-selector.tsx`)

Create a component that allows users to:
- View their existing businesses
- Select a business for brand kit generation
- Create a new business inline

**Example UI:**
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select a business" />
  </SelectTrigger>
  <SelectContent>
    {businesses.map(business => (
      <SelectItem key={business.id} value={business.id}>
        {business.name}
      </SelectItem>
    ))}
    <Separator />
    <Button onClick={() => setShowCreateDialog(true)}>
      + Create New Business
    </Button>
  </SelectContent>
</Select>
```

### 2. Update Dashboard (`app/dashboard/page.tsx`)

**Changes needed:**
- Fetch businesses instead of brand kits directly
- Display businesses as cards
- Show "Generate Brand Kit" button for businesses without kits
- Show "View Brand Kit" button for businesses with kits

**Example structure:**
```tsx
// Fetch businesses
const { businesses } = await fetch('/api/businesses');

// For each business, check if it has a brand kit
businesses.map(business => (
  <Card key={business.id}>
    <CardHeader>
      <CardTitle>{business.name}</CardTitle>
      <CardDescription>{business.industry}</CardDescription>
    </CardHeader>
    <CardContent>
      {business.has_brand_kit ? (
        <Button onClick={() => router.push(`/brand-kit/${business.brand_kit_id}`)}>
          View Brand Kit
        </Button>
      ) : (
        <Button onClick={() => router.push(`/tools/brand-kit?businessId=${business.id}`)}>
          Generate Brand Kit
        </Button>
      )}
    </CardContent>
  </Card>
))
```

### 3. Business Management Page (`app/dashboard/businesses/page.tsx`)

Create a page to manage businesses:
- List all businesses
- Create new business
- Edit business (name, slug, description, industry)
- Delete business (with warning about brand kit deletion)

### 4. Update Brand Kit Generation Flow (`app/tools/brand-kit/page.tsx`)

**Changes needed:**
- Add business selection step before form
- If `businessId` query param exists, pre-select that business
- Pass `businessId` to `/api/generate-brand-kit`

**Example flow:**
```tsx
// Step 1: Select or create business
const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

// Step 2: Fill out brand kit form (existing form)
const onSubmit = async (data) => {
  const response = await fetch('/api/generate-brand-kit', {
    method: 'POST',
    body: JSON.stringify({
      businessId: selectedBusinessId, // NEW: Required field
      businessName: data.businessName,
      businessDescription: data.businessDescription,
      // ... rest of fields
    }),
  });
};
```

### 5. Create Business Dialog (`components/create-business-dialog.tsx`)

Reusable dialog component for creating businesses:
- Form fields: name, slug (auto-generated from name), description, industry
- Real-time slug availability checking
- Slug validation and formatting

---

## Migration Strategy

### For Existing Users

The migration SQL automatically:
1. Creates a business for each existing brand kit
2. Uses the brand kit's `business_name` as the business name
3. Generates a slug from the business name
4. Links the brand kit to the new business via `business_id`

**No data loss** - All existing brand kits will be preserved.

### For New Users

New users will follow the updated flow:
1. Create a business first
2. Generate a brand kit for that business
3. Optionally create additional businesses

---

## Testing Checklist

Before deploying, test:

### Backend
- [ ] Business CRUD operations work correctly
- [ ] RLS policies enforce user ownership
- [ ] Slug uniqueness is enforced per user
- [ ] Brand kit creation requires valid `businessId`
- [ ] One brand kit per business constraint works
- [ ] Deleting a business cascades to its brand kit
- [ ] Brand kit by business ID retrieval works

### Frontend
- [ ] Users can list their businesses
- [ ] Users can create new businesses
- [ ] Users can select a business before generating a kit
- [ ] Brand kit generation fails without `businessId`
- [ ] Dashboard shows businesses correctly
- [ ] Users can navigate to business brand kits
- [ ] Slug validation and auto-generation works
- [ ] Delete business shows warning about brand kit

---

## API Examples

### Create a Business

```bash
curl -X POST http://localhost:3000/api/businesses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Startup Inc",
    "slug": "tech-startup-inc",
    "description": "Innovative tech solutions",
    "industry": "tech"
  }'
```

### List Businesses

```bash
curl -X GET "http://localhost:3000/api/businesses?limit=10&sort=created_at&order=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Generate Brand Kit for Business

```bash
curl -X POST http://localhost:3000/api/generate-brand-kit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "uuid-of-business",
    "businessName": "Tech Startup Inc",
    "businessDescription": "We build innovative tech solutions...",
    "industry": "tech",
    "logoOption": "generate",
    "colorOption": "generate",
    "fontOption": "generate"
  }'
```

---

## Security Notes

1. **RLS Policies** - All database operations enforce row-level security
2. **Business Ownership** - Brand kits can only be created for businesses owned by the authenticated user
3. **Service Role Key** - Only used for public share tokens (bypasses RLS safely)
4. **Input Validation** - All inputs validated with Zod schemas
5. **Slug Uniqueness** - Enforced per user at database level

---

## Rollback Plan

If issues arise, you can rollback by:

1. Reverting the migration:
```sql
-- Remove business_id constraint from brand_kits
ALTER TABLE brand_kits DROP CONSTRAINT brand_kits_business_id_unique;
ALTER TABLE brand_kits ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE brand_kits DROP CONSTRAINT brand_kits_business_id_fkey;
ALTER TABLE brand_kits DROP COLUMN business_id;

-- Drop businesses table
DROP TABLE businesses CASCADE;

-- Restore original RLS policies
-- (see original schema file)
```

2. Reverting code changes via git

---

## Next Steps

1. ✅ Apply database migration
2. ⏳ Implement frontend UI components
3. ⏳ Update brand kit generation flow
4. ⏳ Update dashboard to show businesses
5. ⏳ Test end-to-end flow
6. ⏳ Deploy to production

---

## Support

For questions or issues, refer to:
- `CLAUDE.md` - Production standards
- `lib/services/business-service.ts` - Business service implementation
- `lib/services/brand-kit-service.ts` - Brand kit service implementation
