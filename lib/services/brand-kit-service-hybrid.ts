/**
 * Brand Kit Service Layer - Hybrid Personal/Business Account Support
 *
 * Supports:
 * 1. Personal brand kits (no business association)
 * 2. Personal user's business brand kits (owner_user_id + business_id)
 * 3. Team brand kits (business_id with team access)
 */

import { createClient, createAdminClient } from '../supabase/server';
import type { CreateBrandKitInput, UpdateBrandKitInput, ListBrandKitsQuery } from '../validations/brand-kit';

// ============================================
// TYPES
// ============================================

export interface BrandKitContext {
  userId: string;
  businessId?: string; // Optional - if creating for a specific business
  accountType: 'personal' | 'business';
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string | null;
  is_registered: boolean;
  industry: string | null;
  logo_url: string | null;
  onboarding_data: Record<string, any>;
  created_at: string;
}

export interface BrandKit {
  id: string;
  owner_user_id: string;
  business_id: string | null;
  created_by_user_id: string;
  business_name: string;
  business_description: string | null;
  industry: string | null;
  logo_url: string;
  logo_svg: string | null;
  colors: Record<string, any>;
  fonts: Record<string, any>;
  tagline: string | null;
  design_justification: string | null;
  is_favorite: boolean;
  is_published: boolean;
  view_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// BUSINESS OPERATIONS
// ============================================

/**
 * Create a business (personal or registered)
 */
export async function createBusiness(
  userId: string,
  data: {
    name: string;
    slug: string;
    industry?: string;
    isRegistered?: boolean;
    onboardingData?: Record<string, any>;
  }
) {
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from('businesses')
    .insert({
      name: data.name,
      slug: data.slug,
      industry: data.industry || null,
      owner_user_id: data.isRegistered ? null : userId, // Personal = user-owned, Business = team-owned
      is_registered: data.isRegistered || false,
      onboarding_data: data.onboardingData || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating business:', error);
    throw new Error(`Failed to create business: ${error.message}`);
  }

  // If registered business, add creator as owner in business_members
  if (data.isRegistered) {
    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: business.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
      });

    if (memberError) {
      console.error('Error adding business owner:', memberError);
      // Rollback business creation?
      throw new Error(`Failed to add business owner: ${memberError.message}`);
    }
  }

  return business as Business;
}

/**
 * Get all businesses accessible to a user
 * (owned businesses + businesses where user is a member)
 */
export async function getUserBusinesses(userId: string) {
  const supabase = await createClient();

  // Get personal businesses (owned)
  const { data: ownedBusinesses, error: ownedError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (ownedError) {
    console.error('Error fetching owned businesses:', ownedError);
    throw new Error(`Failed to fetch owned businesses: ${ownedError.message}`);
  }

  // Get registered businesses where user is a member
  const { data: memberBusinesses, error: memberError } = await supabase
    .from('business_members')
    .select(`
      business_id,
      role,
      businesses (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (memberError) {
    console.error('Error fetching member businesses:', memberError);
    throw new Error(`Failed to fetch member businesses: ${memberError.message}`);
  }

  // Combine and deduplicate
  const memberBusinessData = (memberBusinesses || [])
    .map((m: any) => ({ ...m.businesses, user_role: m.role }))
    .filter((b: any) => b.deleted_at === null);

  const allBusinesses = [...(ownedBusinesses || []), ...memberBusinessData];

  // Remove duplicates by ID
  const uniqueBusinesses = allBusinesses.reduce((acc, business) => {
    if (!acc.find((b: any) => b.id === business.id)) {
      acc.push(business);
    }
    return acc;
  }, [] as any[]);

  return uniqueBusinesses as Business[];
}

/**
 * Get a specific business by ID (with access check)
 */
export async function getBusinessById(businessId: string, userId: string) {
  const supabase = await createClient();

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching business:', error);
    throw new Error(`Failed to fetch business: ${error.message}`);
  }

  // RLS will handle access control, but we can double-check
  // User has access if they're owner OR a member
  const hasAccess = await userCanAccessBusiness(userId, businessId);
  if (!hasAccess) {
    throw new Error('Forbidden: You do not have access to this business');
  }

  return business as Business;
}

/**
 * Check if user can access a business
 */
export async function userCanAccessBusiness(userId: string, businessId: string): Promise<boolean> {
  const supabase = await createClient();

  // Check if owner of personal business
  const { data: ownedBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (ownedBusiness) return true;

  // Check if member of registered business
  const { data: membership } = await supabase
    .from('business_members')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return !!membership;
}

// ============================================
// BRAND KIT OPERATIONS
// ============================================

/**
 * Create a brand kit
 * Can be:
 * 1. Personal (no businessId)
 * 2. For a personal business (businessId + user is owner)
 * 3. For a registered business (businessId + user is member)
 */
export async function createBrandKit(context: BrandKitContext, data: CreateBrandKitInput) {
  const supabase = await createClient();

  // Validate business access if businessId provided
  if (context.businessId) {
    const hasAccess = await userCanAccessBusiness(context.userId, context.businessId);
    if (!hasAccess) {
      throw new Error('Forbidden: You do not have access to this business');
    }
  }

  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .insert({
      owner_user_id: context.userId,
      business_id: context.businessId || null,
      created_by_user_id: context.userId,
      business_name: data.businessName,
      business_description: data.businessDescription || null,
      industry: data.industry || null,
      logo_url: data.logoUrl,
      logo_svg: data.logoSvg || null,
      colors: data.colors as any,
      fonts: data.fonts as any,
      tagline: data.tagline || null,
      design_justification: data.designJustification || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating brand kit:', error);
    throw new Error(`Failed to create brand kit: ${error.message}`);
  }

  return brandKit as BrandKit;
}

/**
 * Get brand kits for a user
 * Filters:
 * - businessId: Only kits for this business
 * - personal: Only personal kits (no business association)
 * - favoritesOnly: Only favorited kits
 */
export async function getBrandKits(
  userId: string,
  query: ListBrandKitsQuery & {
    businessId?: string;
    personalOnly?: boolean;
  } = { limit: 50, offset: 0, sort: 'created_at', order: 'desc' }
) {
  const supabase = await createClient();

  let queryBuilder = supabase
    .from('brand_kits')
    .select('*', { count: 'exact' })
    .eq('owner_user_id', userId)
    .is('deleted_at', null);

  // Filter by business
  if (query.businessId) {
    queryBuilder = queryBuilder.eq('business_id', query.businessId);
  } else if (query.personalOnly) {
    queryBuilder = queryBuilder.is('business_id', null);
  }

  // Filter favorites
  if (query.favoritesOnly) {
    queryBuilder = queryBuilder.eq('is_favorite', true);
  }

  // Sort and paginate
  queryBuilder = queryBuilder.order(query.sort, { ascending: query.order === 'asc' });
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
 * Get brand kits for a business (all team members' kits)
 */
export async function getBusinessBrandKits(businessId: string, userId: string, query: ListBrandKitsQuery = { limit: 50, offset: 0, sort: 'created_at', order: 'desc' }) {
  const supabase = await createClient();

  // Verify access
  const hasAccess = await userCanAccessBusiness(userId, businessId);
  if (!hasAccess) {
    throw new Error('Forbidden: You do not have access to this business');
  }

  let queryBuilder = supabase
    .from('brand_kits')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .is('deleted_at', null);

  if (query.favoritesOnly) {
    queryBuilder = queryBuilder.eq('is_favorite', true);
  }

  queryBuilder = queryBuilder.order(query.sort, { ascending: query.order === 'asc' });
  queryBuilder = queryBuilder.range(query.offset, query.offset + query.limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Error fetching business brand kits:', error);
    throw new Error(`Failed to fetch business brand kits: ${error.message}`);
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
export async function getBrandKitById(brandKitId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('id', brandKitId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching brand kit:', error);
    throw new Error(`Failed to fetch brand kit: ${error.message}`);
  }

  // Verify access (RLS should handle this, but double-check)
  const isOwner = data.owner_user_id === userId;
  const hasBusinessAccess = data.business_id
    ? await userCanAccessBusiness(userId, data.business_id)
    : false;

  if (!isOwner && !hasBusinessAccess) {
    throw new Error('Forbidden: You do not have access to this brand kit');
  }

  // Increment view count (ignore errors)
  try {
    await supabase.rpc('increment_brand_kit_view_count', { kit_id: brandKitId });
  } catch (error) {
    // Silently ignore view count increment errors
  }

  return data as BrandKit;
}

/**
 * Update a brand kit
 */
export async function updateBrandKit(brandKitId: string, userId: string, data: UpdateBrandKitInput) {
  const supabase = await createClient();

  const existing = await getBrandKitById(brandKitId, userId);
  if (!existing) return null;

  const updateData: Record<string, any> = {};
  if (data.businessName !== undefined) updateData['business_name'] = data.businessName;
  if (data.isFavorite !== undefined) updateData['is_favorite'] = data.isFavorite;

  const { data: updated, error } = await supabase
    .from('brand_kits')
    .update(updateData)
    .eq('id', brandKitId)
    .select()
    .single();

  if (error) {
    console.error('Error updating brand kit:', error);
    throw new Error(`Failed to update brand kit: ${error.message}`);
  }

  return updated as BrandKit;
}

/**
 * Delete a brand kit (soft delete)
 */
export async function deleteBrandKit(brandKitId: string, userId: string) {
  const supabase = await createClient();

  const existing = await getBrandKitById(brandKitId, userId);
  if (!existing) return false;

  const { error } = await supabase
    .from('brand_kits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', brandKitId);

  if (error) {
    console.error('Error deleting brand kit:', error);
    throw new Error(`Failed to delete brand kit: ${error.message}`);
  }

  return true;
}

// ============================================
// SHARE TOKEN OPERATIONS
// ============================================

/**
 * Create a share token for a brand kit
 */
export async function createShareToken(brandKitId: string, userId: string, expiresInDays?: number) {
  const supabase = await createClient();

  const brandKit = await getBrandKitById(brandKitId, userId);
  if (!brandKit) return null;

  const token = generateRandomToken();
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
      created_by_user_id: userId,
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
 * Get brand kit by share token (public access, no auth required)
 */
export async function getBrandKitByShareToken(token: string) {
  const supabase = createAdminClient(); // Use admin to bypass RLS

  const { data: shareToken, error: tokenError } = await supabase
    .from('share_tokens')
    .select('brand_kit_id, expires_at, max_views, view_count')
    .eq('token', token)
    .single();

  if (tokenError || !shareToken) return null;

  // Check expiration
  if (shareToken.expires_at && new Date(shareToken.expires_at) < new Date()) {
    return null;
  }

  // Check max views
  if (shareToken.max_views && shareToken.view_count >= shareToken.max_views) {
    return null;
  }

  // Get brand kit
  const { data: brandKit, error: kitError } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('id', shareToken.brand_kit_id)
    .is('deleted_at', null)
    .single();

  if (kitError || !brandKit) return null;

  // Track access (ignore errors)
  try {
    await supabase.rpc('track_share_token_access', { token_value: token });
  } catch (error) {
    // Silently ignore tracking errors
  }

  return brandKit as BrandKit;
}

// ============================================
// UTILITIES
// ============================================

function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
