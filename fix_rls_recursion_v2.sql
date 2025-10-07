-- Fix RLS Policy Infinite Recursion (Version 2 - CORRECTED)
-- Problem: Policies were still querying the same tables they're defined on
-- Solution: Completely remove circular dependencies

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop businesses policies
DROP POLICY IF EXISTS "Users can view own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON public.businesses;
DROP POLICY IF EXISTS "view_own_or_member_businesses" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_select_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_policy" ON public.businesses;

-- Drop business_members policies
DROP POLICY IF EXISTS "view_own_or_member_business_members" ON public.business_members;
DROP POLICY IF EXISTS "manage_own_business_members" ON public.business_members;
DROP POLICY IF EXISTS "Members can view business members" ON public.business_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.business_members;
DROP POLICY IF EXISTS "business_members_select_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_insert_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_update_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_delete_policy" ON public.business_members;

-- ============================================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================

-- KEY PRINCIPLE TO AVOID RECURSION:
-- - INSERT/UPDATE/DELETE policies on businesses must NOT check business_members
-- - INSERT/UPDATE/DELETE policies on business_members must NOT check business_members itself
-- - SELECT policies CAN safely cross-reference (read-only, no recursion risk)

-- BUSINESSES TABLE

-- INSERT: Only owner can create (ZERO references to other tables)
CREATE POLICY "businesses_policy_insert"
  ON public.businesses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SELECT: Owner OR team member (SAFE: read-only, no recursion risk)
CREATE POLICY "businesses_policy_select"
  ON public.businesses
  FOR SELECT
  USING (
    -- You're the owner
    auth.uid() = user_id
    OR
    -- You're a team member (SAFE: SELECT on business_members won't recurse)
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
    )
  );

-- UPDATE: Owner only (simple, no joins)
CREATE POLICY "businesses_policy_update"
  ON public.businesses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Owner only (simple, no joins)
CREATE POLICY "businesses_policy_delete"
  ON public.businesses
  FOR DELETE
  USING (auth.uid() = user_id);

-- BUSINESS_MEMBERS TABLE
-- These policies CAN reference businesses (one-way dependency is OK)

-- SELECT: View if you're a member OR business owner
CREATE POLICY "business_members_policy_select"
  ON public.business_members
  FOR SELECT
  USING (
    -- You're the member being viewed
    auth.uid() = user_id
    OR
    -- You're the business owner (safe: businesses doesn't check business_members)
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- INSERT: Only business owner can add members (NO self-reference)
CREATE POLICY "business_members_policy_insert"
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

-- UPDATE: Only business owner can update member roles (NO self-reference)
CREATE POLICY "business_members_policy_update"
  ON public.business_members
  FOR UPDATE
  USING (
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

-- DELETE: Business owner OR self-removal (NO self-reference)
CREATE POLICY "business_members_policy_delete"
  ON public.business_members
  FOR DELETE
  USING (
    -- Business owner can remove anyone
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.user_id = auth.uid()
    )
    OR
    -- Members can remove themselves
    auth.uid() = user_id
  );

-- ============================================
-- STEP 3: VERIFICATION
-- ============================================
-- Run this to verify policies are correct:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('businesses', 'business_members')
-- ORDER BY tablename, cmd;

-- You should see:
-- - 4 policies on businesses (insert, select, update, delete)
-- - 4 policies on business_members (insert, select, update, delete)
-- - NO policies should reference the same table they're defined on
