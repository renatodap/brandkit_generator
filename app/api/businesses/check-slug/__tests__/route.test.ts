/**
 * Tests for /api/businesses/check-slug (GET)
 *
 * Tests slug availability checking with authentication and validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import {
  createMockRequest,
  mockRequireUser,
  mockUser,
} from '../../__tests__/helpers';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/business-service', () => ({
  isSlugAvailable: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { requireUser } from '@/lib/supabase/server';
import { isSlugAvailable } from '@/lib/services/business-service';

describe('GET /api/businesses/check-slug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(requireUser).mockRejectedValue(new Error('Unauthorized'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'test-business' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should proceed if user is authenticated', async () => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'test-business' },
      });

      const response = await GET(request);

      expect(requireUser).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should return 400 if slug parameter is missing', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Slug parameter is required');
    });

    it('should return 400 if slug is empty string', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: '' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Slug parameter is required');
    });
  });

  describe('Slug Availability', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should return true if slug is available', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'available-slug' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
      expect(isSlugAvailable).toHaveBeenCalledWith('available-slug', mockUser.id, undefined);
    });

    it('should return false if slug is already taken', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(false);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'taken-slug' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(false);
      expect(isSlugAvailable).toHaveBeenCalledWith('taken-slug', mockUser.id, undefined);
    });

    it('should check availability for slug with hyphens', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'my-test-business-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
      expect(isSlugAvailable).toHaveBeenCalledWith('my-test-business-123', mockUser.id, undefined);
    });

    it('should check availability for slug with numbers', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'business123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
    });
  });

  describe('Exclude ID Parameter', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should pass excludeId when provided', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'test-slug', excludeId: 'business-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
      expect(isSlugAvailable).toHaveBeenCalledWith('test-slug', mockUser.id, 'business-123');
    });

    it('should allow same slug when excluding current business ID (update scenario)', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'current-slug', excludeId: 'business-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
    });

    it('should not pass excludeId when not provided', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'test-slug' },
      });

      await GET(request);

      expect(isSlugAvailable).toHaveBeenCalledWith('test-slug', mockUser.id, undefined);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(isSlugAvailable).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'test-slug' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to check slug availability. Please try again.');
    });

    it('should return 500 on service error', async () => {
      vi.mocked(isSlugAvailable).mockRejectedValue(new Error('Service unavailable'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'test-slug' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to check slug availability. Please try again.');
    });
  });

  describe('Row-Level Security (RLS)', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should only check slug availability for authenticated user', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'test-slug' },
      });

      await GET(request);

      // Verify that isSlugAvailable is called with user_id
      expect(isSlugAvailable).toHaveBeenCalledWith('test-slug', mockUser.id, undefined);
    });

    it('should check slug uniqueness within user scope only', async () => {
      // Slug is taken by this user
      vi.mocked(isSlugAvailable).mockResolvedValue(false);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'my-business' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(false);

      // Verify that the check was scoped to the user
      expect(isSlugAvailable).toHaveBeenCalledWith('my-business', mockUser.id, undefined);
    });

    it('should allow same slug for different users (verified via user_id)', async () => {
      // Slug is available for this user (even if another user has it)
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'common-slug' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);

      // The service checks availability for this specific user
      expect(isSlugAvailable).toHaveBeenCalledWith('common-slug', mockUser.id, undefined);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should handle create scenario - new slug', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'new-business-slug' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.available).toBe(true);
    });

    it('should handle create scenario - duplicate slug', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(false);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'existing-slug' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.available).toBe(false);
    });

    it('should handle update scenario - same slug for same business', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'current-slug', excludeId: 'business-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.available).toBe(true);
      expect(isSlugAvailable).toHaveBeenCalledWith('current-slug', mockUser.id, 'business-123');
    });

    it('should handle update scenario - changing to existing slug', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(false);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'other-business-slug', excludeId: 'business-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.available).toBe(false);
      expect(isSlugAvailable).toHaveBeenCalledWith('other-business-slug', mockUser.id, 'business-123');
    });

    it('should handle update scenario - changing to new slug', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'brand-new-slug', excludeId: 'business-123' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.available).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.mocked(requireUser).mockResolvedValue(mockUser);
    });

    it('should handle very long slug', async () => {
      const longSlug = 'a'.repeat(255);
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: longSlug },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
    });

    it('should handle single character slug', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'a' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
    });

    it('should handle slug with only numbers', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: '12345' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
    });

    it('should handle slug with multiple consecutive hyphens', async () => {
      vi.mocked(isSlugAvailable).mockResolvedValue(true);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/businesses/check-slug',
        searchParams: { slug: 'test---business' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.available).toBe(true);
    });
  });
});
