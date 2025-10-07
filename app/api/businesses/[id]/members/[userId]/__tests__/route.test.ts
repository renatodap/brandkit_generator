/**
 * Tests for Business Member Management API
 *
 * PATCH /api/businesses/[id]/members/[userId] - Update member role
 * DELETE /api/businesses/[id]/members/[userId] - Remove member
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';
import {
  canManageTeam,
  updateMemberRole,
  removeMember,
} from '@/lib/services/team-service';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/team-service', () => ({
  canManageTeam: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('PATCH /api/businesses/[id]/members/[userId]', () => {
  const mockBusinessId = 'business-123';
  const mockCurrentUserId = 'user-admin';
  const mockTargetUserId = 'user-member';

  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    };

    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Authentication required. Please sign in.',
      });
    });

    it('should return 401 if no user in session', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockCurrentUserId, email: 'admin@example.com' },
        },
        error: null,
      });
    });

    it('should return 403 if user does not have permission to manage team', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'editor' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        error: 'You do not have permission to manage team members',
      });
      expect(canManageTeam).toHaveBeenCalledWith(
        mockCurrentUserId,
        mockBusinessId
      );
    });

    it('should allow owner to update member roles', async () => {
      (canManageTeam as Mock).mockResolvedValue(true);
      (updateMemberRole as Mock).mockResolvedValue({
        id: 'member-1',
        business_id: mockBusinessId,
        user_id: mockTargetUserId,
        role: 'admin',
        invited_by: 'owner-123',
        joined_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-06T00:00:00Z',
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
      expect(canManageTeam).toHaveBeenCalledWith(
        mockCurrentUserId,
        mockBusinessId
      );
    });

    it('should allow admin to update member roles', async () => {
      (canManageTeam as Mock).mockResolvedValue(true);
      (updateMemberRole as Mock).mockResolvedValue({
        id: 'member-1',
        business_id: mockBusinessId,
        user_id: mockTargetUserId,
        role: 'viewer',
        invited_by: 'owner-123',
        joined_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-06T00:00:00Z',
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'viewer' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
    });

    it('should deny access for editor member', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(403);
    });

    it('should deny access for viewer member', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockCurrentUserId, email: 'admin@example.com' },
        },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
    });

    it('should return 400 for invalid role', async () => {
      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'invalid-role' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
      expect(data.details.role).toBeDefined();
    });

    it('should return 400 for missing role', async () => {
      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({}),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should accept valid admin role', async () => {
      (updateMemberRole as Mock).mockResolvedValue({
        id: 'member-1',
        role: 'admin',
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
      expect(updateMemberRole).toHaveBeenCalledWith(
        mockBusinessId,
        mockTargetUserId,
        'admin'
      );
    });

    it('should accept valid editor role', async () => {
      (updateMemberRole as Mock).mockResolvedValue({
        id: 'member-1',
        role: 'editor',
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'editor' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
      expect(updateMemberRole).toHaveBeenCalledWith(
        mockBusinessId,
        mockTargetUserId,
        'editor'
      );
    });

    it('should accept valid viewer role', async () => {
      (updateMemberRole as Mock).mockResolvedValue({
        id: 'member-1',
        role: 'viewer',
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'viewer' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
      expect(updateMemberRole).toHaveBeenCalledWith(
        mockBusinessId,
        mockTargetUserId,
        'viewer'
      );
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockCurrentUserId, email: 'admin@example.com' },
        },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
    });

    it('should successfully update member role and return updated member', async () => {
      const mockUpdatedMember = {
        id: 'member-1',
        business_id: mockBusinessId,
        user_id: mockTargetUserId,
        role: 'admin',
        invited_by: 'owner-123',
        joined_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-06T10:00:00Z',
      };

      (updateMemberRole as Mock).mockResolvedValue(mockUpdatedMember);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedMember);
      expect(updateMemberRole).toHaveBeenCalledWith(
        mockBusinessId,
        mockTargetUserId,
        'admin'
      );
    });

    it('should handle role downgrade from admin to editor', async () => {
      (updateMemberRole as Mock).mockResolvedValue({
        id: 'member-1',
        role: 'editor',
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'editor' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
    });

    it('should handle role upgrade from viewer to admin', async () => {
      (updateMemberRole as Mock).mockResolvedValue({
        id: 'member-1',
        role: 'admin',
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockCurrentUserId, email: 'admin@example.com' },
        },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
    });

    it('should return 500 if updateMemberRole fails', async () => {
      (updateMemberRole as Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to update team member. Please try again.',
      });
    });

    it('should handle invalid JSON in request body', async () => {
      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        {
          method: 'PATCH',
          body: 'invalid json',
        }
      );

      const response = await PATCH(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(500);
    });
  });
});

describe('DELETE /api/businesses/[id]/members/[userId]', () => {
  const mockBusinessId = 'business-123';
  const mockCurrentUserId = 'user-admin';
  const mockTargetUserId = 'user-member';

  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    };

    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Authentication required. Please sign in.',
      });
    });
  });

  describe('Authorization - Self Removal', () => {
    it('should allow user to remove themselves (leave team)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockTargetUserId, email: 'member@example.com' },
        },
        error: null,
      });

      (removeMember as Mock).mockResolvedValue(undefined);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(removeMember).toHaveBeenCalledWith(
        mockBusinessId,
        mockTargetUserId
      );
      expect(canManageTeam).not.toHaveBeenCalled(); // Should not check permissions for self
    });

    it('should allow admin to remove themselves', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockTargetUserId, email: 'admin@example.com' } },
        error: null,
      });

      (removeMember as Mock).mockResolvedValue(undefined);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Authorization - Removing Others', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockCurrentUserId, email: 'admin@example.com' },
        },
        error: null,
      });
    });

    it('should return 403 if user does not have permission to remove others', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        error: 'You do not have permission to remove team members',
      });
      expect(canManageTeam).toHaveBeenCalledWith(
        mockCurrentUserId,
        mockBusinessId
      );
    });

    it('should allow owner to remove members', async () => {
      (canManageTeam as Mock).mockResolvedValue(true);
      (removeMember as Mock).mockResolvedValue(undefined);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
      expect(canManageTeam).toHaveBeenCalledWith(
        mockCurrentUserId,
        mockBusinessId
      );
    });

    it('should allow admin to remove members', async () => {
      (canManageTeam as Mock).mockResolvedValue(true);
      (removeMember as Mock).mockResolvedValue(undefined);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(200);
    });

    it('should deny access for editor trying to remove others', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(403);
    });

    it('should deny access for viewer trying to remove others', async () => {
      (canManageTeam as Mock).mockResolvedValue(false);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockCurrentUserId, email: 'admin@example.com' },
        },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
    });

    it('should successfully remove member and return success', async () => {
      (removeMember as Mock).mockResolvedValue(undefined);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(removeMember).toHaveBeenCalledWith(
        mockBusinessId,
        mockTargetUserId
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockCurrentUserId, email: 'admin@example.com' },
        },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
    });

    it('should return 500 if removeMember fails', async () => {
      (removeMember as Mock).mockRejectedValue(new Error('Database error'));

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to remove team member. Please try again.',
      });
    });

    it('should handle attempting to remove business owner', async () => {
      (removeMember as Mock).mockRejectedValue(
        new Error('Cannot remove business owner')
      );

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/owner-123`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: 'owner-123' },
      });

      expect(response.status).toBe(500);
    });

    it('should handle non-existent member removal', async () => {
      (removeMember as Mock).mockRejectedValue(
        new Error('Member not found')
      );

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/non-existent`
        ),
        { method: 'DELETE' }
      );

      const response = await DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: 'non-existent' },
      });

      expect(response.status).toBe(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent removal attempts', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockCurrentUserId, email: 'admin@example.com' },
        },
        error: null,
      });
      (canManageTeam as Mock).mockResolvedValue(true);
      (removeMember as Mock).mockResolvedValue(undefined);

      mockRequest = new NextRequest(
        new URL(
          `http://localhost:3000/api/businesses/${mockBusinessId}/members/${mockTargetUserId}`
        ),
        { method: 'DELETE' }
      );

      const response1 = DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });
      const response2 = DELETE(mockRequest, {
        params: { id: mockBusinessId, userId: mockTargetUserId },
      });

      const [result1, result2] = await Promise.all([response1, response2]);

      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
    });
  });
});
