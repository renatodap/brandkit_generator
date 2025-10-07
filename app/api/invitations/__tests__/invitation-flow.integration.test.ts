/**
 * Integration Tests for Complete Invitation Flow
 *
 * Tests the full lifecycle:
 * 1. Owner creates invitation
 * 2. Invitation can be viewed by token
 * 3. Invitee accepts or declines
 * 4. Owner can revoke pending invitations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as CreateInvitation, GET as ListInvitations } from '../../businesses/[id]/invitations/route';
import { DELETE as RevokeInvitation } from '../../businesses/[id]/invitations/[invitationId]/route';
import { GET as GetInvitation } from '../[token]/route';
import { POST as AcceptInvitation } from '../[token]/accept/route';
import { POST as DeclineInvitation } from '../[token]/decline/route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/lib/supabase/server';
import * as teamService from '@/lib/services/team-service';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/team-service', () => ({
  canManageTeam: vi.fn(),
  createInvitation: vi.fn(),
  getBusinessInvitations: vi.fn(),
  getInvitationByToken: vi.fn(),
  acceptInvitation: vi.fn(),
  declineInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Invitation Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOwner = {
    id: 'owner-123',
    email: 'owner@example.com',
  };

  const mockInvitee = {
    id: 'invitee-456',
    email: 'invitee@example.com',
  };

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  describe('Complete Accept Flow', () => {
    it('should handle full invitation lifecycle: create -> view -> accept', async () => {
      const mockInvitation = {
        id: 'inv-123',
        business_id: 'biz-123',
        email: 'invitee@example.com',
        role: 'editor' as const,
        invited_by: 'owner-123',
        token: 'unique-token-123',
        status: 'pending' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        inviter: {
          id: 'owner-123',
          email: 'owner@example.com',
          user_metadata: { full_name: 'Business Owner' },
        },
        business: {
          id: 'biz-123',
          name: 'Test Business',
          slug: 'test-business',
        },
      };

      // Step 1: Owner creates invitation
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockOwner },
        error: null,
      });
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
      vi.mocked(teamService.createInvitation).mockResolvedValue(mockInvitation);

      const createRequest = new NextRequest('http://localhost/api/businesses/biz-123/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: 'invitee@example.com', role: 'editor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const createResponse = await CreateInvitation(createRequest, { params: { id: 'biz-123' } });
      const createdInvitation = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createdInvitation.token).toBe('unique-token-123');

      // Step 2: Public user views invitation details
      vi.mocked(teamService.getInvitationByToken).mockResolvedValue(mockInvitation);

      const viewRequest = new NextRequest('http://localhost/api/invitations/unique-token-123', {
        method: 'GET',
      });

      const viewResponse = await GetInvitation(viewRequest, { params: { token: 'unique-token-123' } });
      const viewedInvitation = await viewResponse.json();

      expect(viewResponse.status).toBe(200);
      expect(viewedInvitation.email).toBe('invitee@example.com');
      expect(viewedInvitation.business.name).toBe('Test Business');

      // Step 3: Invitee accepts invitation
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockInvitee },
        error: null,
      });
      vi.mocked(teamService.acceptInvitation).mockResolvedValue(undefined);

      const acceptRequest = new NextRequest('http://localhost/api/invitations/unique-token-123/accept', {
        method: 'POST',
      });

      const acceptResponse = await AcceptInvitation(acceptRequest, { params: { token: 'unique-token-123' } });
      const acceptResult = await acceptResponse.json();

      expect(acceptResponse.status).toBe(200);
      expect(acceptResult.success).toBe(true);
      expect(teamService.acceptInvitation).toHaveBeenCalledWith('unique-token-123', 'invitee-456');
    });
  });

  describe('Complete Decline Flow', () => {
    it('should handle full invitation lifecycle: create -> view -> decline', async () => {
      const mockInvitation = {
        id: 'inv-456',
        business_id: 'biz-123',
        email: 'decline@example.com',
        role: 'viewer' as const,
        invited_by: 'owner-123',
        token: 'decline-token-456',
        status: 'pending' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        inviter: {
          id: 'owner-123',
          email: 'owner@example.com',
        },
        business: {
          id: 'biz-123',
          name: 'Test Business',
          slug: 'test-business',
        },
      };

      // Create invitation
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockOwner },
        error: null,
      });
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
      vi.mocked(teamService.createInvitation).mockResolvedValue(mockInvitation);

      const createRequest = new NextRequest('http://localhost/api/businesses/biz-123/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: 'decline@example.com', role: 'viewer' }),
        headers: { 'Content-Type': 'application/json' },
      });

      await CreateInvitation(createRequest, { params: { id: 'biz-123' } });

      // Decline invitation (no auth required)
      vi.mocked(teamService.declineInvitation).mockResolvedValue(undefined);

      const declineRequest = new NextRequest('http://localhost/api/invitations/decline-token-456/decline', {
        method: 'POST',
      });

      const declineResponse = await DeclineInvitation(declineRequest, { params: { token: 'decline-token-456' } });
      const declineResult = await declineResponse.json();

      expect(declineResponse.status).toBe(200);
      expect(declineResult.success).toBe(true);
    });
  });

  describe('Revoke Flow', () => {
    it('should allow owner to revoke pending invitation', async () => {
      const mockInvitation = {
        id: 'inv-789',
        business_id: 'biz-123',
        email: 'revoke@example.com',
        role: 'editor' as const,
        invited_by: 'owner-123',
        token: 'revoke-token-789',
        status: 'pending' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        inviter: {
          id: 'owner-123',
          email: 'owner@example.com',
        },
        business: {
          id: 'biz-123',
          name: 'Test Business',
          slug: 'test-business',
        },
      };

      // Create invitation
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockOwner },
        error: null,
      });
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
      vi.mocked(teamService.createInvitation).mockResolvedValue(mockInvitation);

      const createRequest = new NextRequest('http://localhost/api/businesses/biz-123/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: 'revoke@example.com', role: 'editor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      await CreateInvitation(createRequest, { params: { id: 'biz-123' } });

      // Owner revokes invitation
      vi.mocked(teamService.revokeInvitation).mockResolvedValue(undefined);

      const revokeRequest = new NextRequest('http://localhost/api/businesses/biz-123/invitations/inv-789', {
        method: 'DELETE',
      });

      const revokeResponse = await RevokeInvitation(revokeRequest, {
        params: { id: 'biz-123', invitationId: 'inv-789' },
      });
      const revokeResult = await revokeResponse.json();

      expect(revokeResponse.status).toBe(200);
      expect(revokeResult.success).toBe(true);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate invitations to same email', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockOwner },
        error: null,
      });
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(teamService.canManageTeam).mockResolvedValue(true);

      // First invitation succeeds
      vi.mocked(teamService.createInvitation).mockResolvedValueOnce({
        id: 'inv-1',
        business_id: 'biz-123',
        email: 'duplicate@example.com',
        role: 'editor' as const,
        invited_by: 'owner-123',
        token: 'token-1',
        status: 'pending' as const,
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const firstRequest = new NextRequest('http://localhost/api/businesses/biz-123/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: 'duplicate@example.com', role: 'editor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const firstResponse = await CreateInvitation(firstRequest, { params: { id: 'biz-123' } });
      expect(firstResponse.status).toBe(201);

      // Second invitation to same email fails
      vi.mocked(teamService.createInvitation).mockRejectedValueOnce(
        new Error('An invitation has already been sent to this email')
      );

      const secondRequest = new NextRequest('http://localhost/api/businesses/biz-123/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: 'duplicate@example.com', role: 'editor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const secondResponse = await CreateInvitation(secondRequest, { params: { id: 'biz-123' } });
      expect(secondResponse.status).toBe(500);
    });
  });

  describe('Expiration Handling', () => {
    it('should reject expired invitations on accept', async () => {
      const expiredInvitation = {
        id: 'inv-expired',
        business_id: 'biz-123',
        email: 'expired@example.com',
        role: 'editor' as const,
        invited_by: 'owner-123',
        token: 'expired-token',
        status: 'pending' as const,
        expires_at: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        inviter: {
          id: 'owner-123',
          email: 'owner@example.com',
        },
        business: {
          id: 'biz-123',
          name: 'Test Business',
          slug: 'test-business',
        },
      };

      // View shows expired
      vi.mocked(teamService.getInvitationByToken).mockResolvedValue(expiredInvitation);

      const viewRequest = new NextRequest('http://localhost/api/invitations/expired-token', {
        method: 'GET',
      });

      const viewResponse = await GetInvitation(viewRequest, { params: { token: 'expired-token' } });
      expect(viewResponse.status).toBe(410); // Gone

      // Accept fails
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockInvitee },
        error: null,
      });
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(teamService.acceptInvitation).mockRejectedValue(
        new Error('Invitation has expired')
      );

      const acceptRequest = new NextRequest('http://localhost/api/invitations/expired-token/accept', {
        method: 'POST',
      });

      const acceptResponse = await AcceptInvitation(acceptRequest, { params: { token: 'expired-token' } });
      expect(acceptResponse.status).toBe(400);
    });
  });

  describe('List Invitations', () => {
    it('should list all pending invitations for a business', async () => {
      const mockInvitations = [
        {
          id: 'inv-1',
          business_id: 'biz-123',
          email: 'user1@example.com',
          role: 'editor' as const,
          invited_by: 'owner-123',
          token: 'token-1',
          status: 'pending' as const,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          inviter: {
            id: 'owner-123',
            email: 'owner@example.com',
          },
          business: {
            id: 'biz-123',
            name: 'Test Business',
            slug: 'test-business',
          },
        },
        {
          id: 'inv-2',
          business_id: 'biz-123',
          email: 'user2@example.com',
          role: 'admin' as const,
          invited_by: 'owner-123',
          token: 'token-2',
          status: 'pending' as const,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          inviter: {
            id: 'owner-123',
            email: 'owner@example.com',
          },
          business: {
            id: 'biz-123',
            name: 'Test Business',
            slug: 'test-business',
          },
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockOwner },
        error: null,
      });
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
      vi.mocked(teamService.getBusinessInvitations).mockResolvedValue(mockInvitations);

      const listRequest = new NextRequest('http://localhost/api/businesses/biz-123/invitations', {
        method: 'GET',
      });

      const listResponse = await ListInvitations(listRequest, { params: { id: 'biz-123' } });
      const result = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(result.invitations).toHaveLength(2);
      expect(result.invitations[0].email).toBe('user1@example.com');
      expect(result.invitations[1].role).toBe('admin');
    });
  });

  describe('Email Mismatch', () => {
    it('should reject accept when user email does not match invitation', async () => {
      const wrongUser = {
        id: 'wrong-user',
        email: 'wrong@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: wrongUser },
        error: null,
      });
      vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(teamService.acceptInvitation).mockRejectedValue(
        new Error('This invitation was sent to a different email address')
      );

      const acceptRequest = new NextRequest('http://localhost/api/invitations/mismatch-token/accept', {
        method: 'POST',
      });

      const response = await AcceptInvitation(acceptRequest, { params: { token: 'mismatch-token' } });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('This invitation was sent to a different email address');
    });
  });
});
