/**
 * Brand Kit Service Layer
 *
 * Handles all database operations for brand kits
 * with proper error handling and type safety.
 */

import { createClient, createAdminClient } from '../supabase/server';
import { logger } from '@/lib/logger';
import type { CreateBrandKitInput, UpdateBrandKitInput, ListBrandKitsQuery } from '../validations/brand-kit';

/**
 * Create a new brand kit for a business
 *
 * Note: The business must belong to the authenticated user (enforced by RLS policies)
 */
export async function createBrandKit(userId: string, data: CreateBrandKitInput) {
  const supabase = await createClient();

  // Verify that the business belongs to the user
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, user_id')
    .eq('id', data.businessId)
    .eq('user_id', userId)
    .single();

  if (businessError || !business) {
    throw new Error('Business not found or you do not have permission to create a brand kit for this business');
  }

  // Check if business already has a brand kit
  const { data: existingKit } = await supabase
    .from('brand_kits')
    .select('id')
    .eq('business_id', data.businessId)
    .single();

  if (existingKit) {
    throw new Error('This business already has a brand kit. Each business can only have one brand kit.');
  }

  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .insert({
      business_id: data.businessId,
      user_id: userId, // Still track user_id for compatibility
      business_name: data.businessName,
      business_description: data.businessDescription || null,
      industry: data.industry || null,
      logo_url: data.logoUrl,
      logo_svg: data.logoSvg || null,
      colors: JSON.parse(JSON.stringify(data.colors)), // JSONB type - properly serialize
      fonts: JSON.parse(JSON.stringify(data.fonts)), // JSONB type - properly serialize
      tagline: data.tagline || null,
      design_justification: data.designJustification || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating brand kit', error as Error, { userId, businessId: data.businessId });
    throw new Error(`Failed to create brand kit: ${error.message}`);
  }

  return brandKit;
}

/**
 * Get all brand kits for a user with filtering and pagination
 */
export async function getBrandKits(userId: string, query: ListBrandKitsQuery = { limit: 50, offset: 0, sort: 'created_at', order: 'desc' }) {
  const supabase = await createClient();

  let queryBuilder = supabase
    .from('brand_kits')
    .select('id, business_name, industry, logo_url, is_favorite, created_at, updated_at', { count: 'exact' })
    .eq('user_id', userId);

  // Apply filters
  if (query.favoritesOnly) {
    queryBuilder = queryBuilder.eq('is_favorite', true);
  }

  // Apply sorting
  queryBuilder = queryBuilder.order(query.sort, { ascending: query.order === 'asc' });

  // Apply pagination
  queryBuilder = queryBuilder.range(query.offset, query.offset + query.limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    logger.error('Error fetching brand kits', error as Error, { userId });
    throw new Error(`Failed to fetch brand kits: ${error.message}`);
  }

  return {
    brandKits: data || [],
    total: count || 0,
    limit: query.limit,
    offset: query.offset,
  };
}

/**
 * Get brand kit by business ID
 */
export async function getBrandKitByBusinessId(businessId: string, userId: string) {
  const supabase = await createClient();

  // Verify business ownership first
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', userId)
    .single();

  if (businessError || !business) {
    return null;
  }

  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('business_id', businessId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error('Error fetching brand kit by business ID', error as Error, { businessId, userId });
    throw new Error(`Failed to fetch brand kit: ${error.message}`);
  }

  return data;
}

/**
 * Get a single brand kit by ID
 */
export async function getBrandKitById(brandKitId: string, userId: string | null = null) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('id', brandKitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error('Error fetching brand kit', error as Error, { brandKitId, userId });
    throw new Error(`Failed to fetch brand kit: ${error.message}`);
  }

  // Check ownership if userId provided
  if (userId && data.user_id !== userId) {
    throw new Error('You do not have permission to access this brand kit');
  }

  // Increment view count (ignore errors)
  try {
    await supabase.rpc('increment_brand_kit_view_count', { kit_id: brandKitId });
  } catch {
    // Ignore error
  }

  return data;
}

/**
 * Update a brand kit (e.g., favorite status, business name)
 */
export async function updateBrandKit(brandKitId: string, userId: string, data: UpdateBrandKitInput) {
  const supabase = await createClient();

  // First check ownership
  const existing = await getBrandKitById(brandKitId, userId);
  if (!existing) {
    return null;
  }

  const updateData: Record<string, string | boolean> = {};

  if (data.businessName !== undefined) {
    updateData['business_name'] = data.businessName;
  }

  if (data.isFavorite !== undefined) {
    updateData['is_favorite'] = data.isFavorite;
  }

  const { data: updated, error } = await supabase
    .from('brand_kits')
    .update(updateData)
    .eq('id', brandKitId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating brand kit', error as Error, { brandKitId, userId, data });
    throw new Error(`Failed to update brand kit: ${error.message}`);
  }

  return updated;
}

/**
 * Delete a brand kit
 */
export async function deleteBrandKit(brandKitId: string, userId: string) {
  const supabase = await createClient();

  // First check ownership
  const existing = await getBrandKitById(brandKitId, userId);
  if (!existing) {
    return false;
  }

  const { error } = await supabase
    .from('brand_kits')
    .delete()
    .eq('id', brandKitId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting brand kit', error as Error, { brandKitId, userId });
    throw new Error(`Failed to delete brand kit: ${error.message}`);
  }

  return true;
}

/**
 * Create a share token for a brand kit
 */
export async function createShareToken(brandKitId: string, userId: string, expiresInDays?: number) {
  const supabase = await createClient();

  // First check ownership
  const brandKit = await getBrandKitById(brandKitId, userId);
  if (!brandKit) {
    return null;
  }

  // Generate random token
  const token = generateRandomToken();

  // Calculate expiration date
  let expiresAt: string | null = null;
  if (expiresInDays) {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + expiresInDays);
    expiresAt = expiration.toISOString();
  }

  const { data, error } = await supabase
    .from('share_tokens')
    .insert({
      brand_kit_id: brandKitId,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating share token', error as Error, { brandKitId, userId });
    throw new Error(`Failed to create share token: ${error.message}`);
  }

  return data;
}

/**
 * Get brand kit by share token (public access)
 */
export async function getBrandKitByShareToken(token: string) {
  const supabase = createAdminClient(); // Use admin client for public access

  // First get the share token
  const { data: shareToken, error: tokenError } = await supabase
    .from('share_tokens')
    .select('brand_kit_id, expires_at')
    .eq('token', token)
    .single();

  if (tokenError || !shareToken) {
    return null; // Invalid or expired token
  }

  // Check if token is expired
  if (shareToken.expires_at) {
    const expirationDate = new Date(shareToken.expires_at);
    if (expirationDate < new Date()) {
      return null; // Expired
    }
  }

  // Get the brand kit
  const { data: brandKit, error: kitError } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('id', shareToken.brand_kit_id)
    .single();

  if (kitError || !brandKit) {
    return null;
  }

  // Increment share token view count
  try {
    await supabase
      .from('share_tokens')
      .update({ view_count: supabase.rpc('increment') })
      .eq('token', token);
  } catch {
    // Ignore error
  }

  return brandKit;
}

/**
 * Generate a random secure token
 */
function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * DEPRECATED: This function is not needed with Supabase Auth
 * Supabase automatically manages users in auth.users table
 *
 * Note: Previously referenced Clerk auth system, but this project uses Supabase Auth
 * @deprecated Use Supabase Auth built-in user management instead
 */
export async function syncUserToDatabase(
  userId: string,
  email: string,
  _metadata?: Record<string, unknown>
): Promise<{ id: string; email: string }> {
  logger.warn('DEPRECATED: syncUserToDatabase called - this is not needed with Supabase Auth');

  // With Supabase Auth, users are automatically created in auth.users
  // This function is kept for backward compatibility but does nothing
  return {
    id: userId,
    email,
  };
}
