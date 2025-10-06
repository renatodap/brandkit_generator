-- ============================================
-- Brand Kit Generator - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Project Settings → SQL Editor → New Query → Paste and Run
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: brand_kits
-- ============================================
-- Note: user_id references auth.users(id) - Supabase's built-in auth table

CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business Info
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  industry VARCHAR(100),

  -- Brand Kit Data
  logo_url TEXT NOT NULL,           -- Base64 data URL or Supabase Storage URL
  logo_svg TEXT,                     -- SVG code (if available)
  colors JSONB NOT NULL,            -- Array of color objects [{name, hex, usage}]
  fonts JSONB NOT NULL,             -- {primary, secondary}
  tagline TEXT,

  -- User Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT business_name_not_empty CHECK (char_length(business_name) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_kits_user_id ON brand_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_kits_created_at ON brand_kits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_kits_is_favorite ON brand_kits(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_brand_kits_user_created ON brand_kits(user_id, created_at DESC);

-- ============================================
-- TABLE: share_tokens
-- ============================================
CREATE TABLE IF NOT EXISTS share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id UUID NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,  -- Random secure token (e.g., abc123xyz)
  expires_at TIMESTAMPTZ,              -- NULL = never expires
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_share_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_brand_kit_id ON share_tokens(brand_kit_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires_at ON share_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on brand_kits
DROP TRIGGER IF EXISTS update_brand_kits_updated_at ON brand_kits;
CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Increment view count
-- ============================================
CREATE OR REPLACE FUNCTION increment_brand_kit_view_count(kit_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE brand_kits
  SET
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE id = kit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: brand_kits table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own brand kits" ON brand_kits;
DROP POLICY IF EXISTS "Users can insert own brand kits" ON brand_kits;
DROP POLICY IF EXISTS "Users can update own brand kits" ON brand_kits;
DROP POLICY IF EXISTS "Users can delete own brand kits" ON brand_kits;

-- Users can view only their own brand kits
CREATE POLICY "Users can view own brand kits"
  ON brand_kits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own brand kits
CREATE POLICY "Users can insert own brand kits"
  ON brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own brand kits
CREATE POLICY "Users can update own brand kits"
  ON brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own brand kits
CREATE POLICY "Users can delete own brand kits"
  ON brand_kits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: share_tokens table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read valid share tokens" ON share_tokens;
DROP POLICY IF EXISTS "Users can create share tokens for own kits" ON share_tokens;
DROP POLICY IF EXISTS "Users can delete own share tokens" ON share_tokens;

-- Anyone can read valid (non-expired) share tokens
-- This allows public access to shared brand kits
CREATE POLICY "Anyone can read valid share tokens"
  ON share_tokens FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );

-- Users can create share tokens for their own brand kits
CREATE POLICY "Users can create share tokens for own kits"
  ON share_tokens FOR INSERT
  WITH CHECK (
    brand_kit_id IN (
      SELECT id FROM brand_kits
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete share tokens for their own brand kits
CREATE POLICY "Users can delete own share tokens"
  ON share_tokens FOR DELETE
  USING (
    brand_kit_id IN (
      SELECT id FROM brand_kits
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify your setup worked:

-- Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('brand_kits', 'share_tokens');

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('brand_kits', 'share_tokens');

-- Check policies created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('brand_kits', 'share_tokens')
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📋 Tables: brand_kits, share_tokens';
  RAISE NOTICE '🔒 Row Level Security (RLS) policies enabled';
  RAISE NOTICE '👤 Uses Supabase Auth (auth.users table)';
  RAISE NOTICE '🎯 Next step: Test authentication at /sign-up';
END $$;
