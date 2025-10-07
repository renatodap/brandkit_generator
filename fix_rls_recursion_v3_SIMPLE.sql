-- Fix RLS Policy Infinite Recursion (Version 3 - ULTRA SIMPLE)
-- Problem: Even SELECT policies cause recursion when used with INSERT...RETURNING
-- Solution: ZERO cross-table references in ANY policies on businesses table

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop ALL businesses policies
DROP POLICY IF EXISTS "Users can view own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON public.businesses;
DROP POLICY IF EXISTS "view_own_or_member_businesses" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_select_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_policy_insert" ON public.businesses;
DROP POLICY IF EXISTS "businesses_policy_select" ON public.businesses;
DROP POLICY IF EXISTS "businesses_policy_update" ON public.businesses;
DROP POLICY IF EXISTS "businesses_policy_delete" ON public.businesses;

-- Drop ALL business_members policies
DROP POLICY IF EXISTS "view_own_or_member_business_members" ON public.business_members;
DROP POLICY IF EXISTS "manage_own_business_members" ON public.business_members;
DROP POLICY IF EXISTS "Members can view business members" ON public.business_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.business_members;
DROP POLICY IF EXISTS "business_members_select_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_insert_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_update_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_delete_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_policy_select" ON public.business_members;
DROP POLICY IF EXISTS "business_members_policy_insert" ON public.business_members;
DROP POLICY IF EXISTS "business_members_policy_update" ON public.business_members;
DROP POLICY IF EXISTS "business_members_policy_delete" ON public.business_members;

-- ============================================
-- STEP 2: CREATE ULTRA-SIMPLE POLICIES
-- ============================================

-- CRITICAL RULE TO AVOID RECURSION:
-- businesses table policies = ZERO references to ANY other table
-- business_members table policies = CAN reference businesses (one-way only)

-- ============================================
-- BUSINESSES TABLE - OWNER ONLY (NO TEAM ACCESS VIA RLS)
-- ============================================
-- Note: Team member access will be handled in application code,
-- not via RLS policies, to avoid recursion completely.

CREATE POLICY "businesses_owner_only_insert"
  ON public.businesses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "businesses_owner_only_select"
  ON public.businesses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "businesses_owner_only_update"
  ON public.businesses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "businesses_owner_only_delete"
  ON public.businesses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- BUSINESS_MEMBERS TABLE
-- ============================================

CREATE POLICY "members_select"
  ON public.business_members
  FOR SELECT
  USING (
    -- You can see yourself as a member
    auth.uid() = user_id
    OR
    -- Business owner can see all members
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert"
  ON public.business_members
  FOR INSERT
  WITH CHECK (
    -- Only business owner can add members
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "members_update"
  ON public.business_members
  FOR UPDATE
  USING (
    -- Only business owner can update
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "members_delete"
  ON public.business_members
  FOR DELETE
  USING (
    -- Business owner OR self-removal
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.user_id = auth.uid()
    )
    OR
    auth.uid() = user_id
  );

-- ============================================
-- IMPORTANT: APPLICATION-LEVEL TEAM ACCESS
-- ============================================
-- Since businesses RLS now only checks ownership (to avoid recursion),
-- the application code must handle team member access by:
-- 1. Querying business_members to get business IDs user has access to
-- 2. Then querying businesses with those IDs using .in() filter
--
-- This is already implemented in getBusinesses() service function!

-- ============================================
-- VERIFICATION
-- ============================================
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('businesses', 'business_members')
-- ORDER BY tablename, cmd;
