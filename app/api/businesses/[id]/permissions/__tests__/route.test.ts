/**
 * Tests for Business Permissions API
 *
 * GET /api/businesses/[id]/permissions - Get current user's permissions
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';
import { getUserBusinessPermissions } from '@/lib/services/team-service';
import type { UserBusinessPermission } from '@/types/team';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/team-service', () => ({
  getUserBusinessPermissions: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('GET /api/businesses/[id]/permissions', () => {
  const mockBusinessId = 'business-123';
  const mockUserId = 'user-123';

  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock request
    mockRequest = new NextRequest(
      new URL(
        `http://localhost:3000/api/businesses/${mockBusinessId}/permissions`
      )
    );

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

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
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

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Authentication required. Please sign in.',
      });
    });
  });

  describe('Owner Permissions', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'owner@example.com' } },
        error: null,
      });
    });

    it('should return full permissions for business owner', async () => {
      const ownerPermissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'owner',
        can_view: true,
        can_edit: true,
        can_manage_team: true,
        can_delete: true,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(
        ownerPermissions
      );

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(ownerPermissions);
      expect(data.role).toBe('owner');
      expect(data.can_view).toBe(true);
      expect(data.can_edit).toBe(true);
      expect(data.can_manage_team).toBe(true);
      expect(data.can_delete).toBe(true);
      expect(getUserBusinessPermissions).toHaveBeenCalledWith(
        mockUserId,
        mockBusinessId
      );
    });
  });

  describe('Admin Permissions', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'admin@example.com' } },
        error: null,
      });
    });

    it('should return admin permissions (no delete)', async () => {
      const adminPermissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'admin',
        can_view: true,
        can_edit: true,
        can_manage_team: true,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(
        adminPermissions
      );

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(adminPermissions);
      expect(data.role).toBe('admin');
      expect(data.can_view).toBe(true);
      expect(data.can_edit).toBe(true);
      expect(data.can_manage_team).toBe(true);
      expect(data.can_delete).toBe(false); // Admin cannot delete business
    });
  });

  describe('Editor Permissions', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'editor@example.com' } },
        error: null,
      });
    });

    it('should return editor permissions (view and edit only)', async () => {
      const editorPermissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'editor',
        can_view: true,
        can_edit: true,
        can_manage_team: false,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(
        editorPermissions
      );

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(editorPermissions);
      expect(data.role).toBe('editor');
      expect(data.can_view).toBe(true);
      expect(data.can_edit).toBe(true);
      expect(data.can_manage_team).toBe(false); // Editor cannot manage team
      expect(data.can_delete).toBe(false); // Editor cannot delete business
    });
  });

  describe('Viewer Permissions', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'viewer@example.com' } },
        error: null,
      });
    });

    it('should return viewer permissions (view only)', async () => {
      const viewerPermissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'viewer',
        can_view: true,
        can_edit: false,
        can_manage_team: false,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(
        viewerPermissions
      );

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(viewerPermissions);
      expect(data.role).toBe('viewer');
      expect(data.can_view).toBe(true);
      expect(data.can_edit).toBe(false); // Viewer cannot edit
      expect(data.can_manage_team).toBe(false); // Viewer cannot manage team
      expect(data.can_delete).toBe(false); // Viewer cannot delete business
    });
  });

  describe('No Access', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: mockUserId, email: 'outsider@example.com' },
        },
        error: null,
      });
    });

    it('should return viewer permissions with no access for non-members', async () => {
      const noAccessPermissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'viewer',
        can_view: false,
        can_edit: false,
        can_manage_team: false,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(
        noAccessPermissions
      );

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(noAccessPermissions);
      expect(data.can_view).toBe(false);
      expect(data.can_edit).toBe(false);
      expect(data.can_manage_team).toBe(false);
      expect(data.can_delete).toBe(false);
    });
  });

  describe('Permission Checks', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@example.com' } },
        error: null,
      });
    });

    it('should verify owner has all permissions', async () => {
      const permissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'owner',
        can_view: true,
        can_edit: true,
        can_manage_team: true,
        can_delete: true,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(data.can_view).toBe(true);
      expect(data.can_edit).toBe(true);
      expect(data.can_manage_team).toBe(true);
      expect(data.can_delete).toBe(true);
    });

    it('should verify admin has all permissions except delete', async () => {
      const permissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'admin',
        can_view: true,
        can_edit: true,
        can_manage_team: true,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(data.can_view).toBe(true);
      expect(data.can_edit).toBe(true);
      expect(data.can_manage_team).toBe(true);
      expect(data.can_delete).toBe(false);
    });

    it('should verify editor has view and edit permissions only', async () => {
      const permissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'editor',
        can_view: true,
        can_edit: true,
        can_manage_team: false,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(data.can_view).toBe(true);
      expect(data.can_edit).toBe(true);
      expect(data.can_manage_team).toBe(false);
      expect(data.can_delete).toBe(false);
    });

    it('should verify viewer has view permission only', async () => {
      const permissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'viewer',
        can_view: true,
        can_edit: false,
        can_manage_team: false,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(data.can_view).toBe(true);
      expect(data.can_edit).toBe(false);
      expect(data.can_manage_team).toBe(false);
      expect(data.can_delete).toBe(false);
    });

    it('should verify non-member has no permissions', async () => {
      const permissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'viewer',
        can_view: false,
        can_edit: false,
        can_manage_team: false,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(data.can_view).toBe(false);
      expect(data.can_edit).toBe(false);
      expect(data.can_manage_team).toBe(false);
      expect(data.can_delete).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@example.com' } },
        error: null,
      });
    });

    it('should return 500 if getUserBusinessPermissions fails', async () => {
      (getUserBusinessPermissions as Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to load permissions. Please try again.',
      });
    });

    it('should handle auth service errors', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(
        new Error('Auth service down')
      );

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });

      expect(response.status).toBe(500);
    });

    it('should handle malformed business ID', async () => {
      (getUserBusinessPermissions as Mock).mockRejectedValue(
        new Error('Invalid business ID')
      );

      const invalidRequest = new NextRequest(
        new URL(
          'http://localhost:3000/api/businesses/invalid-id-###/permissions'
        )
      );

      const response = await GET(invalidRequest, {
        params: { id: 'invalid-id-###' },
      });

      expect(response.status).toBe(500);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@example.com' } },
        error: null,
      });
    });

    it('should handle checking permissions for non-existent business', async () => {
      const permissions: UserBusinessPermission = {
        business_id: 'non-existent-business',
        user_id: mockUserId,
        role: 'viewer',
        can_view: false,
        can_edit: false,
        can_manage_team: false,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const nonExistentRequest = new NextRequest(
        new URL(
          'http://localhost:3000/api/businesses/non-existent-business/permissions'
        )
      );

      const response = await GET(nonExistentRequest, {
        params: { id: 'non-existent-business' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.can_view).toBe(false);
    });

    it('should handle concurrent permission checks', async () => {
      const permissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'admin',
        can_view: true,
        can_edit: true,
        can_manage_team: true,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const response1 = GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const response2 = GET(mockRequest, {
        params: { id: mockBusinessId },
      });

      const [result1, result2] = await Promise.all([response1, response2]);

      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
    });

    it('should return consistent permission structure across all roles', async () => {
      const roles: Array<'owner' | 'admin' | 'editor' | 'viewer'> = [
        'owner',
        'admin',
        'editor',
        'viewer',
      ];

      for (const role of roles) {
        const permissions: UserBusinessPermission = {
          business_id: mockBusinessId,
          user_id: mockUserId,
          role,
          can_view: true,
          can_edit: ['owner', 'admin', 'editor'].includes(role),
          can_manage_team: ['owner', 'admin'].includes(role),
          can_delete: role === 'owner',
        };

        (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

        const response = await GET(mockRequest, {
          params: { id: mockBusinessId },
        });
        const data = await response.json();

        expect(data).toHaveProperty('business_id');
        expect(data).toHaveProperty('user_id');
        expect(data).toHaveProperty('role');
        expect(data).toHaveProperty('can_view');
        expect(data).toHaveProperty('can_edit');
        expect(data).toHaveProperty('can_manage_team');
        expect(data).toHaveProperty('can_delete');
      }
    });

    it('should handle rapid role changes', async () => {
      // Simulate role change from viewer to admin
      const viewerPermissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'viewer',
        can_view: true,
        can_edit: false,
        can_manage_team: false,
        can_delete: false,
      };

      const adminPermissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'admin',
        can_view: true,
        can_edit: true,
        can_manage_team: true,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock)
        .mockResolvedValueOnce(viewerPermissions)
        .mockResolvedValueOnce(adminPermissions);

      const response1 = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data1 = await response1.json();

      const response2 = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data2 = await response2.json();

      expect(data1.role).toBe('viewer');
      expect(data1.can_edit).toBe(false);

      expect(data2.role).toBe('admin');
      expect(data2.can_edit).toBe(true);
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: 'user@example.com' } },
        error: null,
      });
    });

    it('should return correct JSON structure', async () => {
      const permissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'admin',
        can_view: true,
        can_edit: true,
        can_manage_team: true,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });
      const data = await response.json();

      expect(data).toMatchObject({
        business_id: expect.any(String),
        user_id: expect.any(String),
        role: expect.any(String),
        can_view: expect.any(Boolean),
        can_edit: expect.any(Boolean),
        can_manage_team: expect.any(Boolean),
        can_delete: expect.any(Boolean),
      });
    });

    it('should set correct content-type header', async () => {
      const permissions: UserBusinessPermission = {
        business_id: mockBusinessId,
        user_id: mockUserId,
        role: 'viewer',
        can_view: true,
        can_edit: false,
        can_manage_team: false,
        can_delete: false,
      };

      (getUserBusinessPermissions as Mock).mockResolvedValue(permissions);

      const response = await GET(mockRequest, {
        params: { id: mockBusinessId },
      });

      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });
  });
});
