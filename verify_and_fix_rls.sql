-- ============================================
-- Verify and Fix RLS Policies
-- ============================================
-- This script checks current policies and ensures clean state

-- ============================================
-- STEP 1: CHECK CURRENT POLICIES
-- ============================================
SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN policyname LIKE '%owner_only%' THEN '✅ V3'
    ELSE '⚠️ Old/Mixed'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('businesses', 'business_members')
ORDER BY tablename, cmd;

-- ============================================
-- STEP 2: NUCLEAR OPTION - DROP ALL POLICIES
-- ============================================
-- Run this if you see ANY old policies or mixed versions

DO $$
DECLARE
  pol record;
BEGIN
  -- Drop all policies on businesses table
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'businesses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.businesses', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;

  -- Drop all policies on business_members table
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'business_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.business_members', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- ============================================
-- STEP 3: CREATE CLEAN V3 POLICIES
-- ============================================

-- BUSINESSES TABLE - OWNER ONLY (ZERO CROSS-REFS)
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

-- BUSINESS_MEMBERS TABLE (CAN REFERENCE BUSINESSES)
CREATE POLICY "members_select"
  ON public.business_members
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
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
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_members.business_id
      AND businesses.user_id = auth.uid()
    )
    OR
    auth.uid() = user_id
  );

-- ============================================
-- STEP 4: VERIFY FINAL STATE
-- ============================================
SELECT
  tablename,
  policyname,
  cmd as operation,
  '✅ Clean V3' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('businesses', 'business_members')
ORDER BY tablename, cmd;
