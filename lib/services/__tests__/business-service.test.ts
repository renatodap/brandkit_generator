/**
 * Tests for Business Service
 *
 * Tests cover:
 * - createBusiness: success, duplicate slug, validation errors
 * - getBusinesses: pagination, filtering, sorting, empty results
 * - getBusinessById: found, not found, unauthorized
 * - getBusinessBySlug: found, not found
 * - updateBusiness: success, slug conflict, not found
 * - deleteBusiness: success, not found
 * - isSlugAvailable: available, taken, exclude business ID
 * - getBusinessesWithBrandKits: join query, pagination
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as businessService from '../business-service';
import * as supabaseServer from '@/lib/supabase/server';
import type { CreateBusinessInput, UpdateBusinessInput, ListBusinessesQuery } from '@/lib/validations/business';
import type { Business } from '@/types';

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

describe('Business Service', () => {
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
      maybeSingle: vi.fn(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };
  });

  describe('createBusiness', () => {
    const mockUserId = 'user-123';
    const validInput: CreateBusinessInput = {
      name: 'Test Business',
      slug: 'test-business',
      description: 'A test business',
      industry: 'Technology',
    };

    it('should create business successfully', async () => {
      const mockBusiness: Business = {
        id: 'business-123',
        user_id: mockUserId,
        name: validInput.name,
        slug: validInput.slug,
        description: validInput.description,
        industry: validInput.industry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: mockBusiness,
        error: null,
      });

      const result = await businessService.createBusiness(mockUserId, validInput);

      expect(result).toEqual(mockBusiness);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('businesses');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          name: validInput.name,
          slug: validInput.slug,
          description: validInput.description,
          industry: validInput.industry,
        })
      );
    });

    it('should throw error for duplicate slug', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Unique constraint violation' },
      });

      await expect(businessService.createBusiness(mockUserId, validInput)).rejects.toThrow(
        'A business with this slug already exists'
      );
    });

    it('should throw error for RLS policy violation', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(businessService.createBusiness(mockUserId, validInput)).rejects.toThrow('Permission denied');
    });

    it('should throw error on database error', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: '23503', message: 'Foreign key constraint violation' },
      });

      await expect(businessService.createBusiness(mockUserId, validInput)).rejects.toThrow('Database error');
    });
  });

  describe('getBusinesses', () => {
    const mockUserId = 'user-123';

    it('should fetch businesses with default parameters', async () => {
      const mockBusinesses: Business[] = [
        {
          id: 'business-1',
          user_id: mockUserId,
          name: 'Business 1',
          slug: 'business-1',
          description: 'Description 1',
          industry: 'tech',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'business-2',
          user_id: mockUserId,
          name: 'Business 2',
          slug: 'business-2',
          industry: 'finance',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: mockBusinesses,
        error: null,
        count: 2,
      });

      const result = await businessService.getBusinesses(mockUserId);

      expect(result.businesses).toEqual(mockBusinesses);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply industry filter', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const query: ListBusinessesQuery = {
        limit: 50,
        offset: 0,
        sort: 'created_at',
        order: 'desc',
        industry: 'tech',
      };

      await businessService.getBusinesses(mockUserId, query);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('industry', 'tech');
    });

    it('should apply sorting by name', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const query: ListBusinessesQuery = {
        limit: 50,
        offset: 0,
        sort: 'name',
        order: 'asc',
      };

      await businessService.getBusinesses(mockUserId, query);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('name', { ascending: true });
    });

    it('should apply pagination', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const query: ListBusinessesQuery = {
        limit: 10,
        offset: 20,
        sort: 'created_at',
        order: 'desc',
      };

      await businessService.getBusinesses(mockUserId, query);

      expect(mockSupabaseClient.range).toHaveBeenCalledWith(20, 29);
    });

    it('should return empty array when no businesses found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await businessService.getBusinesses(mockUserId);

      expect(result.businesses).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error on database error', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      await expect(businessService.getBusinesses(mockUserId)).rejects.toThrow('Failed to fetch businesses');
    });
  });

  describe('getBusinessById', () => {
    const mockBusinessId = 'business-123';
    const mockUserId = 'user-123';

    it('should fetch business by ID successfully', async () => {
      const mockBusiness: Business = {
        id: mockBusinessId,
        user_id: mockUserId,
        name: 'Test Business',
        slug: 'test-business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: mockBusiness,
        error: null,
      });

      const result = await businessService.getBusinessById(mockBusinessId, mockUserId);

      expect(result).toEqual(mockBusiness);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockBusinessId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return null if business not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await businessService.getBusinessById(mockBusinessId, mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(businessService.getBusinessById(mockBusinessId, mockUserId)).rejects.toThrow(
        'Failed to fetch business'
      );
    });
  });

  describe('getBusinessBySlug', () => {
    const mockSlug = 'test-business';
    const mockUserId = 'user-123';

    it('should fetch business by slug successfully', async () => {
      const mockBusiness: Business = {
        id: 'business-123',
        user_id: mockUserId,
        name: 'Test Business',
        slug: mockSlug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: mockBusiness,
        error: null,
      });

      const result = await businessService.getBusinessBySlug(mockSlug, mockUserId);

      expect(result).toEqual(mockBusiness);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('slug', mockSlug);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return null if business not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await businessService.getBusinessBySlug(mockSlug, mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'Permission denied' },
      });

      await expect(businessService.getBusinessBySlug(mockSlug, mockUserId)).rejects.toThrow(
        'Failed to fetch business'
      );
    });
  });

  describe('updateBusiness', () => {
    const mockBusinessId = 'business-123';
    const mockUserId = 'user-123';

    it('should update business successfully', async () => {
      const mockExisting: Business = {
        id: mockBusinessId,
        user_id: mockUserId,
        name: 'Old Name',
        slug: 'old-slug',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdated: Business = {
        ...mockExisting,
        name: 'New Name',
        slug: 'new-slug',
      };

      const updateData: UpdateBusinessInput = {
        name: 'New Name',
        slug: 'new-slug',
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock getBusinessById (existing check)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExisting,
        error: null,
      });

      // Mock update
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      const result = await businessService.updateBusiness(mockBusinessId, mockUserId, updateData);

      expect(result).toEqual(mockUpdated);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          slug: 'new-slug',
          updated_at: expect.any(String),
        })
      );
    });

    it('should return null if business not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await businessService.updateBusiness(mockBusinessId, mockUserId, { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('should throw error for duplicate slug', async () => {
      const mockExisting: Business = {
        id: mockBusinessId,
        user_id: mockUserId,
        name: 'Test Business',
        slug: 'test-business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExisting,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'Unique constraint violation' },
      });

      await expect(
        businessService.updateBusiness(mockBusinessId, mockUserId, { slug: 'existing-slug' })
      ).rejects.toThrow('A business with this slug already exists');
    });

    it('should throw error on database error', async () => {
      const mockExisting: Business = {
        id: mockBusinessId,
        user_id: mockUserId,
        name: 'Test Business',
        slug: 'test-business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockExisting,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(businessService.updateBusiness(mockBusinessId, mockUserId, { name: 'New Name' })).rejects.toThrow(
        'Failed to update business'
      );
    });
  });

  describe('deleteBusiness', () => {
    const mockBusinessId = 'business-123';
    const mockUserId = 'user-123';

    it('should delete business successfully', async () => {
      const mockExisting: Business = {
        id: mockBusinessId,
        user_id: mockUserId,
        name: 'Test Business',
        slug: 'test-business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock getBusinessById - need to set up complete chain for select().eq().eq().single()
      const mockSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockExisting,
          error: null,
        }),
      };

      mockSupabaseClient.select.mockReturnValueOnce(mockSelectChain);

      // Mock delete operation - full chain: delete().eq('id', x).eq('user_id', y)
      const mockDeleteChain = {
        eq: vi.fn(),
      };

      // First .eq() returns itself, second .eq() returns the result
      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain) // First eq() - for 'id'
        .mockReturnValueOnce({ error: null }); // Second eq() - for 'user_id'

      mockSupabaseClient.delete.mockReturnValueOnce(mockDeleteChain);

      const result = await businessService.deleteBusiness(mockBusinessId, mockUserId);

      expect(result).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should return false if business not found', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await businessService.deleteBusiness(mockBusinessId, mockUserId);

      expect(result).toBe(false);
    });

    it('should throw error on database error', async () => {
      const mockExisting: Business = {
        id: mockBusinessId,
        user_id: mockUserId,
        name: 'Test Business',
        slug: 'test-business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      // Mock getBusinessById
      const mockSelectChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockExisting,
          error: null,
        }),
      };

      mockSupabaseClient.select.mockReturnValueOnce(mockSelectChain);

      // Mock delete operation with error
      const mockDeleteChain = {
        eq: vi.fn(),
      };

      // First .eq() returns itself, second .eq() returns error
      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain) // First eq() - for 'id'
        .mockReturnValueOnce({ error: { message: 'Database error' } }); // Second eq() - for 'user_id'

      mockSupabaseClient.delete.mockReturnValueOnce(mockDeleteChain);

      await expect(businessService.deleteBusiness(mockBusinessId, mockUserId)).rejects.toThrow(
        'Failed to delete business'
      );
    });
  });

  describe('isSlugAvailable', () => {
    const mockSlug = 'test-slug';
    const mockUserId = 'user-123';

    it('should return true if slug is available', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await businessService.isSlugAvailable(mockSlug, mockUserId);

      expect(result).toBe(true);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('slug', mockSlug);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return false if slug is taken', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: { id: 'business-123' },
        error: null,
      });

      const result = await businessService.isSlugAvailable(mockSlug, mockUserId);

      expect(result).toBe(false);
    });

    it('should exclude specific business ID when checking', async () => {
      const excludeId = 'business-123';

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await businessService.isSlugAvailable(mockSlug, mockUserId, excludeId);

      expect(result).toBe(true);
      expect(mockSupabaseClient.neq).toHaveBeenCalledWith('id', excludeId);
    });

    it('should throw error on database error', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(businessService.isSlugAvailable(mockSlug, mockUserId)).rejects.toThrow(
        'Failed to check slug availability'
      );
    });
  });

  describe('getBusinessesWithBrandKits', () => {
    const mockUserId = 'user-123';

    it('should fetch businesses with brand kits successfully', async () => {
      const mockData = [
        {
          id: 'business-1',
          user_id: mockUserId,
          name: 'Business 1',
          slug: 'business-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          brand_kits: [
            {
              id: 'brand-kit-1',
              business_name: 'Business 1',
              logo_url: 'https://example.com/logo1.png',
              colors: [],
              fonts: {},
              is_favorite: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'business-2',
          user_id: mockUserId,
          name: 'Business 2',
          slug: 'business-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          brand_kits: [],
        },
      ];

      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      });

      const result = await businessService.getBusinessesWithBrandKits(mockUserId);

      expect(result.businesses).toHaveLength(2);
      expect(result.businesses[0].brand_kit).toBeDefined();
      expect(result.businesses[0].has_brand_kit).toBe(true);
      expect(result.businesses[1].brand_kit).toBeNull();
      expect(result.businesses[1].has_brand_kit).toBe(false);
      expect(result.total).toBe(2);
    });

    it('should apply industry filter', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const query: ListBusinessesQuery = {
        limit: 50,
        offset: 0,
        sort: 'created_at',
        order: 'desc',
        industry: 'tech',
      };

      await businessService.getBusinessesWithBrandKits(mockUserId, query);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('industry', 'tech');
    });

    it('should apply sorting and pagination', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const query: ListBusinessesQuery = {
        limit: 10,
        offset: 5,
        sort: 'name',
        order: 'asc',
      };

      await businessService.getBusinessesWithBrandKits(mockUserId, query);

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(5, 14);
    });

    it('should throw error on database error', async () => {
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      await expect(businessService.getBusinessesWithBrandKits(mockUserId)).rejects.toThrow('Failed to fetch businesses');
    });
  });
});
