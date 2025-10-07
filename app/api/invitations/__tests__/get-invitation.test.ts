/**
 * Tests for Get Invitation by Token API
 * GET /api/invitations/[token] - Get invitation details
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../[token]/route';
import { NextRequest } from 'next/server';
import * as teamService from '@/lib/services/team-service';

// Mock team service
vi.mock('@/lib/services/team-service', () => ({
  getInvitationByToken: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('GET /api/invitations/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (token: string) => {
    return new NextRequest(`http://localhost:3000/api/invitations/${token}`, {
      method: 'GET',
    });
  };

  const mockInvitation = {
    id: 'inv-123',
    business_id: 'biz-123',
    email: 'invitee@example.com',
    role: 'editor' as const,
    invited_by: 'user-123',
    token: 'valid-token-123',
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    inviter: {
      id: 'user-123',
      email: 'owner@example.com',
      user_metadata: { full_name: 'Business Owner' },
    },
    business: {
      id: 'biz-123',
      name: 'Test Business',
      slug: 'test-business',
    },
  };

  it('should return invitation details for valid pending invitation', async () => {
    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(mockInvitation);

    const request = createRequest('valid-token-123');
    const response = await GET(request, { params: { token: 'valid-token-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.email).toBe('invitee@example.com');
    expect(data.role).toBe('editor');
    expect(data.business.name).toBe('Test Business');
    expect(data.inviter.email).toBe('owner@example.com');
    expect(teamService.getInvitationByToken).toHaveBeenCalledWith('valid-token-123');
  });

  it('should return 404 for non-existent invitation', async () => {
    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(null);

    const request = createRequest('invalid-token');
    const response = await GET(request, { params: { token: 'invalid-token' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Invitation not found');
  });

  it('should return 410 (Gone) for expired invitation', async () => {
    const expiredInvitation = {
      ...mockInvitation,
      expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
    };

    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(expiredInvitation);

    const request = createRequest('expired-token');
    const response = await GET(request, { params: { token: 'expired-token' } });
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe('Invitation has expired');
  });

  it('should return 410 for accepted invitation', async () => {
    const acceptedInvitation = {
      ...mockInvitation,
      status: 'accepted' as const,
    };

    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(acceptedInvitation);

    const request = createRequest('accepted-token');
    const response = await GET(request, { params: { token: 'accepted-token' } });
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe('Invitation has been accepted');
  });

  it('should return 410 for declined invitation', async () => {
    const declinedInvitation = {
      ...mockInvitation,
      status: 'declined' as const,
    };

    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(declinedInvitation);

    const request = createRequest('declined-token');
    const response = await GET(request, { params: { token: 'declined-token' } });
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe('Invitation has been declined');
  });

  it('should handle service layer errors gracefully', async () => {
    vi.mocked(teamService.getInvitationByToken).mockRejectedValue(
      new Error('Database error')
    );

    const request = createRequest('error-token');
    const response = await GET(request, { params: { token: 'error-token' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to load invitation. Please try again.');
  });

  it('should allow public access (no authentication required)', async () => {
    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(mockInvitation);

    const request = createRequest('public-token');
    const response = await GET(request, { params: { token: 'public-token' } });

    // Should succeed without authentication
    expect(response.status).toBe(200);
  });

  it('should check expiration with millisecond precision', async () => {
    const justExpiredInvitation = {
      ...mockInvitation,
      expires_at: new Date(Date.now() - 1).toISOString(), // 1ms ago
    };

    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(justExpiredInvitation);

    const request = createRequest('just-expired');
    const response = await GET(request, { params: { token: 'just-expired' } });
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe('Invitation has expired');
  });

  it('should accept invitation expiring in the future', async () => {
    const futureInvitation = {
      ...mockInvitation,
      expires_at: new Date(Date.now() + 1000).toISOString(), // 1 second from now
    };

    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(futureInvitation);

    const request = createRequest('future-token');
    const response = await GET(request, { params: { token: 'future-token' } });

    expect(response.status).toBe(200);
  });

  it('should include all invitation details in response', async () => {
    vi.mocked(teamService.getInvitationByToken).mockResolvedValue(mockInvitation);

    const request = createRequest('detailed-token');
    const response = await GET(request, { params: { token: 'detailed-token' } });
    const data = await response.json();

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('role');
    expect(data).toHaveProperty('expires_at');
    expect(data).toHaveProperty('business');
    expect(data).toHaveProperty('inviter');
    expect(data.business).toHaveProperty('name');
    expect(data.business).toHaveProperty('slug');
    expect(data.inviter).toHaveProperty('email');
  });
});
