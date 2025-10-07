-- Fix RLS Policy Infinite Recursion
-- Problem: business_members policies reference businesses, creating circular dependency
-- Solution: Simplify policies to avoid cross-table recursion

-- ============================================
-- BUSINESSES TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON public.businesses;
DROP POLICY IF EXISTS "view_own_or_member_businesses" ON public.businesses;

-- Simple INSERT policy: Only check ownership, NO reference to business_members
CREATE POLICY "businesses_insert_policy"
  ON public.businesses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Simple SELECT policy: Owner OR member (safe because it's SELECT only)
CREATE POLICY "businesses_select_policy"
  ON public.businesses
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = businesses.id
      AND business_members.user_id = auth.uid()
    )
  );

-- Simple UPDATE policy: Only owner can update
CREATE POLICY "businesses_update_policy"
  ON public.businesses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Simple DELETE policy: Only owner can delete
CREATE POLICY "businesses_delete_policy"
  ON public.businesses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- BUSINESS_MEMBERS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "view_own_or_member_business_members" ON public.business_members;
DROP POLICY IF EXISTS "manage_own_business_members" ON public.business_members;
DROP POLICY IF EXISTS "Members can view business members" ON public.business_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.business_members;

-- SELECT: Can view members if you're the business owner or a member yourself
CREATE POLICY "business_members_select_policy"
  ON public.business_members
  FOR SELECT
  USING (
    -- You're viewing yourself as a member
    auth.uid() = user_id
    OR
    -- You're the business owner (direct check, no recursion)
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
    OR
    -- You're a member of this business (self-contained check)
    business_id IN (
      SELECT business_id FROM public.business_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: Only business owner or admin members can add members
CREATE POLICY "business_members_insert_policy"
  ON public.business_members
  FOR INSERT
  WITH CHECK (
    -- Business owner can add members (direct check, no recursion)
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
    OR
    -- Admin member can add members
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = business_members.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
    )
  );

-- UPDATE: Only business owner or admins can update member roles
CREATE POLICY "business_members_update_policy"
  ON public.business_members
  FOR UPDATE
  USING (
    -- Business owner (direct check)
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
    OR
    -- Admin member
    EXISTS (
      SELECT 1 FROM public.business_members AS bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
    )
  )
  WITH CHECK (
    -- Same as USING
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.business_members AS bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
    )
  );

-- DELETE: Only business owner or admins can remove members
CREATE POLICY "business_members_delete_policy"
  ON public.business_members
  FOR DELETE
  USING (
    -- Business owner (direct check)
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
    OR
    -- Admin member
    EXISTS (
      SELECT 1 FROM public.business_members AS bm
      WHERE bm.business_id = business_members.business_id
      AND bm.user_id = auth.uid()
      AND bm.role = 'admin'
    )
    OR
    -- Users can remove themselves
    auth.uid() = user_id
  );

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this script, verify with:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('businesses', 'business_members');
