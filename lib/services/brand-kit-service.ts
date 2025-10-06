/**
 * Brand Kit Service Layer
 *
 * Handles all database operations for brand kits
 * with proper error handling and type safety.
 */

import { createClient, createAdminClient } from '../supabase/server';
import type { CreateBrandKitInput, UpdateBrandKitInput, ListBrandKitsQuery } from '../validations/brand-kit';

/**
 * Create a new brand kit for a user
 */
export async function createBrandKit(userId: string, data: CreateBrandKitInput) {
  const supabase = await createClient();

  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .insert({
      user_id: userId,
      business_name: data.businessName,
      business_description: data.businessDescription || null,
      industry: data.industry || null,
      logo_url: data.logoUrl,
      logo_svg: data.logoSvg || null,
      colors: data.colors as any, // JSONB type
      fonts: data.fonts as any, // JSONB type
      tagline: data.tagline || null,
      design_justification: data.designJustification || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating brand kit:', error);
    throw new Error(`Failed to create brand kit: ${error.message}`);
  }

  // Note: User tracking removed - using Supabase auth.users instead

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
    console.error('Error fetching brand kits:', error);
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
    console.error('Error fetching brand kit:', error);
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

  const updateData: Record<string, any> = {};

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
    console.error('Error updating brand kit:', error);
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
    console.error('Error deleting brand kit:', error);
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
    console.error('Error creating share token:', error);
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
 * Sync or create user in database (called after Clerk signup)
 */
export async function syncUserToDatabase(clerkUserId: string, email: string, firstName?: string, lastName?: string, profileImageUrl?: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .upsert({
      clerk_user_id: clerkUserId,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      profile_image_url: profileImageUrl || null,
      last_login_at: new Date().toISOString(),
    }, {
      onConflict: 'clerk_user_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error syncing user to database:', error);
    throw new Error(`Failed to sync user: ${error.message}`);
  }

  return data;
}
