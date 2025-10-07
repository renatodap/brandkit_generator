/**
 * Business Service Layer
 *
 * Handles all database operations for businesses with proper RLS enforcement.
 * Each user can have multiple businesses, and each business can have one brand kit.
 * Supports team collaboration - users can access businesses they own or are members of.
 */

import { createClient } from '../supabase/server';
import { logger } from '@/lib/logger';
import type { CreateBusinessInput, UpdateBusinessInput, ListBusinessesQuery } from '../validations/business';
import type { Business } from '@/types';

/**
 * DEPRECATED: Get all business IDs that a user has access to (owned + member)
 * NOTE: With simplified RLS (owner-only), we only return owned businesses
 * RLS policies filter out member businesses automatically
 *
 * This function is currently not used due to simplified RLS policies.
 * Kept for future team collaboration features.
 *
 * @param userId - User's unique identifier
 * @returns Array of business IDs
 * @deprecated Not currently used due to simplified RLS policies
 */
/*
async function getUserAccessibleBusinessIds(userId: string): Promise<string[]> {
  const supabase = await createClient();

  logger.info('Getting accessible business IDs for user', { userId });

  // With V3 RLS policies (owner-only), RLS automatically filters to owned businesses
  // So we just query all businesses - RLS will return only owned ones
  const { data: ownedBusinesses, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    logger.error('Error getting business IDs', error as Error, { userId });
    throw new Error(`Failed to get accessible businesses: ${error.message}`);
  }

  const ownedIds = ownedBusinesses?.map(b => b.id) || [];
  logger.info('Found accessible businesses', { userId, count: ownedIds.length });

  // NOTE: Team member access is currently disabled due to RLS recursion issues
  // TODO: Re-enable team access once we have a better RLS policy structure
  return ownedIds;
}
*/

/**
 * Create a new business for a user
 *
 * @param userId - User's unique identifier from auth.users
 * @param data - Business creation data (name, slug, description, industry)
 * @returns Created business object
 * @throws Error if creation fails or slug already exists for user
 */
export async function createBusiness(userId: string, data: CreateBusinessInput): Promise<Business> {
  logger.info('Creating business for user', { userId, slug: data.slug });

  const supabase = await createClient();

  const insertData = {
    user_id: userId,
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    industry: data.industry || null,
  };

  logger.debug('Business insert data', { insertData });

  const { data: business, error } = await supabase
    .from('businesses')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    logger.error('Database error creating business', error as Error, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      slug: data.slug,
    });

    // Handle unique constraint violation
    if (error.code === '23505') {
      throw new Error('A business with this slug already exists in your account');
    }

    // Handle RLS policy violations
    if (error.code === '42501') {
      throw new Error('Permission denied. Please check your account permissions.');
    }

    throw new Error(`Database error: ${error.message} (code: ${error.code})`);
  }

  logger.info('Business created successfully', { businessId: business.id, userId });
  return business as Business;
}

/**
 * Get all businesses for a user with filtering and pagination
 *
 * @param userId - User's unique identifier
 * @param query - Optional filters (industry, sorting, pagination)
 * @returns Paginated list of businesses with total count
 */
export async function getBusinesses(
  userId: string,
  query: ListBusinessesQuery = { limit: 50, offset: 0, sort: 'created_at', order: 'desc' }
): Promise<{
  businesses: Business[];
  total: number;
  limit: number;
  offset: number;
}> {
  logger.info('Getting businesses for user', { userId, query });

  const supabase = await createClient();

  // With V3 RLS (owner-only), we can query directly - RLS filters to owned businesses
  let queryBuilder = supabase
    .from('businesses')
    .select('*', { count: 'exact' })
    .eq('user_id', userId); // Explicit filter (RLS also applies)

  // Apply filters
  if (query.industry) {
    queryBuilder = queryBuilder.eq('industry', query.industry);
  }

  // Apply sorting
  queryBuilder = queryBuilder.order(query.sort, { ascending: query.order === 'asc' });

  // Apply pagination
  queryBuilder = queryBuilder.range(query.offset, query.offset + query.limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    logger.error('Error fetching businesses', error as Error, { userId });
    throw new Error(`Failed to fetch businesses: ${error.message}`);
  }

  logger.info('Found businesses', { userId, count: data?.length || 0 });

  return {
    businesses: (data as Business[]) || [],
    total: count || 0,
    limit: query.limit,
    offset: query.offset,
  };
}

/**
 * Get a single business by ID
 *
 * @param businessId - Business unique identifier
 * @param userId - User's unique identifier (for ownership verification)
 * @returns Business object or null if not found
 * @throws Error if user doesn't own the business
 */
export async function getBusinessById(businessId: string, userId: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .eq('user_id', userId) // RLS will enforce, but explicit for clarity
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error('Error fetching business', error as Error, { businessId, userId });
    throw new Error(`Failed to fetch business: ${error.message}`);
  }

  return data as Business;
}

/**
 * Get a business by slug (for user)
 *
 * @param slug - Business slug
 * @param userId - User's unique identifier
 * @returns Business object or null if not found
 */
export async function getBusinessBySlug(slug: string, userId: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error('Error fetching business by slug', error as Error, { slug, userId });
    throw new Error(`Failed to fetch business: ${error.message}`);
  }

  return data as Business;
}

/**
 * Update a business
 *
 * @param businessId - Business unique identifier
 * @param userId - User's unique identifier (for ownership verification)
 * @param data - Fields to update (name, slug, description, industry)
 * @returns Updated business object or null if not found
 */
export async function updateBusiness(
  businessId: string,
  userId: string,
  data: UpdateBusinessInput
): Promise<Business | null> {
  const supabase = await createClient();

  // First verify ownership
  const existing = await getBusinessById(businessId, userId);
  if (!existing) {
    return null;
  }

  const updateData: Record<string, string | null> = {};

  if (data.name !== undefined) {
    updateData['name'] = data.name;
  }

  if (data.slug !== undefined) {
    updateData['slug'] = data.slug;
  }

  if (data.description !== undefined) {
    updateData['description'] = data.description || null;
  }

  if (data.industry !== undefined) {
    updateData['industry'] = data.industry || null;
  }

  // Update updated_at timestamp
  updateData['updated_at'] = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', businessId)
    .eq('user_id', userId) // RLS enforces, but explicit
    .select()
    .single();

  if (error) {
    logger.error('Error updating business', error as Error, { businessId, userId, data });

    // Handle unique constraint violation
    if (error.code === '23505') {
      throw new Error('A business with this slug already exists in your account');
    }

    throw new Error(`Failed to update business: ${error.message}`);
  }

  return updated as Business;
}

/**
 * Delete a business (will cascade delete associated brand kit)
 *
 * @param businessId - Business unique identifier
 * @param userId - User's unique identifier (for ownership verification)
 * @returns true if deleted, false if not found
 */
export async function deleteBusiness(businessId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  // First verify ownership
  const existing = await getBusinessById(businessId, userId);
  if (!existing) {
    return false;
  }

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting business', error as Error, { businessId, userId });
    throw new Error(`Failed to delete business: ${error.message}`);
  }

  return true;
}

/**
 * Check if a slug is available for a user
 *
 * @param slug - Slug to check
 * @param userId - User's unique identifier
 * @param excludeBusinessId - Optional business ID to exclude (for updates)
 * @returns true if slug is available, false if taken
 */
export async function isSlugAvailable(
  slug: string,
  userId: string,
  excludeBusinessId?: string
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .eq('user_id', userId);

  if (excludeBusinessId) {
    query = query.neq('id', excludeBusinessId);
  }

  // Use maybeSingle() - returns null if 0 rows, row if 1 row, error if 2+ rows
  const { data, error } = await query.maybeSingle();

  if (error) {
    logger.error('Error checking slug availability', error as Error, { slug, userId, excludeBusinessId });
    throw new Error(`Failed to check slug availability: ${error.message}`);
  }

  // If data is null, slug is available; if data exists, slug is taken
  return !data;
}

/**
 * Get businesses with their associated brand kits (avoids N+1 queries)
 *
 * @param userId - User's unique identifier
 * @param query - Optional filters (industry, sorting, pagination)
 * @returns List of businesses with brand_kit field populated
 */
export async function getBusinessesWithBrandKits(
  userId: string,
  query: ListBusinessesQuery = { limit: 50, offset: 0, sort: 'created_at', order: 'desc' }
): Promise<{
  businesses: Array<Business & { brand_kit: any | null; has_brand_kit: boolean }>;
  total: number;
  limit: number;
  offset: number;
}> {
  logger.info('Getting businesses with brand kits for user', { userId, query });

  const supabase = await createClient();

  // With V3 RLS (owner-only), we can query directly - RLS filters to owned businesses
  let queryBuilder = supabase
    .from('businesses')
    .select(
      `
      *,
      brand_kits (
        id,
        business_name,
        logo_url,
        logo_svg,
        colors,
        fonts,
        tagline,
        industry,
        is_favorite,
        created_at,
        updated_at
      )
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId); // Explicit filter (RLS also applies)

  // Apply filters
  if (query.industry) {
    queryBuilder = queryBuilder.eq('industry', query.industry);
  }

  // Apply sorting
  queryBuilder = queryBuilder.order(query.sort, { ascending: query.order === 'asc' });

  // Apply pagination
  queryBuilder = queryBuilder.range(query.offset, query.offset + query.limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    logger.error('Error fetching businesses with brand kits', error as Error, { userId });
    throw new Error(`Failed to fetch businesses: ${error.message}`);
  }

  logger.info('Found businesses with brand kits', { userId, count: data?.length || 0 });

  // Transform data to flatten brand_kits array (since it's 1:1, we only get first item)
  interface BusinessWithBrandKitsArray extends Business {
    brand_kits?: Array<Record<string, unknown>>;
  }

  const businesses = (data || []).map((business: BusinessWithBrandKitsArray) => {
    const { brand_kits, ...businessData } = business;
    return {
      ...businessData,
      brand_kit: brand_kits?.[0] || null,
      has_brand_kit: !!brand_kits?.[0],
    };
  });

  return {
    businesses,
    total: count || 0,
    limit: query.limit,
    offset: query.offset,
  };
}
