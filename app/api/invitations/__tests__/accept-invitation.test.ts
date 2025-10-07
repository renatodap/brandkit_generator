/**
 * Tests for Accept Invitation API
 * POST /api/invitations/[token]/accept - Accept invitation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../[token]/accept/route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/lib/supabase/server';
import * as teamService from '@/lib/services/team-service';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock team service
vi.mock('@/lib/services/team-service', () => ({
  acceptInvitation: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('POST /api/invitations/[token]/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user-456',
    email: 'invitee@example.com',
  };

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  const createRequest = (token: string) => {
    return new NextRequest(`http://localhost:3000/api/invitations/${token}/accept`, {
      method: 'POST',
    });
  };

  it('should accept invitation successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockResolvedValue(undefined);

    const request = createRequest('valid-token-123');
    const response = await POST(request, { params: { token: 'valid-token-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(teamService.acceptInvitation).toHaveBeenCalledWith('valid-token-123', 'user-456');
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);

    const request = createRequest('valid-token');
    const response = await POST(request, { params: { token: 'valid-token' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('You must be logged in to accept an invitation');
    expect(teamService.acceptInvitation).not.toHaveBeenCalled();
  });

  it('should reject if invitation not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockRejectedValue(
      new Error('Invitation not found')
    );

    const request = createRequest('invalid-token');
    const response = await POST(request, { params: { token: 'invalid-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invitation not found');
  });

  it('should reject if invitation has expired', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockRejectedValue(
      new Error('Invitation has expired')
    );

    const request = createRequest('expired-token');
    const response = await POST(request, { params: { token: 'expired-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invitation has expired');
  });

  it('should reject if invitation is no longer valid', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockRejectedValue(
      new Error('Invitation is no longer valid')
    );

    const request = createRequest('invalid-status-token');
    const response = await POST(request, { params: { token: 'invalid-status-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invitation is no longer valid');
  });

  it('should reject if user email does not match invitation', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { ...mockUser, email: 'different@example.com' } },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockRejectedValue(
      new Error('This invitation was sent to a different email address')
    );

    const request = createRequest('email-mismatch-token');
    const response = await POST(request, { params: { token: 'email-mismatch-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('This invitation was sent to a different email address');
  });

  it('should reject if user is already a member', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockRejectedValue(
      new Error('User is already a member of this business')
    );

    const request = createRequest('already-member-token');
    const response = await POST(request, { params: { token: 'already-member-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User is already a member of this business');
  });

  it('should handle service layer errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockRejectedValue(
      new Error('Database error')
    );

    const request = createRequest('error-token');
    const response = await POST(request, { params: { token: 'error-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Database error');
  });

  it('should pass user ID to service layer', async () => {
    const specificUser = {
      id: 'specific-user-789',
      email: 'specific@example.com',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: specificUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockResolvedValue(undefined);

    const request = createRequest('token-xyz');
    await POST(request, { params: { token: 'token-xyz' } });

    expect(teamService.acceptInvitation).toHaveBeenCalledWith(
      'token-xyz',
      'specific-user-789'
    );
  });

  it('should handle authentication errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' } as any,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);

    const request = createRequest('any-token');
    const response = await POST(request, { params: { token: 'any-token' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('You must be logged in to accept an invitation');
  });

  it('should accept invitation with different roles', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.acceptInvitation).mockResolvedValue(undefined);

    const roles = ['admin', 'editor', 'viewer'];

    for (const role of roles) {
      const request = createRequest(`${role}-token`);
      const response = await POST(request, { params: { token: `${role}-token` } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    }
  });

  it('should create member record when accepting invitation', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);

    let acceptCalled = false;
    vi.mocked(teamService.acceptInvitation).mockImplementation(async () => {
      acceptCalled = true;
      // Service should create member record and mark invitation as accepted
    });

    const request = createRequest('member-creation-token');
    const response = await POST(request, { params: { token: 'member-creation-token' } });

    expect(response.status).toBe(200);
    expect(acceptCalled).toBe(true);
  });
});
