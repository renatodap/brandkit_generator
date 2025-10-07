/**
 * Tests for POST /api/brand-kits/[id]/share
 *
 * Tests cover:
 * - Authentication (401 when not authenticated)
 * - Validation errors (400 for invalid input)
 * - Not found errors (404)
 * - Success cases (201)
 * - Error handling (500 for server errors)
 * - Share URL generation
 * - Expiration date handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as supabaseServer from '@/lib/supabase/server';
import * as brandKitService from '@/lib/services/brand-kit-service';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/services/brand-kit-service');
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('POST /api/brand-kits/[id]/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    vi.mocked(supabaseServer.requireUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/brand-kits/123/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Authentication required. Please sign in.' });
  });

  it('should return 404 when brand kit not found', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/nonexistent/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Brand kit not found' });
  });

  it('should create share token with default expiration', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'abc123def456',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      shareUrl: 'http://localhost:3000/share/abc123def456',
      token: 'abc123def456',
      expiresAt: expiresAt,
    });
    expect(brandKitService.createShareToken).toHaveBeenCalledWith(
      'brand-kit-123',
      'user-123',
      undefined // Default expiration
    );
  });

  it('should create share token with custom expiration', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'xyz789abc123',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({
        expiresInDays: 30,
      }),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      shareUrl: 'http://localhost:3000/share/xyz789abc123',
      token: 'xyz789abc123',
      expiresAt: expiresAt,
    });
    expect(brandKitService.createShareToken).toHaveBeenCalledWith(
      'brand-kit-123',
      'user-123',
      30
    );
  });

  it('should validate expiresInDays as positive integer', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({
        expiresInDays: -5, // Negative value should fail
      }),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(data.details).toBeDefined();
  });

  it('should validate expiresInDays maximum of 365', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({
        expiresInDays: 500, // Exceeds maximum
      }),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(data.details).toBeDefined();
  });

  it('should validate expiresInDays as integer', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({
        expiresInDays: 7.5, // Decimal value should fail
      }),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  it('should handle empty request body', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'token123',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      // No body
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });

    expect(response.status).toBe(201);
  });

  it('should handle malformed JSON body', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'token123',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: 'invalid json',
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });

    // Should default to empty object when JSON parsing fails
    expect(response.status).toBe(201);
  });

  it('should use NEXT_PUBLIC_APP_URL from environment', async () => {
    const originalUrl = process.env['NEXT_PUBLIC_APP_URL'];
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://brandkit.example.com';

    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'secure-token-123',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.shareUrl).toBe('https://brandkit.example.com/share/secure-token-123');

    // Restore original URL
    process.env['NEXT_PUBLIC_APP_URL'] = originalUrl;
  });

  it('should fallback to localhost when NEXT_PUBLIC_APP_URL is not set', async () => {
    const originalUrl = process.env['NEXT_PUBLIC_APP_URL'];
    delete process.env['NEXT_PUBLIC_APP_URL'];

    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'fallback-token',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.shareUrl).toBe('http://localhost:3000/share/fallback-token');

    // Restore original URL
    process.env['NEXT_PUBLIC_APP_URL'] = originalUrl;
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.createShareToken).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create share link. Please try again.');
  });

  it('should create share token with 1 day expiration', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'short-lived-token',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({
        expiresInDays: 1,
      }),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.token).toBe('short-lived-token');
    expect(brandKitService.createShareToken).toHaveBeenCalledWith(
      'brand-kit-123',
      'user-123',
      1
    );
  });

  it('should create share token with maximum 365 day expiration', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'long-lived-token',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({
        expiresInDays: 365,
      }),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.token).toBe('long-lived-token');
    expect(brandKitService.createShareToken).toHaveBeenCalledWith(
      'brand-kit-123',
      'user-123',
      365
    );
  });

  it('should not allow creating share token for another user\'s brand kit', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    // Service layer should return null when trying to share another user's brand kit
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-456/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: { id: 'brand-kit-456' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Brand kit not found' });
  });

  it('should return all required fields in response', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const mockShareToken = {
      id: 'share-token-123',
      brand_kit_id: 'brand-kit-123',
      token: 'complete-token',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.createShareToken).mockResolvedValue(mockShareToken);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123/share', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('shareUrl');
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('expiresAt');
    expect(typeof data.shareUrl).toBe('string');
    expect(typeof data.token).toBe('string');
    expect(typeof data.expiresAt).toBe('string');
  });
});
