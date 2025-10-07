/**
 * Business Collection Service
 *
 * Manages linking recall-notebook collections to persimmon businesses
 * and handles knowledge caching.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  BusinessCollection,
  RecallCollection,
  KnowledgeSearchResult,
} from '@/types';
import { getRecallServiceForUser } from './recall-api-key-service';

const CACHE_HOURS = 6; // Cache knowledge for 6 hours

/**
 * Link a recall-notebook collection to a business
 */
export async function linkCollectionToBusiness(
  businessId: string,
  collectionId: string,
  userId: string
): Promise<BusinessCollection> {
  const supabase = await createClient();

  // Get recall service for user
  const recallService = await getRecallServiceForUser(userId);

  if (!recallService) {
    throw new Error('No recall-notebook API key found. Please connect your recall-notebook account first.');
  }

  // Fetch collection details from recall-notebook
  let collection: RecallCollection;
  try {
    collection = await recallService.getCollection(collectionId);
  } catch (error) {
    console.error('Failed to fetch collection from recall-notebook:', error);
    throw new Error('Failed to fetch collection. Please check your API key and collection ID.');
  }

  // Check if link already exists
  const { data: existing } = await supabase
    .from('business_collections')
    .select('*')
    .eq('business_id', businessId)
    .eq('collection_id', collectionId)
    .single();

  if (existing) {
    // Reactivate if inactive
    if (!existing.is_active) {
      const { data, error } = await supabase
        .from('business_collections')
        .update({
          is_active: true,
          collection_name: collection.name,
          collection_description: collection.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to reactivate collection link:', error);
        throw new Error('Failed to link collection');
      }

      return data;
    }

    return existing;
  }

  // Create new link
  const { data, error } = await supabase
    .from('business_collections')
    .insert({
      business_id: businessId,
      collection_id: collectionId,
      collection_name: collection.name,
      collection_description: collection.description,
      added_by: userId,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to link collection:', error);
    throw new Error('Failed to link collection');
  }

  // Initialize cache for this collection
  await refreshCollectionCache(data.id, userId);

  return data;
}

/**
 * Get all collections linked to a business
 */
export async function getBusinessCollections(
  businessId: string
): Promise<BusinessCollection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('business_collections')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch business collections:', error);
    throw new Error('Failed to fetch collections');
  }

  return data || [];
}

/**
 * Unlink a collection from a business
 */
export async function unlinkCollectionFromBusiness(
  businessCollectionId: string
): Promise<void> {
  const supabase = await createClient();

  // Soft delete (set is_active to false)
  const { error } = await supabase
    .from('business_collections')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', businessCollectionId);

  if (error) {
    console.error('Failed to unlink collection:', error);
    throw new Error('Failed to unlink collection');
  }

  // Delete cache
  await supabase
    .from('business_knowledge_cache')
    .delete()
    .eq('business_collection_id', businessCollectionId);
}

/**
 * Refresh knowledge cache for a collection
 */
export async function refreshCollectionCache(
  businessCollectionId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // Get collection details
  const { data: businessCollection, error: fetchError } = await supabase
    .from('business_collections')
    .select('*')
    .eq('id', businessCollectionId)
    .single();

  if (fetchError || !businessCollection) {
    throw new Error('Collection not found');
  }

  // Get recall service
  const recallService = await getRecallServiceForUser(userId);

  if (!recallService) {
    throw new Error('No recall-notebook API key found');
  }

  // Fetch all sources from recall-notebook
  let sources;
  try {
    sources = await recallService.getCollectionSources(businessCollection.collection_id);
  } catch (error) {
    console.error('Failed to fetch sources for caching:', error);
    throw new Error('Failed to refresh cache');
  }

  // Format sources for cache
  const cachedData = {
    sources: sources.map((source) => ({
      id: source.id,
      title: source.title,
      content: source.original_content.substring(0, 2000), // Limit content size
      summary: source.summary,
      tags: source.tags || [],
    })),
  };

  const cacheExpiresAt = new Date();
  cacheExpiresAt.setHours(cacheExpiresAt.getHours() + CACHE_HOURS);

  // Check if cache exists
  const { data: existingCache } = await supabase
    .from('business_knowledge_cache')
    .select('id')
    .eq('business_collection_id', businessCollectionId)
    .single();

  if (existingCache) {
    // Update existing cache
    const { error: updateError } = await supabase
      .from('business_knowledge_cache')
      .update({
        cached_data: cachedData,
        source_count: sources.length,
        total_chunks: sources.length,
        last_synced_at: new Date().toISOString(),
        cache_expires_at: cacheExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCache.id);

    if (updateError) {
      console.error('Failed to update cache:', updateError);
      throw new Error('Failed to update cache');
    }
  } else {
    // Insert new cache
    const { error: insertError } = await supabase
      .from('business_knowledge_cache')
      .insert({
        business_collection_id: businessCollectionId,
        cached_data: cachedData,
        source_count: sources.length,
        total_chunks: sources.length,
        last_synced_at: new Date().toISOString(),
        cache_expires_at: cacheExpiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to insert cache:', insertError);
      throw new Error('Failed to create cache');
    }
  }
}

/**
 * Get cached knowledge for a business (all collections combined)
 */
export async function getCachedKnowledge(
  businessId: string
): Promise<KnowledgeSearchResult> {
  const supabase = await createClient();

  // Get all active collections for business
  const { data: collections, error: collectionsError } = await supabase
    .from('business_collections')
    .select('id')
    .eq('business_id', businessId)
    .eq('is_active', true);

  if (collectionsError || !collections || collections.length === 0) {
    return {
      sources: [],
      total_count: 0,
      from_cache: true,
    };
  }

  const collectionIds = collections.map((c) => c.id);

  // Get all caches that are not expired
  const { data: caches, error: cachesError } = await supabase
    .from('business_knowledge_cache')
    .select('*')
    .in('business_collection_id', collectionIds)
    .gt('cache_expires_at', new Date().toISOString());

  if (cachesError || !caches || caches.length === 0) {
    return {
      sources: [],
      total_count: 0,
      from_cache: true,
    };
  }

  // Combine all sources from all caches
  const allSources = caches.flatMap((cache) => {
    const data = cache.cached_data as { sources: any[] };
    return data.sources.map((source) => ({
      id: source.id,
      title: source.title,
      content: source.content,
      relevance_score: 1.0,
      tags: source.tags || [],
    }));
  });

  return {
    sources: allSources,
    total_count: allSources.length,
    from_cache: true,
  };
}

/**
 * Check if cache needs refresh (expired or missing)
 */
export async function needsCacheRefresh(businessCollectionId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('business_knowledge_cache')
    .select('cache_expires_at')
    .eq('business_collection_id', businessCollectionId)
    .single();

  if (error || !data) {
    return true; // No cache, needs refresh
  }

  const expiresAt = new Date(data.cache_expires_at);
  const now = new Date();

  return now > expiresAt; // Expired, needs refresh
}

/**
 * Build knowledge context for brand generation
 */
export async function buildKnowledgeContext(
  businessId: string,
  userId: string,
  forceRefresh: boolean = false
): Promise<string> {
  const supabase = await createClient();

  // Get all collections for business
  const collections = await getBusinessCollections(businessId);

  if (collections.length === 0) {
    return ''; // No collections linked
  }

  let allContext = '# Company Knowledge Base\n\n';

  for (const collection of collections) {
    // Check if cache needs refresh
    if (forceRefresh || (await needsCacheRefresh(collection.id))) {
      try {
        await refreshCollectionCache(collection.id, userId);
      } catch (error) {
        console.error(`Failed to refresh cache for collection ${collection.id}:`, error);
        // Continue with other collections
        continue;
      }
    }

    // Get cached data
    const { data: cache } = await supabase
      .from('business_knowledge_cache')
      .select('cached_data')
      .eq('business_collection_id', collection.id)
      .single();

    if (cache) {
      const data = cache.cached_data as { sources: any[] };
      allContext += `\n## Collection: ${collection.collection_name}\n\n`;

      data.sources.forEach((source, index) => {
        allContext += `### Source ${index + 1}: ${source.title}\n`;
        if (source.summary) {
          allContext += `Summary: ${source.summary}\n`;
        } else {
          allContext += `${source.content.substring(0, 300)}...\n`;
        }
        if (source.tags && source.tags.length > 0) {
          allContext += `Tags: ${source.tags.join(', ')}\n`;
        }
        allContext += `\n`;
      });
    }
  }

  return allContext;
}
