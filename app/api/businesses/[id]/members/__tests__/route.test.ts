/**
 * Tests for Business Members API
 *
 * GET /api/businesses/[id]/members - List all members
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMembers, canManageTeam } from '@/lib/services/team-service';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/team-service', () => ({
  getBusinessMembers: vi.fn(),
  canManageTeam: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('GET /api/businesses/[id]/members', () => {
  const mockBusinessId = 'business-123';
  const mockUserId = 'user-123';
  const mockOwnerId = 'owner-456';

  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock request
    mockRequest = new NextRequest(
      new URL(`http://localhost:3000/api/businesses/${mockBusinessId}/members`)
    );

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
    };

    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Authentication required. Please sign in.',
      });
    });

    it('should return 401 if auth error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Authentication required. Please sign in.',
      });
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@example.com' } },
        error: null,
      });
    });

    it('should return 403 if user does not have permission to view members', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        error: 'You do not have permission to view team members',
      });
      expect(canManageTeam).toHaveBeenCalledWith(mockUserId, mockBusinessId);
    });

    it('should allow access for business owner', async () => {
      (canManageTeam as Mock).mockResolvedValue(true);
      (getBusinessMembers as Mock).mockResolvedValue([]);

      mockSupabase.single.mockResolvedValue({
        data: {
          user_id: mockOwnerId,
          user: {
            id: mockOwnerId,
            email: 'owner@example.com',
            raw_user_meta_data: { full_name: 'Business Owner' },
          },
        },
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });

      expect(response.status).toBe(200);
      expect(canManageTeam).toHaveBeenCalledWith(mockUserId, mockBusinessId);
    });

    it('should allow access for admin member', async () => {
      (canManageTeam as Mock).mockResolvedValue(true);
      (getBusinessMembers as Mock).mockResolvedValue([]);

      mockSupabase.single.mockResolvedValue({
        data: {
          user_id: mockOwnerId,
          user: {
            id: mockOwnerId,
            email: 'owner@example.com',
            raw_user_meta_data: {},
          },
        },
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });

      expect(response.status).toBe(200);
    });

    it('should deny access for viewer member', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });

      expect(response.status).toBe(403);
    });

    it('should deny access for editor member', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });

      expect(response.status).toBe(403);
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@example.com' } },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
    });

    it('should return members list with owner info', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          business_id: mockBusinessId,
          user_id: 'user-1',
          role: 'admin',
          invited_by: mockOwnerId,
          joined_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            email: 'admin@example.com',
            user_metadata: { full_name: 'Admin User' },
          },
        },
        {
          id: 'member-2',
          business_id: mockBusinessId,
          user_id: 'user-2',
          role: 'editor',
          invited_by: mockOwnerId,
          joined_at: '2025-01-02T00:00:00Z',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
          user: {
            id: 'user-2',
            email: 'editor@example.com',
            user_metadata: { full_name: 'Editor User' },
          },
        },
      ];

      (getBusinessMembers as Mock).mockResolvedValue(mockMembers);

      mockSupabase.single.mockResolvedValue({
        data: {
          user_id: mockOwnerId,
          user: {
            id: mockOwnerId,
            email: 'owner@example.com',
            raw_user_meta_data: { full_name: 'Business Owner' },
          },
        },
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        members: mockMembers,
        owner: {
          id: mockOwnerId,
          user: {
            id: mockOwnerId,
            email: 'owner@example.com',
            user_metadata: { full_name: 'Business Owner' },
          },
        },
      });
      expect(getBusinessMembers).toHaveBeenCalledWith(mockBusinessId);
    });

    it('should handle business with no members', async () => {
      (getBusinessMembers as Mock).mockResolvedValue([]);

      mockSupabase.single.mockResolvedValue({
        data: {
          user_id: mockOwnerId,
          user: {
            id: mockOwnerId,
            email: 'owner@example.com',
            raw_user_meta_data: {},
          },
        },
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toEqual([]);
      expect(data.owner).toBeDefined();
    });

    it('should handle owner with no metadata gracefully', async () => {
      (getBusinessMembers as Mock).mockResolvedValue([]);

      mockSupabase.single.mockResolvedValue({
        data: {
          user_id: mockOwnerId,
          user: {
            id: mockOwnerId,
            email: 'owner@example.com',
            raw_user_meta_data: null,
          },
        },
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.owner?.user.user_metadata).toBeNull();
    });

    it('should handle missing owner data gracefully', async () => {
      (getBusinessMembers as Mock).mockResolvedValue([]);

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.owner).toBeNull();
    });

    it('should return members with various roles', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          business_id: mockBusinessId,
          user_id: 'user-1',
          role: 'admin',
          invited_by: mockOwnerId,
          joined_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            email: 'admin@example.com',
            user_metadata: { full_name: 'Admin User' },
          },
        },
        {
          id: 'member-2',
          business_id: mockBusinessId,
          user_id: 'user-2',
          role: 'editor',
          invited_by: mockOwnerId,
          joined_at: '2025-01-02T00:00:00Z',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
          user: {
            id: 'user-2',
            email: 'editor@example.com',
            user_metadata: { full_name: 'Editor User' },
          },
        },
        {
          id: 'member-3',
          business_id: mockBusinessId,
          user_id: 'user-3',
          role: 'viewer',
          invited_by: 'user-1',
          joined_at: '2025-01-03T00:00:00Z',
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-03T00:00:00Z',
          user: {
            id: 'user-3',
            email: 'viewer@example.com',
            user_metadata: { full_name: 'Viewer User' },
          },
        },
      ];

      (getBusinessMembers as Mock).mockResolvedValue(mockMembers);

      mockSupabase.single.mockResolvedValue({
        data: {
          user_id: mockOwnerId,
          user: {
            id: mockOwnerId,
            email: 'owner@example.com',
            raw_user_meta_data: {},
          },
        },
        error: null,
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toHaveLength(3);
      expect(data.members[0].role).toBe('admin');
      expect(data.members[1].role).toBe('editor');
      expect(data.members[2].role).toBe('viewer');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@example.com' } },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
    });

    it('should return 500 if getBusinessMembers fails', async () => {
      (getBusinessMembers as Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to load team members. Please try again.',
      });
    });

    it('should return 500 if owner fetch fails but still return members', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          business_id: mockBusinessId,
          user_id: 'user-1',
          role: 'admin',
          invited_by: mockOwnerId,
          joined_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            email: 'admin@example.com',
            user_metadata: {},
          },
        },
      ];

      (getBusinessMembers as Mock).mockResolvedValue(mockMembers);

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Owner fetch failed'),
      });

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toEqual(mockMembers);
      expect(data.owner).toBeNull();
    });

    it('should handle canManageTeam service errors', async () => {
      (canManageTeam as Mock).mockRejectedValue(
        new Error('Permission check failed')
      );

      const response = await GET(mockRequest, { params: { id: mockBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to load team members. Please try again.',
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@example.com' } },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
    });

    it('should handle invalid business ID gracefully', async () => {
      const invalidBusinessId = 'invalid-id';

      (getBusinessMembers as Mock).mockRejectedValue(
        new Error('Business not found')
      );

      const response = await GET(mockRequest, { params: { id: invalidBusinessId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle concurrent requests to same business', async () => {
      (getBusinessMembers as Mock).mockResolvedValue([]);

      mockSupabase.single.mockResolvedValue({
        data: {
          user_id: mockOwnerId,
          user: {
            id: mockOwnerId,
            email: 'owner@example.com',
            raw_user_meta_data: {},
          },
        },
        error: null,
      });

      // Simulate concurrent requests
      const response1 = GET(mockRequest, { params: { id: mockBusinessId } });
      const response2 = GET(mockRequest, { params: { id: mockBusinessId } });

      const [result1, result2] = await Promise.all([response1, response2]);

      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
    });
  });
});
