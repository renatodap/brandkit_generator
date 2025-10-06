-- ============================================
-- Persimmon Labs - Multi-Tenant Platform Schema
-- ============================================
-- This schema supports multiple companies/clients on the platform
-- Each company has their own dashboard, tools, and data
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: companies
-- Stores client companies using Persimmon Labs
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly identifier (e.g., "acme-corp")
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

  -- Business Details (from onboarding)
  industry VARCHAR(100),
  company_size VARCHAR(50), -- e.g., "1-10", "11-50", "51-200", "201-500", "500+"
  business_type VARCHAR(50), -- e.g., "B2B", "B2C", "B2B2C"
  annual_revenue VARCHAR(50), -- e.g., "<100k", "100k-1M", "1M-10M", "10M+"

  -- Onboarding Data (JSONB for flexibility)
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "goals": ["brand_awareness", "lead_generation"],
  --   "target_audience": "Small business owners",
  --   "pain_points": ["Limited marketing budget", "No in-house designer"],
  --   "current_tools": ["Canva", "Google Ads"],
  --   "custom_fields": { ... }
  -- }

  -- Subscription & Status
  subscription_tier VARCHAR(50) DEFAULT 'free', -- e.g., "free", "starter", "pro", "enterprise"
  subscription_status VARCHAR(50) DEFAULT 'active', -- e.g., "active", "trial", "cancelled", "suspended"
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  -- Example: { "timezone": "America/New_York", "date_format": "MM/DD/YYYY" }

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  CONSTRAINT company_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT company_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_subscription_tier ON companies(subscription_tier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- TABLE: company_users
-- Links auth.users to companies with roles
-- Many-to-many relationship (users can belong to multiple companies)
-- ============================================
CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role & Permissions
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- e.g., "owner", "admin", "editor", "member", "viewer"
  permissions JSONB DEFAULT '[]'::jsonb, -- Custom permissions array

  -- User Profile within Company
  job_title VARCHAR(100),
  department VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- e.g., "active", "invited", "suspended"
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_company_user UNIQUE (company_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_role ON company_users(company_id, role);

-- ============================================
-- TABLE: brand_kits
-- AI-generated brand kits (tool within company dashboard)
-- ============================================
CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Business Info (can differ from company info - allows experimentation)
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  industry VARCHAR(100),

  -- Brand Kit Data
  logo_url TEXT NOT NULL,
  logo_svg TEXT,
  colors JSONB NOT NULL,
  -- Example: {"primary": "#FF5733", "secondary": "#33FF57", ...}
  fonts JSONB NOT NULL,
  -- Example: {"primary": {"name": "Inter", "category": "sans-serif", ...}, ...}
  tagline TEXT,
  design_justification TEXT,

  -- User Actions
  is_favorite BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE, -- Whether this is the "active" brand kit for the company
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Constraints
  CONSTRAINT business_name_not_empty CHECK (char_length(business_name) > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_kits_company_id ON brand_kits(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_created_by ON brand_kits(created_by_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_created_at ON brand_kits(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_is_favorite ON brand_kits(company_id, is_favorite) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brand_kits_is_published ON brand_kits(company_id, is_published) WHERE deleted_at IS NULL AND is_published = true;

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
  max_views INTEGER, -- Optional: limit number of views
  require_password BOOLEAN DEFAULT FALSE,
  password_hash TEXT, -- Hashed password if required

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
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action Details
  action_type VARCHAR(100) NOT NULL, -- e.g., "brand_kit.created", "user.invited", "company.updated"
  resource_type VARCHAR(100), -- e.g., "brand_kit", "company_user"
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
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id, created_at DESC);
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
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_users_updated_at ON company_users;
CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_kits_updated_at ON brand_kits;
CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Increment brand kit view count
CREATE OR REPLACE FUNCTION increment_brand_kit_view_count(kit_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE brand_kits
  SET view_count = view_count + 1, last_viewed_at = NOW()
  WHERE id = kit_id;
END;
$$ LANGUAGE plpgsql;

-- Update share token access tracking
CREATE OR REPLACE FUNCTION track_share_token_access(token_value VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE share_tokens
  SET view_count = view_count + 1, last_accessed_at = NOW()
  WHERE token = token_value;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get user's company IDs
CREATE OR REPLACE FUNCTION get_user_company_ids(user_uuid UUID)
RETURNS TABLE(company_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cu.company_id
  FROM company_users cu
  WHERE cu.user_id = user_uuid
    AND cu.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: companies
-- ============================================

DROP POLICY IF EXISTS "Users can view their companies" ON companies;
CREATE POLICY "Users can view their companies"
  ON companies FOR SELECT
  USING (
    id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND status = 'active')
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Company owners can update their company" ON companies;
CREATE POLICY "Company owners can update their company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
    AND deleted_at IS NULL
  );

-- ============================================
-- RLS POLICIES: company_users
-- ============================================

DROP POLICY IF EXISTS "Users can view members of their companies" ON company_users;
CREATE POLICY "Users can view members of their companies"
  ON company_users FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Company admins can manage users" ON company_users;
CREATE POLICY "Company admins can manage users"
  ON company_users FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: brand_kits
-- ============================================

DROP POLICY IF EXISTS "Users can view brand kits from their companies" ON brand_kits;
CREATE POLICY "Users can view brand kits from their companies"
  ON brand_kits FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid() AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can create brand kits for their companies" ON brand_kits;
CREATE POLICY "Users can create brand kits for their companies"
  ON brand_kits FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid() AND status = 'active'
    )
    AND created_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update brand kits they created" ON brand_kits;
CREATE POLICY "Users can update brand kits they created"
  ON brand_kits FOR UPDATE
  USING (
    created_by_user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can delete brand kits they created" ON brand_kits;
CREATE POLICY "Users can delete brand kits they created"
  ON brand_kits FOR DELETE
  USING (
    created_by_user_id = auth.uid()
    OR company_id IN (
      SELECT company_id FROM company_users
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
    brand_kit_id IN (
      SELECT bk.id FROM brand_kits bk
      JOIN company_users cu ON cu.company_id = bk.company_id
      WHERE cu.user_id = auth.uid() AND cu.status = 'active' AND bk.deleted_at IS NULL
    )
    AND created_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own share tokens" ON share_tokens;
CREATE POLICY "Users can delete their own share tokens"
  ON share_tokens FOR DELETE
  USING (
    brand_kit_id IN (
      SELECT bk.id FROM brand_kits bk
      JOIN company_users cu ON cu.company_id = bk.company_id
      WHERE cu.user_id = auth.uid() AND cu.status = 'active' AND bk.deleted_at IS NULL
    )
  );

-- ============================================
-- RLS POLICIES: activity_logs
-- ============================================

DROP POLICY IF EXISTS "Users can view activity logs for their companies" ON activity_logs;
CREATE POLICY "Users can view activity logs for their companies"
  ON activity_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Only system/backend can insert logs (via service role)
DROP POLICY IF EXISTS "Service role can insert activity logs" ON activity_logs;
CREATE POLICY "Service role can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true); -- Controlled by service role authentication

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'company_users', 'brand_kits', 'share_tokens', 'activity_logs')
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'company_users', 'brand_kits', 'share_tokens', 'activity_logs')
ORDER BY tablename;

-- Check policies count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('companies', 'company_users', 'brand_kits', 'share_tokens', 'activity_logs')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Persimmon Labs Multi-Tenant Schema Created Successfully!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables Created:';
  RAISE NOTICE '   • companies (client companies)';
  RAISE NOTICE '   • company_users (user-company relationships with roles)';
  RAISE NOTICE '   • brand_kits (AI-generated brand kits)';
  RAISE NOTICE '   • share_tokens (public share links)';
  RAISE NOTICE '   • activity_logs (audit trail)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '   • Row Level Security (RLS) enabled on all tables';
  RAISE NOTICE '   • Multi-tenant isolation enforced';
  RAISE NOTICE '   • Role-based access control (owner, admin, editor, member, viewer)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Create your first company (see example below)';
  RAISE NOTICE '   2. Sign up a user at /sign-up';
  RAISE NOTICE '   3. Link user to company via company_users table';
  RAISE NOTICE '   4. Access dashboard at /dashboard/[company-slug]';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- ============================================
-- EXAMPLE: Create First Company
-- ============================================
-- Run this after authentication is set up to create your first company:
/*
INSERT INTO companies (name, slug, industry, company_size, business_type, subscription_tier)
VALUES (
  'Acme Corporation',
  'acme-corp',
  'Technology',
  '11-50',
  'B2B',
  'starter'
)
RETURNING id;

-- Then link your user to the company (replace UUIDs with actual values):
INSERT INTO company_users (company_id, user_id, role)
VALUES (
  '<company_id_from_above>',
  '<your_user_id_from_auth.users>',
  'owner'
);
*/
