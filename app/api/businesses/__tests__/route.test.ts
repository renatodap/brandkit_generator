/**
 * Tests for /api/businesses (POST, GET)
 *
 * Tests business creation and listing with authentication, validation, and RLS.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, GET } from '../route';
import {
  createMockRequest,
  createMockSupabaseClient,
  mockRequireUser,
  mockRequireUserUnauthorized,
  mockUser,
  mockBusiness,
  SUPABASE_ERRORS,
} from './helpers';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/business-service', () => ({
  createBusiness: vi.fn(),
  getBusinesses: vi.fn(),
  getBusinessesWithBrandKits: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { requireUser } from '@/lib/supabase/server';
import {
  createBusiness,
  getBusinesses,
  getBusinessesWithBrandKits,
} from '@/lib/services/business-service';

describe('POST /api/businesses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(requireUser).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should proceed if user is authenticated', async () => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(createBusiness).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
        },
      });

      const response = await POST(request);

      expect(requireUser).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should reject missing business name', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          slug: 'test-business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
      expect(data.details).toBeDefined();
    });

    it('should reject empty business name', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: '',
          slug: 'test-business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject business name exceeding 255 characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'a'.repeat(256),
          slug: 'test-business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject missing slug', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject invalid slug format (uppercase)', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'Test-Business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject invalid slug format (spaces)', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject invalid slug format (special characters)', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test@business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject slug starting with hyphen', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: '-test-business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject slug ending with hyphen', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business-',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject description exceeding 1000 characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
          description: 'a'.repeat(1001),
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject industry exceeding 100 characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
          industry: 'a'.repeat(101),
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should accept valid business with all fields', async () => {
      vi.mocked(createBusiness).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
          description: 'A test business description',
          industry: 'Technology',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('business-123');
    });

    it('should accept valid business with only required fields', async () => {
      vi.mocked(createBusiness).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(createBusiness).toHaveBeenCalledWith(mockUser.id, {
        name: 'Test Business',
        slug: 'test-business',
      });
    });
  });

  describe('Business Creation', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should create business successfully', async () => {
      vi.mocked(createBusiness).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
          description: 'Test description',
          industry: 'Technology',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockBusiness);
      expect(createBusiness).toHaveBeenCalledWith(mockUser.id, {
        name: 'Test Business',
        slug: 'test-business',
        description: 'Test description',
        industry: 'Technology',
      });
    });

    it('should return 409 if slug already exists', async () => {
      vi.mocked(createBusiness).mockRejectedValue(
        new Error('A business with this slug already exists in your account')
      );

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'existing-slug',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(createBusiness).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create business. Please try again.');
    });
  });

  describe('Row-Level Security (RLS)', () => {
    it('should create business with correct user_id', async () => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(createBusiness).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'POST',
        body: {
          name: 'Test Business',
          slug: 'test-business',
        },
      });

      await POST(request);

      expect(createBusiness).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          name: 'Test Business',
          slug: 'test-business',
        })
      );
    });
  });
});

describe('GET /api/businesses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(requireUser).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest({
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should proceed if user is authenticated', async () => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [mockBusiness],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
      });

      const response = await GET(request);

      expect(requireUser).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Query Parameters', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should use default query parameters if none provided', async () => {
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [mockBusiness],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
      });

      await GET(request);

      expect(getBusinesses).toHaveBeenCalledWith(mockUser.id, {
        limit: 50,
        offset: 0,
        sort: 'created_at',
        order: 'desc',
        industry: undefined,
      });
    });

    it('should accept custom limit parameter', async () => {
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [mockBusiness],
        total: 1,
        limit: 20,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
        searchParams: { limit: '20' },
      });

      await GET(request);

      expect(getBusinesses).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          limit: 20,
        })
      );
    });

    it('should accept custom offset parameter', async () => {
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [],
        total: 0,
        limit: 50,
        offset: 100,
      });

      const request = createMockRequest({
        method: 'GET',
        searchParams: { offset: '100' },
      });

      await GET(request);

      expect(getBusinesses).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          offset: 100,
        })
      );
    });

    it('should accept custom sort parameter', async () => {
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [mockBusiness],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
        searchParams: { sort: 'name' },
      });

      await GET(request);

      expect(getBusinesses).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          sort: 'name',
        })
      );
    });

    it('should accept custom order parameter', async () => {
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [mockBusiness],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
        searchParams: { order: 'asc' },
      });

      await GET(request);

      expect(getBusinesses).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          order: 'asc',
        })
      );
    });

    it('should accept industry filter', async () => {
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [mockBusiness],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
        searchParams: { industry: 'Technology' },
      });

      await GET(request);

      expect(getBusinesses).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          industry: 'Technology',
        })
      );
    });

    it('should return 400 for invalid query parameters', async () => {
      const request = createMockRequest({
        method: 'GET',
        searchParams: { limit: '-10' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('Brand Kit Inclusion', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should call getBusinesses when include param is not set', async () => {
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [mockBusiness],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
      });

      await GET(request);

      expect(getBusinesses).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
      expect(getBusinessesWithBrandKits).not.toHaveBeenCalled();
    });

    it('should call getBusinessesWithBrandKits when include=brand_kits', async () => {
      const businessWithBrandKit = {
        ...mockBusiness,
        brand_kit: {
          id: 'brand-kit-123',
          business_name: 'Test Business',
          logo_url: 'https://example.com/logo.png',
        },
        has_brand_kit: true,
      };

      vi.mocked(getBusinessesWithBrandKits).mockResolvedValue({
        businesses: [businessWithBrandKit],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
        searchParams: { include: 'brand_kits' },
      });

      await GET(request);

      expect(getBusinessesWithBrandKits).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
      expect(getBusinesses).not.toHaveBeenCalled();
    });
  });

  describe('Business Listing', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should return list of businesses', async () => {
      const businesses = [
        mockBusiness,
        { ...mockBusiness, id: 'business-456', name: 'Another Business', slug: 'another-business' },
      ];

      vi.mocked(getBusinesses).mockResolvedValue({
        businesses,
        total: 2,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.businesses).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.limit).toBe(50);
      expect(data.offset).toBe(0);
    });

    it('should return empty array if no businesses exist', async () => {
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [],
        total: 0,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.businesses).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(getBusinesses).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to load businesses. Please try again.');
    });
  });

  describe('Row-Level Security (RLS)', () => {
    it('should only return businesses owned by authenticated user', async () => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(getBusinesses).mockResolvedValue({
        businesses: [mockBusiness],
        total: 1,
        limit: 50,
        offset: 0,
      });

      const request = createMockRequest({
        method: 'GET',
      });

      await GET(request);

      // Verify that getBusinesses is called with the authenticated user's ID
      expect(getBusinesses).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
    });
  });
});
