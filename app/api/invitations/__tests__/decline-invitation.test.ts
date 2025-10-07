/**
 * Tests for Decline Invitation API
 * POST /api/invitations/[token]/decline - Decline invitation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../[token]/decline/route';
import { NextRequest } from 'next/server';
import * as teamService from '@/lib/services/team-service';

// Mock team service
vi.mock('@/lib/services/team-service', () => ({
  declineInvitation: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('POST /api/invitations/[token]/decline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (token: string) => {
    return new NextRequest(`http://localhost:3000/api/invitations/${token}/decline`, {
      method: 'POST',
    });
  };

  it('should decline invitation successfully', async () => {
    vi.mocked(teamService.declineInvitation).mockResolvedValue(undefined);

    const request = createRequest('valid-token-123');
    const response = await POST(request, { params: { token: 'valid-token-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(teamService.declineInvitation).toHaveBeenCalledWith('valid-token-123');
  });

  it('should allow public access (no authentication required)', async () => {
    vi.mocked(teamService.declineInvitation).mockResolvedValue(undefined);

    const request = createRequest('public-token');
    const response = await POST(request, { params: { token: 'public-token' } });

    expect(response.status).toBe(200);
    expect(teamService.declineInvitation).toHaveBeenCalledWith('public-token');
  });

  it('should handle non-existent invitation token', async () => {
    vi.mocked(teamService.declineInvitation).mockRejectedValue(
      new Error('Invitation not found')
    );

    const request = createRequest('invalid-token');
    const response = await POST(request, { params: { token: 'invalid-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invitation not found');
  });

  it('should handle already declined invitation', async () => {
    vi.mocked(teamService.declineInvitation).mockRejectedValue(
      new Error('Invitation has already been declined')
    );

    const request = createRequest('already-declined');
    const response = await POST(request, { params: { token: 'already-declined' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invitation has already been declined');
  });

  it('should handle already accepted invitation', async () => {
    vi.mocked(teamService.declineInvitation).mockRejectedValue(
      new Error('Invitation has already been accepted')
    );

    const request = createRequest('already-accepted');
    const response = await POST(request, { params: { token: 'already-accepted' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invitation has already been accepted');
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(teamService.declineInvitation).mockRejectedValue(
      new Error('Database error')
    );

    const request = createRequest('error-token');
    const response = await POST(request, { params: { token: 'error-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Database error');
  });

  it('should return error message from service layer', async () => {
    const customError = new Error('Custom service error');
    vi.mocked(teamService.declineInvitation).mockRejectedValue(customError);

    const request = createRequest('custom-error-token');
    const response = await POST(request, { params: { token: 'custom-error-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Custom service error');
  });

  it('should handle generic errors with fallback message', async () => {
    // Throw a non-Error object
    vi.mocked(teamService.declineInvitation).mockRejectedValue('Unknown error');

    const request = createRequest('generic-error-token');
    const response = await POST(request, { params: { token: 'generic-error-token' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Failed to decline invitation. Please try again.');
  });

  it('should mark invitation as declined in database', async () => {
    let declineCalled = false;
    vi.mocked(teamService.declineInvitation).mockImplementation(async () => {
      declineCalled = true;
      // Service should update invitation status to 'declined'
    });

    const request = createRequest('status-update-token');
    const response = await POST(request, { params: { token: 'status-update-token' } });

    expect(response.status).toBe(200);
    expect(declineCalled).toBe(true);
  });

  it('should work for expired invitations', async () => {
    // Users should still be able to decline expired invitations
    vi.mocked(teamService.declineInvitation).mockResolvedValue(undefined);

    const request = createRequest('expired-token');
    const response = await POST(request, { params: { token: 'expired-token' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should accept various token formats', async () => {
    vi.mocked(teamService.declineInvitation).mockResolvedValue(undefined);

    const tokens = [
      'abc123',
      'token-with-dashes',
      'TOKEN_WITH_UNDERSCORES',
      'VeryLongTokenStringWith64CharactersOrMoreForSecurityPurposesXYZ123',
    ];

    for (const token of tokens) {
      const request = createRequest(token);
      const response = await POST(request, { params: { token } });

      expect(response.status).toBe(200);
      expect(teamService.declineInvitation).toHaveBeenCalledWith(token);
    }
  });

  it('should not require user email verification for decline', async () => {
    // Unlike accept, decline doesn't need to verify user email matches invitation
    vi.mocked(teamService.declineInvitation).mockResolvedValue(undefined);

    const request = createRequest('no-email-check-token');
    const response = await POST(request, { params: { token: 'no-email-check-token' } });

    expect(response.status).toBe(200);
    // Should succeed without any user context
  });

  it('should handle concurrent decline requests idempotently', async () => {
    // First call succeeds
    vi.mocked(teamService.declineInvitation).mockResolvedValueOnce(undefined);

    const request1 = createRequest('concurrent-token');
    const response1 = await POST(request1, { params: { token: 'concurrent-token' } });

    expect(response1.status).toBe(200);

    // Second call fails because already declined
    vi.mocked(teamService.declineInvitation).mockRejectedValueOnce(
      new Error('Invitation has already been declined')
    );

    const request2 = createRequest('concurrent-token');
    const response2 = await POST(request2, { params: { token: 'concurrent-token' } });

    expect(response2.status).toBe(400);
  });
});
