-- Recall Notebook Integration Schema
-- This migration adds tables for integrating with recall-notebook

-- Table to store user's recall-notebook API keys
CREATE TABLE IF NOT EXISTS public.recall_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL, -- Encrypted API key
  recall_user_id UUID, -- User ID from recall-notebook for validation
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- One API key per user
);

-- Table to link recall-notebook collections to persimmon businesses
CREATE TABLE IF NOT EXISTS public.business_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL, -- ID from recall-notebook
  collection_name TEXT NOT NULL, -- Cached name for display
  collection_description TEXT, -- Cached description
  added_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, collection_id) -- One collection per business
);

-- Table to cache knowledge from recall-notebook
CREATE TABLE IF NOT EXISTS public.business_knowledge_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_collection_id UUID NOT NULL REFERENCES public.business_collections(id) ON DELETE CASCADE,
  cached_data JSONB NOT NULL, -- Array of source summaries/chunks
  source_count INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  cache_expires_at TIMESTAMPTZ NOT NULL, -- Cache for 6 hours by default
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_collection_id)
);

-- RLS Policies for recall_api_keys
ALTER TABLE public.recall_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON public.recall_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON public.recall_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON public.recall_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON public.recall_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for business_collections
ALTER TABLE public.business_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can view collections"
  ON public.business_collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = business_collections.business_id
      AND business_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_collections.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Business admins/editors can insert collections"
  ON public.business_collections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = business_collections.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role IN ('admin', 'editor')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_collections.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Business admins/editors can update collections"
  ON public.business_collections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = business_collections.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role IN ('admin', 'editor')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_collections.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Business admins/editors can delete collections"
  ON public.business_collections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_members.business_id = business_collections.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role IN ('admin', 'editor')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_collections.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- RLS Policies for business_knowledge_cache
ALTER TABLE public.business_knowledge_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business members can view cached knowledge"
  ON public.business_knowledge_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_collections bc
      INNER JOIN public.business_members bm ON bm.business_id = bc.business_id
      WHERE bc.id = business_knowledge_cache.business_collection_id
      AND bm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.business_collections bc
      INNER JOIN public.businesses b ON b.id = bc.business_id
      WHERE bc.id = business_knowledge_cache.business_collection_id
      AND b.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_recall_api_keys_user_id ON public.recall_api_keys(user_id);
CREATE INDEX idx_business_collections_business_id ON public.business_collections(business_id);
CREATE INDEX idx_business_collections_collection_id ON public.business_collections(collection_id);
CREATE INDEX idx_business_knowledge_cache_business_collection_id ON public.business_knowledge_cache(business_collection_id);
CREATE INDEX idx_business_knowledge_cache_expires_at ON public.business_knowledge_cache(cache_expires_at);

-- Comments for documentation
COMMENT ON TABLE public.recall_api_keys IS 'Stores encrypted API keys for recall-notebook integration';
COMMENT ON TABLE public.business_collections IS 'Links recall-notebook collections to persimmon businesses';
COMMENT ON TABLE public.business_knowledge_cache IS 'Caches knowledge data from recall-notebook (6 hour TTL)';
