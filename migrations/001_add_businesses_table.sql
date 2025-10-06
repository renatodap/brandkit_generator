-- ============================================
-- Migration 001: Add Businesses Table and Multi-Business Support
-- ============================================
-- This migration adds support for multi-business architecture
-- Run this SQL in your Supabase SQL Editor after backing up your data
--
-- What this migration does:
-- 1. Creates businesses table
-- 2. Migrates existing brand kits to businesses
-- 3. Adds business_id foreign key to brand_kits
-- 4. Enforces 1:1 relationship (one brand kit per business)
-- 5. Updates RLS policies
--
-- IMPORTANT: Backup your database before running this migration!
-- ============================================

-- ============================================
-- STEP 1: Create businesses table
-- ============================================

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  industry VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT business_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT business_slug_not_empty CHECK (char_length(slug) > 0),
  CONSTRAINT business_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT unique_user_slug UNIQUE (user_id, slug)
);

COMMENT ON TABLE public.businesses IS 'Stores user businesses - each business can have one brand kit';
COMMENT ON COLUMN public.businesses.slug IS 'URL-safe unique identifier per user (e.g., "my-startup")';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses(created_at DESC);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 2: Create businesses from existing brand kits
-- ============================================
-- This ensures no data loss for existing users
-- Each brand kit will get its own business

DO $$
DECLARE
  kit RECORD;
  business_slug TEXT;
  slug_counter INTEGER;
BEGIN
  FOR kit IN SELECT * FROM public.brand_kits ORDER BY created_at
  LOOP
    -- Generate initial slug from business_name
    business_slug := lower(
      regexp_replace(
        regexp_replace(
          trim(kit.business_name),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    );

    -- Remove leading/trailing hyphens
    business_slug := trim(both '-' from business_slug);

    -- Ensure slug is not empty
    IF business_slug = '' OR business_slug IS NULL THEN
      business_slug := 'business-' || substr(kit.id::text, 1, 8);
    END IF;

    -- Check if slug already exists for this user, if so append counter
    slug_counter := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.businesses
      WHERE user_id = kit.user_id
      AND slug = business_slug
    ) LOOP
      business_slug := lower(
        regexp_replace(
          regexp_replace(
            trim(kit.business_name),
            '[^a-zA-Z0-9\s-]', '', 'g'
          ),
          '\s+', '-', 'g'
        )
      ) || '-' || slug_counter;
      slug_counter := slug_counter + 1;
    END LOOP;

    -- Insert business
    INSERT INTO public.businesses (
      id,
      user_id,
      name,
      slug,
      description,
      industry,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      kit.user_id,
      kit.business_name,
      business_slug,
      kit.business_description,
      kit.industry,
      kit.created_at,
      kit.created_at
    )
    ON CONFLICT (user_id, slug) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- STEP 3: Add business_id column to brand_kits
-- ============================================

-- Add column as nullable first
ALTER TABLE public.brand_kits
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.brand_kits.business_id IS 'Foreign key to businesses table - enforces 1:1 relationship';

-- ============================================
-- STEP 4: Link existing brand kits to businesses
-- ============================================
-- Match brand kits to businesses by user_id and name

UPDATE public.brand_kits bk
SET business_id = (
  SELECT b.id
  FROM public.businesses b
  WHERE b.user_id = bk.user_id
  AND b.name = bk.business_name
  LIMIT 1
)
WHERE business_id IS NULL;

-- Create businesses for any brand kits that couldn't be matched (edge case)
INSERT INTO public.businesses (user_id, name, slug, description, industry, created_at)
SELECT DISTINCT
  bk.user_id,
  bk.business_name,
  lower(
    regexp_replace(
      regexp_replace(
        trim(bk.business_name),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  ) || '-' || substr(bk.id::text, 1, 8) as slug,
  bk.business_description,
  bk.industry,
  bk.created_at
FROM public.brand_kits bk
WHERE bk.business_id IS NULL
ON CONFLICT (user_id, slug) DO NOTHING;

-- Link the remaining brand kits
UPDATE public.brand_kits bk
SET business_id = (
  SELECT b.id
  FROM public.businesses b
  WHERE b.user_id = bk.user_id
  AND b.name = bk.business_name
  LIMIT 1
)
WHERE business_id IS NULL;

-- ============================================
-- STEP 5: Make business_id NOT NULL and add UNIQUE constraint
-- ============================================

-- Verify all brand kits have business_id before making it NOT NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.brand_kits WHERE business_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot make business_id NOT NULL: some brand kits have NULL business_id. Please investigate.';
  END IF;
END $$;

-- Make business_id required
ALTER TABLE public.brand_kits
ALTER COLUMN business_id SET NOT NULL;

-- Add unique constraint (one brand kit per business)
ALTER TABLE public.brand_kits
ADD CONSTRAINT brand_kits_business_id_unique UNIQUE (business_id);

-- Add index for foreign key
CREATE INDEX IF NOT EXISTS idx_brand_kits_business_id ON public.brand_kits(business_id);

-- ============================================
-- STEP 6: Update Row Level Security (RLS) policies
-- ============================================

-- Enable RLS on businesses table
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Businesses policies
DROP POLICY IF EXISTS "Users can view own businesses" ON public.businesses;
CREATE POLICY "Users can view own businesses"
  ON public.businesses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own businesses" ON public.businesses;
CREATE POLICY "Users can insert own businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own businesses" ON public.businesses;
CREATE POLICY "Users can update own businesses"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own businesses" ON public.businesses;
CREATE POLICY "Users can delete own businesses"
  ON public.businesses FOR DELETE
  USING (auth.uid() = user_id);

-- Update brand_kits RLS policies to include business ownership check
DROP POLICY IF EXISTS "Users can view own brand kits" ON public.brand_kits;
CREATE POLICY "Users can view own brand kits"
  ON public.brand_kits FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT b.user_id FROM public.businesses b WHERE b.id = brand_kits.business_id
    )
  );

DROP POLICY IF EXISTS "Users can insert own brand kits" ON public.brand_kits;
CREATE POLICY "Users can insert own brand kits"
  ON public.brand_kits FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IN (
      SELECT b.user_id FROM public.businesses b WHERE b.id = brand_kits.business_id
    )
  );

DROP POLICY IF EXISTS "Users can update own brand kits" ON public.brand_kits;
CREATE POLICY "Users can update own brand kits"
  ON public.brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own brand kits" ON public.brand_kits;
CREATE POLICY "Users can delete own brand kits"
  ON public.brand_kits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify success

-- Check all brand kits have business_id
DO $$
DECLARE
  orphaned_kits INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_kits
  FROM public.brand_kits
  WHERE business_id IS NULL;

  IF orphaned_kits > 0 THEN
    RAISE WARNING 'Found % brand kits without business_id!', orphaned_kits;
  ELSE
    RAISE NOTICE '✓ All brand kits have business_id';
  END IF;
END $$;

-- Check one-to-one relationship
DO $$
DECLARE
  duplicate_kits INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_kits
  FROM (
    SELECT business_id, COUNT(*) as kit_count
    FROM public.brand_kits
    GROUP BY business_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_kits > 0 THEN
    RAISE WARNING 'Found % businesses with multiple brand kits!', duplicate_kits;
  ELSE
    RAISE NOTICE '✓ One-to-one relationship verified';
  END IF;
END $$;

-- Show migration summary
DO $$
DECLARE
  total_businesses INTEGER;
  total_kits INTEGER;
  kits_with_business INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_businesses FROM public.businesses;
  SELECT COUNT(*) INTO total_kits FROM public.brand_kits;
  SELECT COUNT(*) INTO kits_with_business FROM public.brand_kits WHERE business_id IS NOT NULL;

  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Migration 001 Complete';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Total businesses: %', total_businesses;
  RAISE NOTICE 'Total brand kits: %', total_kits;
  RAISE NOTICE 'Brand kits linked: %', kits_with_business;
  RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ============================================
-- WARNING: This will delete the businesses table and remove the relationship
-- Only use if you need to revert the migration

-- To rollback, run:
-- ALTER TABLE public.brand_kits DROP CONSTRAINT IF EXISTS brand_kits_business_id_unique;
-- ALTER TABLE public.brand_kits DROP CONSTRAINT IF EXISTS brand_kits_business_id_fkey;
-- ALTER TABLE public.brand_kits DROP COLUMN IF EXISTS business_id;
-- DROP TABLE IF EXISTS public.businesses CASCADE;

-- Then restore RLS policies from backup

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Verify verification queries above show success
-- 2. Test API endpoints: /api/businesses, /api/generate-brand-kit
-- 3. Deploy frontend changes
-- 4. Test end-to-end user flow
-- ============================================
