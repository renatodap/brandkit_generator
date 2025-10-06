-- Team Collaboration System Migration
-- Enables multi-user collaboration on businesses with role-based access control

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- business_members: Tracks active members and their roles
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_business_member UNIQUE(business_id, user_id)
);

-- business_invitations: Tracks pending invitations
CREATE TABLE IF NOT EXISTS business_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- business_access_requests: Tracks user requests to join businesses
CREATE TABLE IF NOT EXISTS business_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('editor', 'viewer')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_role ON business_members(role);

CREATE INDEX IF NOT EXISTS idx_business_invitations_business_id ON business_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_invitations_email ON business_invitations(email);
CREATE INDEX IF NOT EXISTS idx_business_invitations_token ON business_invitations(token);
CREATE INDEX IF NOT EXISTS idx_business_invitations_status ON business_invitations(status);
CREATE INDEX IF NOT EXISTS idx_business_invitations_expires_at ON business_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_business_access_requests_business_id ON business_access_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_business_access_requests_user_id ON business_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_business_access_requests_status ON business_access_requests(status);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_access_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES: business_members
-- =====================================================

-- Select: Members can view other members of their businesses
CREATE POLICY "view_business_members"
ON business_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_members.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
      )
    )
  )
);

-- Insert: Owner and admins can add members
CREATE POLICY "add_members_with_permission"
ON business_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_members.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Update: Owner and admins can update roles
CREATE POLICY "update_members_with_permission"
ON business_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_members.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Delete: Owner, admins, or the member themselves can remove
CREATE POLICY "remove_members_with_permission"
ON business_members FOR DELETE
USING (
  user_id = auth.uid() -- Members can leave
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_members.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- =====================================================
-- 5. RLS POLICIES: business_invitations
-- =====================================================

-- Select: Owner, admins, and the invitee can view
CREATE POLICY "view_invitations"
ON business_invitations FOR SELECT
USING (
  invited_by = auth.uid()
  OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Insert: Owner and admins can invite
CREATE POLICY "create_invitations_with_permission"
ON business_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Update: Owner, admins, and invitee can update (for status changes)
CREATE POLICY "update_invitations_with_permission"
ON business_invitations FOR UPDATE
USING (
  invited_by = auth.uid()
  OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Delete: Owner and admins can revoke invitations
CREATE POLICY "revoke_invitations_with_permission"
ON business_invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- =====================================================
-- 6. RLS POLICIES: business_access_requests
-- =====================================================

-- Select: Requester, owner, and admins can view
CREATE POLICY "view_access_requests"
ON business_access_requests FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_access_requests.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Insert: Any authenticated user can request access
CREATE POLICY "create_access_request"
ON business_access_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update: Owner and admins can update (for approval/rejection)
CREATE POLICY "update_access_requests_with_permission"
ON business_access_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_access_requests.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Delete: Requester can withdraw request
CREATE POLICY "delete_own_access_request"
ON business_access_requests FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- 7. UPDATE EXISTING POLICIES: businesses table
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete own businesses" ON businesses;

-- Select: Users can view businesses they own or are members of
CREATE POLICY "view_own_or_member_businesses"
ON businesses FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = businesses.id
    AND bm.user_id = auth.uid()
  )
);

-- Insert: Users can create their own businesses
CREATE POLICY "insert_own_business"
ON businesses FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Update: Owner, admins, and editors can update
CREATE POLICY "update_business_with_permission"
ON businesses FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM business_members bm
    WHERE bm.business_id = businesses.id
    AND bm.user_id = auth.uid()
    AND bm.role IN ('admin', 'editor')
  )
);

-- Delete: Only owner can delete
CREATE POLICY "delete_own_business"
ON businesses FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- 8. UPDATE EXISTING POLICIES: brand_kits table
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own brand kits" ON brand_kits;
DROP POLICY IF EXISTS "Users can insert their own brand kits" ON brand_kits;
DROP POLICY IF EXISTS "Users can update their own brand kits" ON brand_kits;
DROP POLICY IF EXISTS "Users can delete their own brand kits" ON brand_kits;

-- Select: Users can view brand kits for businesses they own or are members of
CREATE POLICY "view_brand_kits_with_permission"
ON brand_kits FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = brand_kits.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
      )
    )
  )
);

-- Insert: Users can create brand kits for businesses they own or are editors/admins of
CREATE POLICY "insert_brand_kits_with_permission"
ON brand_kits FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = brand_kits.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('admin', 'editor')
      )
    )
  )
);

-- Update: Users can update brand kits for businesses they own or are editors/admins of
CREATE POLICY "update_brand_kits_with_permission"
ON brand_kits FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = brand_kits.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('admin', 'editor')
      )
    )
  )
);

-- Delete: Users can delete brand kits for businesses they own or are editors/admins of
CREATE POLICY "delete_brand_kits_with_permission"
ON brand_kits FOR DELETE
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = brand_kits.business_id
    AND (
      b.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('admin', 'editor')
      )
    )
  )
);

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has permission for a business
CREATE OR REPLACE FUNCTION has_business_permission(
  p_user_id UUID,
  p_business_id UUID,
  p_required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_member_role TEXT;
BEGIN
  -- Check if user is owner
  SELECT EXISTS (
    SELECT 1 FROM businesses
    WHERE id = p_business_id AND user_id = p_user_id
  ) INTO v_is_owner;

  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Check member role
  SELECT role INTO v_member_role
  FROM business_members
  WHERE business_id = p_business_id AND user_id = p_user_id;

  IF v_member_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check role hierarchy
  CASE p_required_role
    WHEN 'viewer' THEN
      RETURN TRUE;
    WHEN 'editor' THEN
      RETURN v_member_role IN ('editor', 'admin');
    WHEN 'admin' THEN
      RETURN v_member_role = 'admin';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Function to get user's role in a business
CREATE OR REPLACE FUNCTION get_user_business_role(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if owner
  IF EXISTS (
    SELECT 1 FROM businesses
    WHERE id = p_business_id AND user_id = p_user_id
  ) THEN
    RETURN 'owner';
  END IF;

  -- Check member role
  SELECT role INTO v_role
  FROM business_members
  WHERE business_id = p_business_id AND user_id = p_user_id;

  RETURN v_role;
END;
$$;

-- Function to clean up expired invitations (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE business_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- =====================================================
-- 10. TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_members_updated_at
  BEFORE UPDATE ON business_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_invitations_updated_at
  BEFORE UPDATE ON business_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_access_requests_updated_at
  BEFORE UPDATE ON business_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Comments for documentation
COMMENT ON TABLE business_members IS 'Tracks active team members of businesses with their roles';
COMMENT ON TABLE business_invitations IS 'Tracks pending invitations sent by business owners/admins';
COMMENT ON TABLE business_access_requests IS 'Tracks user requests to join businesses';

COMMENT ON COLUMN business_members.role IS 'Member role: admin (manage team + edit), editor (edit only), viewer (read-only)';
COMMENT ON COLUMN business_invitations.token IS 'Unique token for invitation link';
COMMENT ON COLUMN business_invitations.expires_at IS 'Invitation expiration date (default 7 days)';
