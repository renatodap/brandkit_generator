/**
 * Tests for /api/businesses/[id] (GET, PATCH, DELETE)
 *
 * Tests individual business operations with authentication, validation, and RLS.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../route';
import {
  createMockRequest,
  mockRequireUser,
  mockUser,
  mockBusiness,
} from '../../__tests__/helpers';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/business-service', () => ({
  getBusinessById: vi.fn(),
  updateBusiness: vi.fn(),
  deleteBusiness: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { requireUser } from '@/lib/supabase/server';
import { getBusinessById, updateBusiness, deleteBusiness } from '@/lib/services/business-service';

describe('GET /api/businesses/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(requireUser).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should proceed if user is authenticated', async () => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(getBusinessById).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await GET(request, { params });

      expect(requireUser).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Business Retrieval', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should return business by ID', async () => {
      vi.mocked(getBusinessById).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockBusiness);
      expect(getBusinessById).toHaveBeenCalledWith('business-123', mockUser.id);
    });

    it('should return 404 if business not found', async () => {
      vi.mocked(getBusinessById).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/nonexistent-id',
      });

      const params = Promise.resolve({ id: 'nonexistent-id' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(getBusinessById).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to load business. Please try again.');
    });
  });

  describe('Row-Level Security (RLS)', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should only return business if user owns it', async () => {
      vi.mocked(getBusinessById).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      await GET(request, { params });

      // Verify that getBusinessById is called with user_id for ownership check
      expect(getBusinessById).toHaveBeenCalledWith('business-123', mockUser.id);
    });

    it('should return 404 if user does not own the business', async () => {
      // RLS would prevent access, service returns null
      vi.mocked(getBusinessById).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/business-456',
      });

      const params = Promise.resolve({ id: 'business-456' });
      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });
  });
});

describe('PATCH /api/businesses/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(requireUser).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { name: 'Updated Name' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should proceed if user is authenticated', async () => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(updateBusiness).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { name: 'Updated Name' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });

      expect(requireUser).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should reject empty name if provided', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { name: '' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject name exceeding 255 characters', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { name: 'a'.repeat(256) },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject invalid slug format', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { slug: 'Invalid-Slug' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject slug starting with hyphen', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { slug: '-invalid-slug' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should reject description exceeding 1000 characters', async () => {
      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { description: 'a'.repeat(1001) },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should accept null description', async () => {
      vi.mocked(updateBusiness).mockResolvedValue({
        ...mockBusiness,
        description: null,
      } as any);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { description: null },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(200);
    });

    it('should accept null industry', async () => {
      vi.mocked(updateBusiness).mockResolvedValue({
        ...mockBusiness,
        industry: null,
      } as any);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { industry: null },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(200);
    });

    it('should accept empty update object', async () => {
      vi.mocked(updateBusiness).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: {},
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(200);
    });
  });

  describe('Business Update', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should update business name', async () => {
      const updatedBusiness = { ...mockBusiness, name: 'Updated Name' };
      vi.mocked(updateBusiness).mockResolvedValue(updatedBusiness);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { name: 'Updated Name' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
      expect(updateBusiness).toHaveBeenCalledWith('business-123', mockUser.id, { name: 'Updated Name' });
    });

    it('should update business slug', async () => {
      const updatedBusiness = { ...mockBusiness, slug: 'new-slug' };
      vi.mocked(updateBusiness).mockResolvedValue(updatedBusiness);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { slug: 'new-slug' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.slug).toBe('new-slug');
    });

    it('should update multiple fields', async () => {
      const updatedBusiness = {
        ...mockBusiness,
        name: 'New Name',
        slug: 'new-slug',
        description: 'New description',
        industry: 'Healthcare',
      };
      vi.mocked(updateBusiness).mockResolvedValue(updatedBusiness);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: {
          name: 'New Name',
          slug: 'new-slug',
          description: 'New description',
          industry: 'Healthcare',
        },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedBusiness);
    });

    it('should return 404 if business not found', async () => {
      vi.mocked(updateBusiness).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/nonexistent-id',
        body: { name: 'Updated Name' },
      });

      const params = Promise.resolve({ id: 'nonexistent-id' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });

    it('should return 409 if slug already exists', async () => {
      vi.mocked(updateBusiness).mockRejectedValue(
        new Error('A business with this slug already exists in your account')
      );

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { slug: 'existing-slug' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(updateBusiness).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { name: 'Updated Name' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update business. Please try again.');
    });
  });

  describe('Row-Level Security (RLS)', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should only update business if user owns it', async () => {
      vi.mocked(updateBusiness).mockResolvedValue(mockBusiness);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-123',
        body: { name: 'Updated Name' },
      });

      const params = Promise.resolve({ id: 'business-123' });
      await PATCH(request, { params });

      // Verify that updateBusiness is called with user_id for ownership check
      expect(updateBusiness).toHaveBeenCalledWith('business-123', mockUser.id, expect.any(Object));
    });

    it('should return 404 if user does not own the business', async () => {
      // RLS would prevent update, service returns null
      vi.mocked(updateBusiness).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3000/api/businesses/business-456',
        body: { name: 'Updated Name' },
      });

      const params = Promise.resolve({ id: 'business-456' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });
  });
});

describe('DELETE /api/businesses/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(requireUser).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should proceed if user is authenticated', async () => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(deleteBusiness).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await DELETE(request, { params });

      expect(requireUser).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Business Deletion', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should delete business successfully', async () => {
      vi.mocked(deleteBusiness).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Business deleted successfully');
      expect(deleteBusiness).toHaveBeenCalledWith('business-123', mockUser.id);
    });

    it('should return 404 if business not found', async () => {
      vi.mocked(deleteBusiness).mockResolvedValue(false);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/businesses/nonexistent-id',
      });

      const params = Promise.resolve({ id: 'nonexistent-id' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(deleteBusiness).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete business. Please try again.');
    });
  });

  describe('Cascade Deletion', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should delete business and associated brand kit (via cascade)', async () => {
      vi.mocked(deleteBusiness).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(200);
      expect(deleteBusiness).toHaveBeenCalledWith('business-123', mockUser.id);
    });
  });

  describe('Row-Level Security (RLS)', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should only delete business if user owns it', async () => {
      vi.mocked(deleteBusiness).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/businesses/business-123',
      });

      const params = Promise.resolve({ id: 'business-123' });
      await DELETE(request, { params });

      // Verify that deleteBusiness is called with user_id for ownership check
      expect(deleteBusiness).toHaveBeenCalledWith('business-123', mockUser.id);
    });

    it('should return 404 if user does not own the business', async () => {
      // RLS would prevent deletion, service returns false
      vi.mocked(deleteBusiness).mockResolvedValue(false);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3000/api/businesses/business-456',
      });

      const params = Promise.resolve({ id: 'business-456' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Business not found');
    });
  });
});
