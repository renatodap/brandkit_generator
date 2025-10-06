-- ============================================
-- Persimmon Labs - Hybrid Personal/Business Account Schema
-- ============================================
-- Supports BOTH:
-- 1. Personal accounts (individuals owning multiple businesses)
-- 2. Business accounts (teams collaborating on company resources)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: user_profiles
-- Extended profile information for all users
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Info
  full_name VARCHAR(255),
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,

  -- Contact (separate from auth.users email for privacy)
  phone VARCHAR(50),
  website VARCHAR(500),

  -- Account Type
  account_type VARCHAR(50) NOT NULL DEFAULT 'personal', -- 'personal' or 'business'

  -- Preferences
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'

  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_type ON user_profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- ============================================
-- TABLE: businesses
-- Businesses owned by personal users OR managed as business accounts
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership Model
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- ^ NULL if business account (managed by team), otherwise personal owner

  is_registered BOOLEAN DEFAULT false,
  -- ^ true = Has a Persimmon Labs business account with team members
  -- ^ false = Personal user's business (no team collaboration)

  -- Business Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  legal_name VARCHAR(255),
  logo_url TEXT,

  -- Contact Information
  website VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United States',

  -- Business Details
  industry VARCHAR(100),
  company_size VARCHAR(50), -- '1-10', '11-50', '51-200', '201-500', '500+'
  business_type VARCHAR(50), -- 'B2B', 'B2C', 'B2B2C'
  founded_year INTEGER,

  -- Onboarding/Discovery Data (JSONB for flexibility)
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  -- Examples:
  -- {
  --   "goals": ["brand_awareness", "lead_generation"],
  --   "target_audience": "Small business owners",
  --   "pain_points": ["Limited marketing budget"],
  --   "current_tools": ["Canva", "Google Ads"],
  --   "brand_values": ["Innovation", "Trust"],
  --   "competitors": ["CompanyA", "CompanyB"]
  -- }

  -- Subscription (only for registered businesses)
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'starter', 'pro', 'enterprise'
  subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'trial', 'cancelled', 'suspended'
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  CONSTRAINT business_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT business_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT registered_requires_no_owner CHECK (
    (is_registered = false) OR (is_registered = true AND owner_user_id IS NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_owner_user_id ON businesses(owner_user_id) WHERE deleted_at IS NULL AND owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_is_registered ON businesses(is_registered) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE: business_members
-- Team members for REGISTERED businesses only
-- Personal businesses don't have members (only owner)
-- ============================================
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role & Permissions
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'editor', 'member', 'viewer'
  permissions JSONB DEFAULT '[]'::jsonb,

  -- Member Profile within Business
  job_title VARCHAR(100),
  department VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'invited', 'suspended'
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_business_member UNIQUE (business_id, user_id),
  CONSTRAINT business_must_be_registered CHECK (
    business_id IN (SELECT id FROM businesses WHERE is_registered = true)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_role ON business_members(business_id, role);

-- ============================================
-- TABLE: brand_kits
-- AI-generated brand kits
-- Can belong to:
-- 1. A personal user (owner_user_id set, business_id optional)
-- 2. A business (business_id set, owner_user_id = creator)
-- ============================================
CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership Model (flexible)
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ^ Always set - the user who created it

  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  -- ^ Optional - if associated with a business
  -- ^ NULL = personal brand kit (user's portfolio)
  -- ^ NOT NULL = business brand kit

  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  -- ^ Same as owner_user_id for personal, could be team member for business

  -- Brand Kit Data
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  industry VARCHAR(100),

  logo_url TEXT NOT NULL,
  logo_svg TEXT,
  colors JSONB NOT NULL,
  fonts JSONB NOT NULL,
  tagline TEXT,
  design_justification TEXT,

  -- User Actions
  is_favorite BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE, -- Active brand kit for the business
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Tags for organization
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  CONSTRAINT business_name_not_empty CHECK (char_length(business_name) > 0),
  CONSTRAINT only_one_published_per_business EXCLUDE USING btree (
    business_id WITH =, is_published WITH =
  ) WHERE (is_published = true AND deleted_at IS NULL AND business_id IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_kits_owner_user_id ON brand_kits(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_business_id ON brand_kits(business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_created_by ON brand_kits(created_by_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_created_at ON brand_kits(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_is_favorite ON brand_kits(owner_user_id, is_favorite) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_is_published ON brand_kits(business_id, is_published) WHERE deleted_at IS NULL AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_brand_kits_tags ON brand_kits USING gin(tags);

-- ============================================
-- TABLE: share_tokens
-- Public share links for brand kits
-- ============================================
CREATE TABLE IF NOT EXISTS share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id UUID NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Token
  token VARCHAR(64) NOT NULL UNIQUE,

  -- Access Control
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  max_views INTEGER,
  require_password BOOLEAN DEFAULT FALSE,
  password_hash TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_share_token UNIQUE (token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_brand_kit_id ON share_tokens(brand_kit_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires_at ON share_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- TABLE: activity_logs
-- Audit trail for important actions
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  -- Action Details
  action_type VARCHAR(100) NOT NULL, -- 'brand_kit.created', 'business.created', etc.
  resource_type VARCHAR(100), -- 'brand_kit', 'business', 'business_member'
  resource_id UUID,

  -- Context
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON activity_logs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

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

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_members_updated_at ON business_members;
CREATE TRIGGER update_business_members_updated_at
  BEFORE UPDATE ON business_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_kits_updated_at ON brand_kits;
CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'personal')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Increment brand kit view count
CREATE OR REPLACE FUNCTION increment_brand_kit_view_count(kit_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE brand_kits
  SET view_count = view_count + 1, last_viewed_at = NOW()
  WHERE id = kit_id;
END;
$$ LANGUAGE plpgsql;

-- Track share token access
CREATE OR REPLACE FUNCTION track_share_token_access(token_value VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE share_tokens
  SET view_count = view_count + 1, last_accessed_at = NOW()
  WHERE token = token_value;
END;
$$ LANGUAGE plpgsql;

-- Get user's accessible businesses (owned + member of)
CREATE OR REPLACE FUNCTION get_user_business_ids(user_uuid UUID)
RETURNS TABLE(business_id UUID) AS $$
BEGIN
  RETURN QUERY
  -- Personal businesses (owner)
  SELECT id FROM businesses
  WHERE owner_user_id = user_uuid
    AND deleted_at IS NULL
  UNION
  -- Registered businesses (team member)
  SELECT bm.business_id FROM business_members bm
  WHERE bm.user_id = user_uuid
    AND bm.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Check if user can access business
CREATE OR REPLACE FUNCTION user_can_access_business(user_uuid UUID, business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    -- Owner of personal business
    SELECT 1 FROM businesses
    WHERE id = business_uuid
      AND owner_user_id = user_uuid
      AND deleted_at IS NULL
    UNION
    -- Member of registered business
    SELECT 1 FROM business_members
    WHERE business_id = business_uuid
      AND user_id = user_uuid
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: user_profiles
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- RLS POLICIES: businesses
-- ============================================

DROP POLICY IF EXISTS "Users can view their businesses" ON businesses;
CREATE POLICY "Users can view their businesses"
  ON businesses FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      -- Personal business owner
      owner_user_id = auth.uid()
      OR
      -- Member of registered business
      id IN (
        SELECT business_id FROM business_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  WITH CHECK (
    -- Personal accounts can create businesses with owner_user_id set
    (owner_user_id = auth.uid() AND is_registered = false)
    OR
    -- Business accounts require no owner but user must be setting up as member
    (owner_user_id IS NULL AND is_registered = true)
  );

DROP POLICY IF EXISTS "Business owners can update their business" ON businesses;
CREATE POLICY "Business owners can update their business"
  ON businesses FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      -- Personal business owner
      owner_user_id = auth.uid()
      OR
      -- Admin/owner of registered business
      id IN (
        SELECT business_id FROM business_members
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role IN ('owner', 'admin')
      )
    )
  );

DROP POLICY IF EXISTS "Business owners can delete their business" ON businesses;
CREATE POLICY "Business owners can delete their business"
  ON businesses FOR DELETE
  USING (
    owner_user_id = auth.uid()
    OR
    id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'owner'
    )
  );

-- ============================================
-- RLS POLICIES: business_members
-- ============================================

DROP POLICY IF EXISTS "Members can view team members" ON business_members;
CREATE POLICY "Members can view team members"
  ON business_members FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admins can manage team members" ON business_members;
CREATE POLICY "Admins can manage team members"
  ON business_members FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: brand_kits
-- ============================================

DROP POLICY IF EXISTS "Users can view their brand kits" ON brand_kits;
CREATE POLICY "Users can view their brand kits"
  ON brand_kits FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      -- Personal brand kits (owner)
      owner_user_id = auth.uid()
      OR
      -- Business brand kits (team member)
      business_id IN (
        SELECT business_id FROM business_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Users can create brand kits" ON brand_kits;
CREATE POLICY "Users can create brand kits"
  ON brand_kits FOR INSERT
  WITH CHECK (
    owner_user_id = auth.uid()
    AND created_by_user_id = auth.uid()
    AND (
      -- Personal brand kit (no business association)
      business_id IS NULL
      OR
      -- Business brand kit (user has access to business)
      business_id IN (
        SELECT id FROM businesses WHERE owner_user_id = auth.uid() AND deleted_at IS NULL
        UNION
        SELECT business_id FROM business_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their brand kits" ON brand_kits;
CREATE POLICY "Users can update their brand kits"
  ON brand_kits FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      owner_user_id = auth.uid()
      OR
      business_id IN (
        SELECT business_id FROM business_members
        WHERE user_id = auth.uid()
          AND status = 'active'
          AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their brand kits" ON brand_kits;
CREATE POLICY "Users can delete their brand kits"
  ON brand_kits FOR DELETE
  USING (
    owner_user_id = auth.uid()
    OR
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: share_tokens
-- ============================================

DROP POLICY IF EXISTS "Anyone can read valid share tokens" ON share_tokens;
CREATE POLICY "Anyone can read valid share tokens"
  ON share_tokens FOR SELECT
  USING (
    (expires_at IS NULL OR expires_at > NOW())
    AND (max_views IS NULL OR view_count < max_views)
  );

DROP POLICY IF EXISTS "Users can create share tokens for their brand kits" ON share_tokens;
CREATE POLICY "Users can create share tokens for their brand kits"
  ON share_tokens FOR INSERT
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND brand_kit_id IN (
      SELECT id FROM brand_kits
      WHERE deleted_at IS NULL
        AND (
          owner_user_id = auth.uid()
          OR
          business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid() AND status = 'active'
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can delete their share tokens" ON share_tokens;
CREATE POLICY "Users can delete their share tokens"
  ON share_tokens FOR DELETE
  USING (
    brand_kit_id IN (
      SELECT id FROM brand_kits
      WHERE deleted_at IS NULL
        AND (
          owner_user_id = auth.uid()
          OR
          business_id IN (
            SELECT business_id FROM business_members
            WHERE user_id = auth.uid() AND status = 'active'
          )
        )
    )
  );

-- ============================================
-- RLS POLICIES: activity_logs
-- ============================================

DROP POLICY IF EXISTS "Users can view their activity logs" ON activity_logs;
CREATE POLICY "Users can view their activity logs"
  ON activity_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Service role can insert logs
DROP POLICY IF EXISTS "Service role can insert activity logs" ON activity_logs;
CREATE POLICY "Service role can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'businesses', 'business_members', 'brand_kits', 'share_tokens', 'activity_logs')
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'businesses', 'business_members', 'brand_kits', 'share_tokens', 'activity_logs')
ORDER BY tablename;

-- Check policies count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('user_profiles', 'businesses', 'business_members', 'brand_kits', 'share_tokens', 'activity_logs')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Persimmon Labs Hybrid Account Schema Created Successfully!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables Created:';
  RAISE NOTICE '   • user_profiles (personal/business account profiles)';
  RAISE NOTICE '   • businesses (personal + registered businesses)';
  RAISE NOTICE '   • business_members (team collaboration)';
  RAISE NOTICE '   • brand_kits (personal + business brand kits)';
  RAISE NOTICE '   • share_tokens (public sharing)';
  RAISE NOTICE '   • activity_logs (audit trail)';
  RAISE NOTICE '';
  RAISE NOTICE '🎭 Account Types Supported:';
  RAISE NOTICE '   1. PERSONAL ACCOUNTS';
  RAISE NOTICE '      - Individual users (freelancers, entrepreneurs)';
  RAISE NOTICE '      - Can own UNLIMITED businesses';
  RAISE NOTICE '      - Businesses do NOT need Persimmon Labs accounts';
  RAISE NOTICE '      - Full control over all their businesses';
  RAISE NOTICE '';
  RAISE NOTICE '   2. BUSINESS ACCOUNTS';
  RAISE NOTICE '      - Registered companies with teams';
  RAISE NOTICE '      - Multiple team members with roles';
  RAISE NOTICE '      - Collaborative workspace';
  RAISE NOTICE '      - Advanced features & subscription tiers';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security:';
  RAISE NOTICE '   • Row Level Security (RLS) enabled';
  RAISE NOTICE '   • Personal businesses isolated to owner';
  RAISE NOTICE '   • Team businesses use role-based access';
  RAISE NOTICE '   • Auto-profile creation on signup';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Sign up: /sign-up';
  RAISE NOTICE '   2. Choose account type: Personal or Business';
  RAISE NOTICE '   3. Personal: Create businesses (unlimited)';
  RAISE NOTICE '   4. Business: Invite team members';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ============================================
-- EXAMPLE: Personal Account Workflow
-- ============================================
/*
-- 1. User signs up (profile auto-created as 'personal')
-- user_id: 123e4567-e89b-12d3-a456-426614174000

-- 2. User creates their first business (no Persimmon Labs account needed)
INSERT INTO businesses (name, slug, industry, owner_user_id, is_registered, onboarding_data)
VALUES (
  'My Coffee Shop',
  'my-coffee-shop',
  'Food & Beverage',
  '123e4567-e89b-12d3-a456-426614174000',
  false, -- Not a registered business account
  '{
    "target_audience": "Local coffee enthusiasts",
    "brand_personality": "Cozy, artisanal, community-focused"
  }'::jsonb
)
RETURNING id;

-- 3. User creates another business (same user, different business)
INSERT INTO businesses (name, slug, industry, owner_user_id, is_registered)
VALUES (
  'Tech Startup LLC',
  'tech-startup-llc',
  'Technology',
  '123e4567-e89b-12d3-a456-426614174000',
  false
)
RETURNING id;

-- 4. User generates brand kits for each business
-- Both are owned by the same user, but for different businesses
*/

-- ============================================
-- EXAMPLE: Business Account Workflow
-- ============================================
/*
-- 1. Create a registered business account (NO owner_user_id)
INSERT INTO businesses (name, slug, industry, is_registered, subscription_tier)
VALUES (
  'Acme Corporation',
  'acme-corp',
  'Technology',
  true, -- Registered business with team
  'pro'
)
RETURNING id;
-- business_id: 456e7890-e89b-12d3-a456-426614174111

-- 2. Add founding member as owner
INSERT INTO business_members (business_id, user_id, role)
VALUES (
  '456e7890-e89b-12d3-a456-426614174111',
  '789e0123-e89b-12d3-a456-426614174222', -- Different user
  'owner'
);

-- 3. Invite team members
INSERT INTO business_members (business_id, user_id, role, status)
VALUES (
  '456e7890-e89b-12d3-a456-426614174111',
  '012e3456-e89b-12d3-a456-426614174333',
  'editor',
  'invited'
);

-- 4. Team creates brand kits for the business
-- business_id is set, created_by_user_id tracks who made it
*/
