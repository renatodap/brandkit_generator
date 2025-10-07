/**
 * Tests for /api/share/[token] endpoint
 *
 * Tests:
 * - GET: Get shared brand kit by token (public access)
 * - Token validation
 * - Token expiration handling
 * - Privacy (user_id removal)
 * - Error handling
 * - Not found scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../share/[token]/route';
import { NextRequest } from 'next/server';

// Mock all external dependencies BEFORE imports
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/services/brand-kit-service', () => ({
  getBrandKitByShareToken: vi.fn(),
}));

// Import test utilities AFTER mocks
import {
  extractJson,
  expectStatus,
  mockBrandKit,
  mockShareToken,
  expiredShareToken,
} from './test-utils';

describe('GET /api/share/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful retrieval', () => {
    it('should return brand kit for valid token', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('businessName', 'Test Business');
      expect(data).toHaveProperty('logo');
      expect(data).toHaveProperty('colors');
      expect(data).toHaveProperty('fonts');
      expect(data).toHaveProperty('tagline');
    });

    it('should call getBrandKitByShareToken with correct token', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/abc123', {
        method: 'GET',
      });

      await GET(request, { params: { token: 'abc123' } });

      expect(getBrandKitByShareToken).toHaveBeenCalledWith('abc123');
    });

    it('should remove user_id from response for privacy', async () => {
      const brandKitWithUserId = {
        ...mockBrandKit,
        user_id: 'secret-user-id-123',
      };

      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(brandKitWithUserId as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).not.toHaveProperty('user_id');
      expect(data).toHaveProperty('businessName');
    });

    it('should include all brand kit data except user_id', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('business_id');
      expect(data).toHaveProperty('businessName');
      expect(data).toHaveProperty('businessDescription');
      expect(data).toHaveProperty('industry');
      expect(data).toHaveProperty('logo');
      expect(data).toHaveProperty('colors');
      expect(data).toHaveProperty('fonts');
      expect(data).toHaveProperty('tagline');
      expect(data).toHaveProperty('justifications');
      expect(data).toHaveProperty('generatedAt');
    });
  });

  describe('Token validation', () => {
    it('should return 404 for invalid token', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/share/invalid-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'invalid-token' } });
      const data = await extractJson(response);

      expectStatus(response, 404);
      expect(data).toHaveProperty('error', 'Share link not found or expired');
    });

    it('should return 404 for non-existent token', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/share/nonexistent', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'nonexistent' } });
      const data = await extractJson(response);

      expectStatus(response, 404);
      expect(data).toHaveProperty('error', 'Share link not found or expired');
    });

    it('should return 404 for expired token', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      // Service returns null for expired tokens
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/share/expired-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'expired-token' } });
      const data = await extractJson(response);

      expectStatus(response, 404);
      expect(data).toHaveProperty('error', 'Share link not found or expired');
    });

    it('should handle empty token', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/share/', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: '' } });
      const data = await extractJson(response);

      expectStatus(response, 404);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Public access', () => {
    it('should not require authentication', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
        // No authorization header
      });

      const response = await GET(request, { params: { token: 'test-token' } });

      expectStatus(response, 200);
    });

    it('should work without any headers', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('businessName');
    });
  });

  describe('Error handling', () => {
    it('should return 500 when service throws error', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 500);
      expect(data).toHaveProperty('error', 'Failed to load shared brand kit. Please try again.');
    });

    it('should log errors with token context', async () => {
      const { logger } = await import('@/lib/logger');
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      const testError = new Error('Database connection failed');
      vi.mocked(getBrandKitByShareToken).mockRejectedValueOnce(testError);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      await GET(request, { params: { token: 'test-token' } });

      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching shared brand kit',
        testError,
        { token: 'test-token' }
      );
    });

    it('should handle service layer errors gracefully', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockRejectedValueOnce(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 500);
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });

    it('should not expose internal error details', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockRejectedValueOnce(
        new Error('Internal: Database credentials expired at connection pool')
      );

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 500);
      expect(data.error).toBe('Failed to load shared brand kit. Please try again.');
      expect(data.error).not.toContain('Database credentials');
    });
  });

  describe('Data integrity', () => {
    it('should return complete logo data when present', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data.logo).toHaveProperty('url');
      expect(data.logo).toHaveProperty('svgCode');
    });

    it('should return null logo when logo is null', async () => {
      const brandKitWithoutLogo = {
        ...mockBrandKit,
        logo: null,
      };

      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(brandKitWithoutLogo as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data.logo).toBeNull();
    });

    it('should return complete color palette', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data.colors).toHaveProperty('primary');
      expect(data.colors).toHaveProperty('secondary');
      expect(data.colors).toHaveProperty('accent');
      expect(data.colors).toHaveProperty('neutral');
      expect(data.colors).toHaveProperty('background');
    });

    it('should return complete font pairing', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data.fonts.primary).toHaveProperty('name');
      expect(data.fonts.primary).toHaveProperty('family');
      expect(data.fonts.primary).toHaveProperty('url');
      expect(data.fonts.primary).toHaveProperty('category');
      expect(data.fonts.secondary).toHaveProperty('name');
      expect(data.fonts.secondary).toHaveProperty('family');
      expect(data.fonts.secondary).toHaveProperty('url');
      expect(data.fonts.secondary).toHaveProperty('category');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long tokens', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(null);

      const longToken = 'a'.repeat(1000);
      const request = new NextRequest(`http://localhost:3000/api/share/${longToken}`, {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: longToken } });

      expectStatus(response, 404);
    });

    it('should handle tokens with special characters', async () => {
      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(mockBrandKit as any);

      const specialToken = 'abc-123_XYZ';
      const request = new NextRequest(`http://localhost:3000/api/share/${specialToken}`, {
        method: 'GET',
      });

      await GET(request, { params: { token: specialToken } });

      expect(getBrandKitByShareToken).toHaveBeenCalledWith(specialToken);
    });

    it('should handle justifications being undefined', async () => {
      const brandKitWithoutJustifications = {
        ...mockBrandKit,
        justifications: undefined,
      };

      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(brandKitWithoutJustifications as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data.justifications).toBeUndefined();
    });

    it('should handle optional fields being null', async () => {
      const minimalBrandKit = {
        id: 'test-id',
        business_id: 'test-business-id',
        businessName: 'Test Business',
        businessDescription: null,
        industry: 'tech',
        logo: null,
        colors: mockBrandKit.colors,
        fonts: mockBrandKit.fonts,
        tagline: 'Test tagline',
        generatedAt: '2025-10-06T12:00:00.000Z',
      };

      const { getBrandKitByShareToken } = await import('@/lib/services/brand-kit-service');
      vi.mocked(getBrandKitByShareToken).mockResolvedValueOnce(minimalBrandKit as any);

      const request = new NextRequest('http://localhost:3000/api/share/test-token', {
        method: 'GET',
      });

      const response = await GET(request, { params: { token: 'test-token' } });
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data.businessDescription).toBeNull();
      expect(data.logo).toBeNull();
    });
  });
});
