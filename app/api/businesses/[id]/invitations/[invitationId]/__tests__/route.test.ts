/**
 * Tests for Delete Invitation API
 * DELETE /api/businesses/[id]/invitations/[invitationId] - Revoke invitation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '../route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/lib/supabase/server';
import * as teamService from '@/lib/services/team-service';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock team service
vi.mock('@/lib/services/team-service', () => ({
  canManageTeam: vi.fn(),
  revokeInvitation: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('DELETE /api/businesses/[id]/invitations/[invitationId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'owner@example.com',
  };

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  const createRequest = () => {
    return new NextRequest(
      'http://localhost:3000/api/businesses/biz-123/invitations/inv-456',
      {
        method: 'DELETE',
      }
    );
  };

  it('should revoke invitation successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
    vi.mocked(teamService.revokeInvitation).mockResolvedValue(undefined);

    const request = createRequest();
    const response = await DELETE(request, {
      params: { id: 'biz-123', invitationId: 'inv-456' },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(teamService.revokeInvitation).toHaveBeenCalledWith('inv-456');
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);

    const request = createRequest();
    const response = await DELETE(request, {
      params: { id: 'biz-123', invitationId: 'inv-456' },
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required. Please sign in.');
  });

  it('should reject if user lacks permission to manage team', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(false);

    const request = createRequest();
    const response = await DELETE(request, {
      params: { id: 'biz-123', invitationId: 'inv-456' },
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('You do not have permission to revoke invitations');
  });

  it('should handle non-existent invitation gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
    vi.mocked(teamService.revokeInvitation).mockRejectedValue(
      new Error('Invitation not found')
    );

    const request = createRequest();
    const response = await DELETE(request, {
      params: { id: 'biz-123', invitationId: 'non-existent' },
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to revoke invitation. Please try again.');
  });

  it('should handle service layer errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
    vi.mocked(teamService.revokeInvitation).mockRejectedValue(
      new Error('Database error')
    );

    const request = createRequest();
    const response = await DELETE(request, {
      params: { id: 'biz-123', invitationId: 'inv-456' },
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to revoke invitation. Please try again.');
  });

  it('should only allow admins and owners to revoke invitations', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { ...mockUser, id: 'editor-user' } },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(false);

    const request = createRequest();
    const response = await DELETE(request, {
      params: { id: 'biz-123', invitationId: 'inv-456' },
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('You do not have permission to revoke invitations');
    expect(teamService.revokeInvitation).not.toHaveBeenCalled();
  });

  it('should verify business ID matches before revoking', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
    vi.mocked(teamService.revokeInvitation).mockResolvedValue(undefined);

    const request = createRequest();
    const response = await DELETE(request, {
      params: { id: 'different-biz', invitationId: 'inv-456' },
    });

    // Should check permissions for the correct business
    expect(teamService.canManageTeam).toHaveBeenCalledWith('user-123', 'different-biz');
  });
});
