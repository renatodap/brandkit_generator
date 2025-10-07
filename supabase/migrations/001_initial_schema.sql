-- ============================================================================
-- Brand Kit Generator - Initial Database Schema
-- ============================================================================
-- Migration: 001_initial_schema
-- Description: Creates all tables, RLS policies, and functions for the app
-- Author: Claude Code
-- Date: 2025-10-06
-- ============================================================================

-- NOTE: This migration assumes you have a Supabase project with auth.users table
-- The auth.users table is automatically created by Supabase Auth

-- ============================================================================
-- 1. BUSINESSES TABLE
-- ============================================================================
-- Stores business entities. Users can create multiple businesses.

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name character varying NOT NULL CHECK (char_length(name::text) > 0),
  slug character varying NOT NULL CHECK (char_length(slug::text) > 0),
  description text,
  industry character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT businesses_user_id_slug_key UNIQUE (user_id, slug)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- Row Level Security
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own businesses"
  ON public.businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses"
  ON public.businesses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. BRAND_KITS TABLE
-- ============================================================================
-- Stores generated brand kits. One brand kit per business.

CREATE TABLE IF NOT EXISTS public.brand_kits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL UNIQUE,
  business_name character varying NOT NULL CHECK (char_length(business_name::text) > 0),
  business_description text,
  industry character varying,
  logo_url text NOT NULL,
  logo_svg text,
  colors jsonb NOT NULL,
  fonts jsonb NOT NULL,
  tagline text,
  design_justification text,
  is_favorite boolean DEFAULT false,
  view_count integer DEFAULT 0,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brand_kits_pkey PRIMARY KEY (id),
  CONSTRAINT brand_kits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT brand_kits_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_kits_user_id ON public.brand_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_kits_business_id ON public.brand_kits(business_id);
CREATE INDEX IF NOT EXISTS idx_brand_kits_is_favorite ON public.brand_kits(is_favorite) WHERE is_favorite = true;

-- Row Level Security
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand kits"
  ON public.brand_kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand kits"
  ON public.brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kits"
  ON public.brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand kits"
  ON public.brand_kits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. SHARE_TOKENS TABLE
-- ============================================================================
-- Stores public share links for brand kits

CREATE TABLE IF NOT EXISTS public.share_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_kit_id uuid NOT NULL,
  token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT share_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT share_tokens_brand_kit_id_fkey FOREIGN KEY (brand_kit_id) REFERENCES public.brand_kits(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON public.share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_brand_kit_id ON public.share_tokens(brand_kit_id);

-- Row Level Security
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can SELECT share tokens (for public sharing)
CREATE POLICY "Anyone can view share tokens"
  ON public.share_tokens FOR SELECT
  USING (true);

-- Only brand kit owners can INSERT share tokens
CREATE POLICY "Brand kit owners can create share tokens"
  ON public.share_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_kits
      WHERE brand_kits.id = brand_kit_id
      AND brand_kits.user_id = auth.uid()
    )
  );

-- Only brand kit owners can DELETE share tokens
CREATE POLICY "Brand kit owners can delete share tokens"
  ON public.share_tokens FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_kits
      WHERE brand_kits.id = brand_kit_id
      AND brand_kits.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. BUSINESS_MEMBERS TABLE
-- ============================================================================
-- Stores team members for businesses with role-based access

CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'editor'::text, 'viewer'::text])),
  invited_by uuid,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_members_pkey PRIMARY KEY (id),
  CONSTRAINT business_members_business_id_user_id_key UNIQUE (business_id, user_id),
  CONSTRAINT business_members_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT business_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT business_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON public.business_members(user_id);

-- Row Level Security
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view team members"
  ON public.business_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can manage members"
  ON public.business_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. BUSINESS_INVITATIONS TABLE
-- ============================================================================
-- Stores email invitations to join businesses

CREATE TABLE IF NOT EXISTS public.business_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'editor'::text, 'viewer'::text])),
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'expired'::text])),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT business_invitations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT business_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_invitations_token ON public.business_invitations(token);
CREATE INDEX IF NOT EXISTS idx_business_invitations_business_id ON public.business_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_invitations_email ON public.business_invitations(email);

-- Row Level Security
ALTER TABLE public.business_invitations ENABLE ROW LEVEL SECURITY;

-- Anyone can view invitations by token (for accepting)
CREATE POLICY "Anyone can view invitations by token"
  ON public.business_invitations FOR SELECT
  USING (true);

-- Business owners can create invitations
CREATE POLICY "Business owners can create invitations"
  ON public.business_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Business owners can update/delete invitations
CREATE POLICY "Business owners can manage invitations"
  ON public.business_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. BUSINESS_ACCESS_REQUESTS TABLE
-- ============================================================================
-- Stores access requests from users wanting to join businesses

CREATE TABLE IF NOT EXISTS public.business_access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  requested_role text NOT NULL CHECK (requested_role = ANY (ARRAY['editor'::text, 'viewer'::text])),
  message text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_access_requests_pkey PRIMARY KEY (id),
  CONSTRAINT business_access_requests_business_id_user_id_key UNIQUE (business_id, user_id),
  CONSTRAINT business_access_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT business_access_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT business_access_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_access_requests_business_id ON public.business_access_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_business_access_requests_user_id ON public.business_access_requests(user_id);

-- Row Level Security
ALTER TABLE public.business_access_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON public.business_access_requests FOR SELECT
  USING (user_id = auth.uid());

-- Users can create requests
CREATE POLICY "Users can create access requests"
  ON public.business_access_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Business owners can view and manage requests
CREATE POLICY "Business owners can manage requests"
  ON public.business_access_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. UTILITY FUNCTIONS
-- ============================================================================

-- Function to increment brand kit view count
CREATE OR REPLACE FUNCTION increment_brand_kit_view_count(kit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.brand_kits
  SET view_count = view_count + 1,
      last_viewed_at = now()
  WHERE id = kit_id;
END;
$$;

-- Function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_members_updated_at
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_invitations_updated_at
  BEFORE UPDATE ON public.business_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_access_requests_updated_at
  BEFORE UPDATE ON public.business_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- To apply this migration:
-- 1. Copy this file to your Supabase SQL Editor
-- 2. Execute the entire script
-- 3. Verify all tables and policies were created successfully
-- 4. Test with a sample insert to verify RLS policies work
-- ============================================================================
