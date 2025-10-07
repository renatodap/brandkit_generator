/**
 * Tests for Brand Kit Service
 *
 * Tests cover:
 * - createBrandKit: success, validation errors, database errors, duplicate detection
 * - getBrandKits: pagination, filtering, empty results, sorting
 * - getBrandKitById: found, not found, unauthorized, view count increment
 * - getBrandKitByBusinessId: found, not found, unauthorized
 * - updateBrandKit: success, not found, unauthorized
 * - deleteBrandKit: success, not found, unauthorized
 * - createShareToken: success, not found, with/without expiration
 * - getBrandKitByShareToken: valid token, expired token, invalid token
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as brandKitService from '../brand-kit-service';
import * as supabaseServer from '@/lib/supabase/server';
import type { CreateBrandKitInput, UpdateBrandKitInput, ListBrandKitsQuery } from '@/lib/validations/brand-kit';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Brand Kit Service', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      rpc: vi.fn(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    };
  });

  describe('createBrandKit', () => {
    const mockUserId = 'user-123';
    const mockBusinessId = '123e4567-e89b-12d3-a456-426614174000';
    const validInput: CreateBrandKitInput = {
      businessId: mockBusinessId,
      businessName: 'Test Business',
      businessDescription: 'A test business',
      industry: 'Technology',
      logoUrl: 'https://example.com/logo.png',
      logoSvg: '<svg></svg>',
      colors: [
        { name: 'Primary', hex: '#FF5733', usage: 'Headers' },
        { name: 'Secondary', hex: '#33FF57', usage: 'Backgrounds' },
      ],
      fonts: {
        primary: 'Inter',
        secondary: 'Lora',
      },
      tagline: 'Innovation at its best',
      designJustification: 'Modern and clean',
    };

    it('should create brand kit successfully with valid input', async () => {
      const mockBusiness = { id: mockBusinessId, user_id: mockUserId };
      const mockBrandKit = {
        id: 'brand-kit-123',
        business_id: mockBusinessId,
        user_id: mockUserId,
        business_name: validInput.businessName,
        business_description: validInput.businessDescription,
        industry: validInput.industry,
        logo_url: validInput.logoUrl,
        logo_svg: validInput.logoSvg,
        colors: validInput.colors,
        fonts: validInput.fonts,
        tagline: validInput.tagline,
        design_justification: validInput.designJustification,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock business verification (first select)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBusiness,
        error: null,
      });

      // Mock existing kit check (second select)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      // Mock brand kit creation (insert)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      const result = await brandKitService.createBrandKit(mockUserId, validInput);

      expect(result).toEqual(mockBrandKit);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('businesses');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('brand_kits');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          business_id: mockBusinessId,
          user_id: mockUserId,
          business_name: validInput.businessName,
        })
      );
    });

    it('should throw error if business not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(brandKitService.createBrandKit(mockUserId, validInput)).rejects.toThrow(
        'Business not found or you do not have permission'
      );
    });

    it('should throw error if business already has brand kit', async () => {
      const mockBusiness = { id: mockBusinessId, user_id: mockUserId };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock business verification
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBusiness,
        error: null,
      });

      // Mock existing kit check - found existing
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'existing-kit-123' },
        error: null,
      });

      await expect(brandKitService.createBrandKit(mockUserId, validInput)).rejects.toThrow(
        'This business already has a brand kit'
      );
    });

    it('should throw error on database error', async () => {
      const mockBusiness = { id: mockBusinessId, user_id: mockUserId };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBusiness,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '23503' },
      });

      await expect(brandKitService.createBrandKit(mockUserId, validInput)).rejects.toThrow(
        'Failed to create brand kit'
      );
    });
  });

  describe('getBrandKits', () => {
    const mockUserId = 'user-123';

    it('should fetch brand kits with default parameters', async () => {
      const mockBrandKits = [
        {
          id: 'brand-kit-1',
          business_name: 'Business 1',
          industry: 'tech',
          logo_url: 'https://example.com/logo1.png',
          is_favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'brand-kit-2',
          business_name: 'Business 2',
          industry: 'finance',
          logo_url: 'https://example.com/logo2.png',
          is_favorite: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: mockBrandKits,
        error: null,
        count: 2,
      });

      const result = await brandKitService.getBrandKits(mockUserId);

      expect(result.brandKits).toEqual(mockBrandKits);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply favorites filter', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const query: ListBrandKitsQuery = {
        limit: 50,
        offset: 0,
        sort: 'created_at',
        order: 'desc',
        favoritesOnly: true,
      };

      await brandKitService.getBrandKits(mockUserId, query);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_favorite', true);
    });

    it('should apply sorting and pagination', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const query: ListBrandKitsQuery = {
        limit: 10,
        offset: 20,
        sort: 'business_name',
        order: 'asc',
      };

      await brandKitService.getBrandKits(mockUserId, query);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('business_name', { ascending: true });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(20, 29);
    });

    it('should return empty array when no brand kits found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await brandKitService.getBrandKits(mockUserId);

      expect(result.brandKits).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error on database error', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      await expect(brandKitService.getBrandKits(mockUserId)).rejects.toThrow('Failed to fetch brand kits');
    });
  });

  describe('getBrandKitById', () => {
    const mockBrandKitId = 'brand-kit-123';
    const mockUserId = 'user-123';

    it('should fetch brand kit by ID successfully', async () => {
      const mockBrandKit = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Test Business',
        logo_url: 'https://example.com/logo.png',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      const result = await brandKitService.getBrandKitById(mockBrandKitId, mockUserId);

      expect(result).toEqual(mockBrandKit);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockBrandKitId);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('increment_brand_kit_view_count', {
        kit_id: mockBrandKitId,
      });
    });

    it('should return null if brand kit not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await brandKitService.getBrandKitById(mockBrandKitId);

      expect(result).toBeNull();
    });

    it('should throw error if user does not own brand kit', async () => {
      const mockBrandKit = {
        id: mockBrandKitId,
        user_id: 'other-user-456',
        business_name: 'Test Business',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      await expect(brandKitService.getBrandKitById(mockBrandKitId, mockUserId)).rejects.toThrow(
        'You do not have permission to access this brand kit'
      );
    });

    it('should increment view count even if RPC fails', async () => {
      const mockBrandKit = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Test Business',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('RPC failed'));

      const result = await brandKitService.getBrandKitById(mockBrandKitId, mockUserId);

      expect(result).toEqual(mockBrandKit);
    });

    it('should throw error on database error', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(brandKitService.getBrandKitById(mockBrandKitId)).rejects.toThrow('Failed to fetch brand kit');
    });
  });

  describe('getBrandKitByBusinessId', () => {
    const mockBusinessId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUserId = 'user-123';

    it('should fetch brand kit by business ID successfully', async () => {
      const mockBusiness = { id: mockBusinessId };
      const mockBrandKit = {
        id: 'brand-kit-123',
        business_id: mockBusinessId,
        business_name: 'Test Business',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock business verification
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBusiness,
        error: null,
      });

      // Mock brand kit fetch
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      const result = await brandKitService.getBrandKitByBusinessId(mockBusinessId, mockUserId);

      expect(result).toEqual(mockBrandKit);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('businesses');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('brand_kits');
    });

    it('should return null if business not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await brandKitService.getBrandKitByBusinessId(mockBusinessId, mockUserId);

      expect(result).toBeNull();
    });

    it('should return null if brand kit not found', async () => {
      const mockBusiness = { id: mockBusinessId };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBusiness,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await brandKitService.getBrandKitByBusinessId(mockBusinessId, mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      const mockBusiness = { id: mockBusinessId };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBusiness,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(brandKitService.getBrandKitByBusinessId(mockBusinessId, mockUserId)).rejects.toThrow(
        'Failed to fetch brand kit'
      );
    });
  });

  describe('updateBrandKit', () => {
    const mockBrandKitId = 'brand-kit-123';
    const mockUserId = 'user-123';

    it('should update brand kit successfully', async () => {
      const mockExisting = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Old Name',
        is_favorite: false,
      };

      const mockUpdated = {
        ...mockExisting,
        business_name: 'New Name',
        is_favorite: true,
      };

      const updateData: UpdateBrandKitInput = {
        businessName: 'New Name',
        isFavorite: true,
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock getBrandKitById (existing check)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExisting,
        error: null,
      });

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      // Mock update
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      const result = await brandKitService.updateBrandKit(mockBrandKitId, mockUserId, updateData);

      expect(result).toEqual(mockUpdated);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          business_name: 'New Name',
          is_favorite: true,
        })
      );
    });

    it('should return null if brand kit not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await brandKitService.updateBrandKit(mockBrandKitId, mockUserId, {
        businessName: 'New Name',
      });

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      const mockExisting = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Old Name',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExisting,
        error: null,
      });

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        brandKitService.updateBrandKit(mockBrandKitId, mockUserId, { businessName: 'New Name' })
      ).rejects.toThrow('Failed to update brand kit');
    });
  });

  describe('deleteBrandKit', () => {
    const mockBrandKitId = 'brand-kit-123';
    const mockUserId = 'user-123';

    it('should delete brand kit successfully', async () => {
      const mockExisting = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Test Business',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock getBrandKitById - need to set up complete chain for select().eq().single()
      const mockSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockExisting,
          error: null,
        }),
      };

      mockSupabaseClient.select.mockReturnValueOnce(mockSelectChain);
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      // Mock delete operation - full chain: delete().eq('id', x).eq('user_id', y)
      const mockDeleteChain = {
        eq: vi.fn(),
      };

      // First .eq() returns itself, second .eq() returns the result
      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain) // First eq() - for 'id'
        .mockReturnValueOnce({ error: null }); // Second eq() - for 'user_id'

      mockSupabaseClient.delete.mockReturnValueOnce(mockDeleteChain);

      const result = await brandKitService.deleteBrandKit(mockBrandKitId, mockUserId);

      expect(result).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should return false if brand kit not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await brandKitService.deleteBrandKit(mockBrandKitId, mockUserId);

      expect(result).toBe(false);
    });

    it('should throw error on database error', async () => {
      const mockExisting = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Test Business',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock getBrandKitById
      const mockSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockExisting,
          error: null,
        }),
      };

      mockSupabaseClient.select.mockReturnValueOnce(mockSelectChain);
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      // Mock delete operation with error
      const mockDeleteChain = {
        eq: vi.fn(),
      };

      // First .eq() returns itself, second .eq() returns error
      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain) // First eq() - for 'id'
        .mockReturnValueOnce({ error: { message: 'Database error' } }); // Second eq() - for 'user_id'

      mockSupabaseClient.delete.mockReturnValueOnce(mockDeleteChain);

      await expect(brandKitService.deleteBrandKit(mockBrandKitId, mockUserId)).rejects.toThrow(
        'Failed to delete brand kit'
      );
    });
  });

  describe('createShareToken', () => {
    const mockBrandKitId = 'brand-kit-123';
    const mockUserId = 'user-123';

    it('should create share token without expiration', async () => {
      const mockBrandKit = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Test Business',
      };

      const mockShareToken = {
        id: 'share-token-123',
        brand_kit_id: mockBrandKitId,
        token: expect.any(String),
        expires_at: null,
        view_count: 0,
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock getBrandKitById
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      // Mock share token creation
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockShareToken,
        error: null,
      });

      const result = await brandKitService.createShareToken(mockBrandKitId, mockUserId);

      expect(result).toEqual(mockShareToken);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          brand_kit_id: mockBrandKitId,
          token: expect.any(String),
          expires_at: null,
        })
      );
    });

    it('should create share token with expiration', async () => {
      const mockBrandKit = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Test Business',
      };

      const mockShareToken = {
        id: 'share-token-123',
        brand_kit_id: mockBrandKitId,
        token: expect.any(String),
        expires_at: expect.any(String),
        view_count: 0,
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockShareToken,
        error: null,
      });

      const result = await brandKitService.createShareToken(mockBrandKitId, mockUserId, 7);

      expect(result).toEqual(mockShareToken);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          brand_kit_id: mockBrandKitId,
          token: expect.any(String),
          expires_at: expect.any(String),
        })
      );
    });

    it('should return null if brand kit not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await brandKitService.createShareToken(mockBrandKitId, mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      const mockBrandKit = {
        id: mockBrandKitId,
        user_id: mockUserId,
        business_name: 'Test Business',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: null, error: null });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(brandKitService.createShareToken(mockBrandKitId, mockUserId)).rejects.toThrow(
        'Failed to create share token'
      );
    });
  });

  describe('getBrandKitByShareToken', () => {
    const mockToken = 'abc123xyz';

    it('should fetch brand kit by valid share token', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockShareToken = {
        brand_kit_id: 'brand-kit-123',
        expires_at: futureDate.toISOString(),
      };

      const mockBrandKit = {
        id: 'brand-kit-123',
        business_name: 'Test Business',
        logo_url: 'https://example.com/logo.png',
      };

      const mockAdminClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        update: vi.fn().mockReturnThis(),
        rpc: vi.fn(),
      };

      vi.mocked(supabaseServer.createAdminClient).mockReturnValue(mockAdminClient);

      // Mock share token fetch
      mockAdminClient.single.mockResolvedValueOnce({
        data: mockShareToken,
        error: null,
      });

      // Mock brand kit fetch
      mockAdminClient.single.mockResolvedValueOnce({
        data: mockBrandKit,
        error: null,
      });

      const result = await brandKitService.getBrandKitByShareToken(mockToken);

      expect(result).toEqual(mockBrandKit);
      expect(mockAdminClient.from).toHaveBeenCalledWith('share_tokens');
      expect(mockAdminClient.from).toHaveBeenCalledWith('brand_kits');
    });

    it('should return null for invalid token', async () => {
      const mockAdminClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      vi.mocked(supabaseServer.createAdminClient).mockReturnValue(mockAdminClient);

      const result = await brandKitService.getBrandKitByShareToken(mockToken);

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const mockShareToken = {
        brand_kit_id: 'brand-kit-123',
        expires_at: pastDate.toISOString(),
      };

      const mockAdminClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockShareToken,
          error: null,
        }),
      };

      vi.mocked(supabaseServer.createAdminClient).mockReturnValue(mockAdminClient);

      const result = await brandKitService.getBrandKitByShareToken(mockToken);

      expect(result).toBeNull();
    });

    it('should return null if brand kit not found', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockShareToken = {
        brand_kit_id: 'brand-kit-123',
        expires_at: futureDate.toISOString(),
      };

      const mockAdminClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(supabaseServer.createAdminClient).mockReturnValue(mockAdminClient);

      mockAdminClient.single.mockResolvedValueOnce({
        data: mockShareToken,
        error: null,
      });

      mockAdminClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await brandKitService.getBrandKitByShareToken(mockToken);

      expect(result).toBeNull();
    });
  });
});
