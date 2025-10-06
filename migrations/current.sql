-- ============================================
-- Brand Kit Generator - Current Database Schema
-- ============================================
-- This represents the CURRENT state of the database after all migrations
-- DO NOT RUN THIS - It's for reference only
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: businesses
-- ============================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name CHARACTER VARYING NOT NULL,
  slug CHARACTER VARYING NOT NULL,
  description TEXT,
  industry CHARACTER VARYING,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT business_name_not_empty CHECK (char_length(name::text) > 0),
  CONSTRAINT business_slug_not_empty CHECK (char_length(slug::text) > 0),
  CONSTRAINT business_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT unique_user_slug UNIQUE (user_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses(created_at DESC);

-- ============================================
-- TABLE: brand_kits
-- ============================================
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL UNIQUE,

  -- Business Info
  business_name CHARACTER VARYING NOT NULL,
  business_description TEXT,
  industry CHARACTER VARYING,

  -- Brand Kit Data
  logo_url TEXT NOT NULL,
  logo_svg TEXT,
  colors JSONB NOT NULL,
  fonts JSONB NOT NULL,
  tagline TEXT,

  -- User Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT brand_kits_pkey PRIMARY KEY (id),
  CONSTRAINT brand_kits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT brand_kits_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT business_name_not_empty CHECK (char_length(business_name::text) > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_kits_user_id ON public.brand_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_kits_business_id ON public.brand_kits(business_id);
CREATE INDEX IF NOT EXISTS idx_brand_kits_created_at ON public.brand_kits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_kits_is_favorite ON public.brand_kits(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_brand_kits_user_created ON public.brand_kits(user_id, created_at DESC);

-- ============================================
-- TABLE: share_tokens
-- ============================================
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  brand_kit_id UUID NOT NULL,
  token CHARACTER VARYING NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT share_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT share_tokens_brand_kit_id_fkey FOREIGN KEY (brand_kit_id) REFERENCES public.brand_kits(id) ON DELETE CASCADE,
  CONSTRAINT unique_share_token UNIQUE (token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON public.share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_brand_kit_id ON public.share_tokens(brand_kit_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires_at ON public.share_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for brand_kits
DROP TRIGGER IF EXISTS update_brand_kits_updated_at ON public.brand_kits;
CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for businesses
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Increment view count
CREATE OR REPLACE FUNCTION increment_brand_kit_view_count(kit_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.brand_kits
  SET
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE id = kit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

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

-- Brand kits policies
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

-- Share tokens policies
DROP POLICY IF EXISTS "Anyone can view active share tokens" ON public.share_tokens;
CREATE POLICY "Anyone can view active share tokens"
  ON public.share_tokens FOR SELECT
  USING (expires_at IS NULL OR expires_at > NOW());

DROP POLICY IF EXISTS "Users can manage own share tokens" ON public.share_tokens;
CREATE POLICY "Users can manage own share tokens"
  ON public.share_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_kits
      WHERE brand_kits.id = share_tokens.brand_kit_id
      AND brand_kits.user_id = auth.uid()
    )
  );

-- ============================================
-- END OF SCHEMA
-- ============================================
