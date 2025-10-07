/**
 * Tests for /api/brand-kits/[id] routes
 *
 * Tests cover:
 * - GET: Retrieve single brand kit
 * - PATCH: Update brand kit
 * - DELETE: Delete brand kit
 * - Authentication (401 when not authenticated)
 * - Authorization (403 when accessing others' resources)
 * - Validation errors (400 for invalid input)
 * - Not found errors (404)
 * - Success cases (200, 204)
 * - Error handling (500 for server errors)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../route';
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

describe('GET /api/brand-kits/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    vi.mocked(supabaseServer.requireUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/brand-kits/123');
    const response = await GET(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Authentication required. Please sign in.' });
  });

  it('should return 404 when brand kit not found', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.getBrandKitById).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/nonexistent');
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Brand kit not found' });
  });

  it('should return 403 when user does not own the brand kit', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.getBrandKitById).mockRejectedValue(
      new Error('Forbidden')
    );

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-456');
    const response = await GET(request, { params: { id: 'brand-kit-456' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: 'You do not have access to this brand kit' });
  });

  it('should return brand kit successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockBrandKit = {
      id: 'brand-kit-123',
      business_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: 'user-123',
      business_name: 'Test Business',
      business_description: 'A test business',
      industry: 'Technology',
      logo_url: 'https://example.com/logo.png',
      logo_svg: '<svg>...</svg>',
      colors: [
        { name: 'Primary', hex: '#FF5733', usage: 'Headers' },
      ],
      fonts: {
        primary: 'Inter',
        secondary: 'Lora',
      },
      tagline: 'Innovation at its best',
      design_justification: 'Modern and clean',
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.getBrandKitById).mockResolvedValue(mockBrandKit);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123');
    const response = await GET(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockBrandKit);
    expect(brandKitService.getBrandKitById).toHaveBeenCalledWith('brand-kit-123', 'user-123');
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.getBrandKitById).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123');
    const response = await GET(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to load brand kit. Please try again.');
  });
});

describe('PATCH /api/brand-kits/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    vi.mocked(supabaseServer.requireUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/brand-kits/123', {
      method: 'PATCH',
      body: JSON.stringify({ businessName: 'Updated Name' }),
    });
    const response = await PATCH(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Authentication required. Please sign in.' });
  });

  it('should return 404 when brand kit not found', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.updateBrandKit).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ businessName: 'Updated Name' }),
    });
    const response = await PATCH(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Brand kit not found' });
  });

  it('should validate input with Zod schema', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'PATCH',
      body: JSON.stringify({
        businessName: '', // Empty string should fail
      }),
    });
    const response = await PATCH(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(data.details).toBeDefined();
  });

  it('should validate businessName length', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    const longName = 'a'.repeat(256); // Exceeds 255 characters

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'PATCH',
      body: JSON.stringify({
        businessName: longName,
      }),
    });
    const response = await PATCH(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  it('should update business name successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockUpdatedBrandKit = {
      id: 'brand-kit-123',
      business_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: 'user-123',
      business_name: 'Updated Business Name',
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.updateBrandKit).mockResolvedValue(mockUpdatedBrandKit);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'PATCH',
      body: JSON.stringify({
        businessName: 'Updated Business Name',
      }),
    });
    const response = await PATCH(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockUpdatedBrandKit);
    expect(brandKitService.updateBrandKit).toHaveBeenCalledWith(
      'brand-kit-123',
      'user-123',
      { businessName: 'Updated Business Name' }
    );
  });

  it('should toggle favorite status successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockUpdatedBrandKit = {
      id: 'brand-kit-123',
      business_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: 'user-123',
      business_name: 'Test Business',
      is_favorite: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.updateBrandKit).mockResolvedValue(mockUpdatedBrandKit);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'PATCH',
      body: JSON.stringify({
        isFavorite: true,
      }),
    });
    const response = await PATCH(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.is_favorite).toBe(true);
    expect(brandKitService.updateBrandKit).toHaveBeenCalledWith(
      'brand-kit-123',
      'user-123',
      { isFavorite: true }
    );
  });

  it('should update both businessName and isFavorite', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockUpdatedBrandKit = {
      id: 'brand-kit-123',
      business_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: 'user-123',
      business_name: 'New Name',
      is_favorite: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.updateBrandKit).mockResolvedValue(mockUpdatedBrandKit);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'PATCH',
      body: JSON.stringify({
        businessName: 'New Name',
        isFavorite: true,
      }),
    });
    const response = await PATCH(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.business_name).toBe('New Name');
    expect(data.is_favorite).toBe(true);
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.updateBrandKit).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'PATCH',
      body: JSON.stringify({
        businessName: 'Updated Name',
      }),
    });
    const response = await PATCH(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update brand kit. Please try again.');
  });

  it('should accept empty body for partial updates', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockBrandKit = {
      id: 'brand-kit-123',
      user_id: 'user-123',
      business_name: 'Unchanged',
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.updateBrandKit).mockResolvedValue(mockBrandKit);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const response = await PATCH(request, { params: { id: 'brand-kit-123' } });

    expect(response.status).toBe(200);
    expect(brandKitService.updateBrandKit).toHaveBeenCalledWith(
      'brand-kit-123',
      'user-123',
      {}
    );
  });
});

describe('DELETE /api/brand-kits/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    vi.mocked(supabaseServer.requireUser).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/brand-kits/123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Authentication required. Please sign in.' });
  });

  it('should return 404 when brand kit not found', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.deleteBrandKit).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/nonexistent', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Brand kit not found' });
  });

  it('should delete brand kit successfully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    vi.mocked(supabaseServer.requireUser).mockResolvedValue(mockUser);
    vi.mocked(brandKitService.deleteBrandKit).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'brand-kit-123' } });

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
    expect(brandKitService.deleteBrandKit).toHaveBeenCalledWith('brand-kit-123', 'user-123');
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    vi.mocked(brandKitService.deleteBrandKit).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-123', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'brand-kit-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete brand kit. Please try again.');
  });

  it('should not allow deleting another user\'s brand kit', async () => {
    vi.mocked(supabaseServer.requireUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });
    // Service layer should return false when trying to delete another user's brand kit
    vi.mocked(brandKitService.deleteBrandKit).mockResolvedValue(false);

    const request = new NextRequest('http://localhost:3000/api/brand-kits/brand-kit-456', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'brand-kit-456' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Brand kit not found' });
  });
});
