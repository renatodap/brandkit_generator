/**
 * Tests for Business Invitations API
 * POST /api/businesses/[id]/invitations - Create invitation
 * GET /api/businesses/[id]/invitations - List pending invitations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../route';
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
  createInvitation: vi.fn(),
  getBusinessInvitations: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('POST /api/businesses/[id]/invitations', () => {
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

  const createRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/businesses/biz-123/invitations', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  it('should create invitation successfully with valid data', async () => {
    // Setup mocks
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);

    const mockInvitation = {
      id: 'inv-123',
      business_id: 'biz-123',
      email: 'newmember@example.com',
      role: 'editor' as const,
      invited_by: 'user-123',
      token: 'abc123',
      status: 'pending' as const,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(teamService.createInvitation).mockResolvedValue(mockInvitation);

    // Execute
    const request = createRequest({
      email: 'newmember@example.com',
      role: 'editor',
    });

    const response = await POST(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data).toEqual(mockInvitation);
    expect(teamService.createInvitation).toHaveBeenCalledWith(
      'biz-123',
      'newmember@example.com',
      'editor',
      'user-123'
    );
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);

    const request = createRequest({
      email: 'newmember@example.com',
      role: 'editor',
    });

    const response = await POST(request, { params: { id: 'biz-123' } });
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

    const request = createRequest({
      email: 'newmember@example.com',
      role: 'editor',
    });

    const response = await POST(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('You do not have permission to invite team members');
  });

  it('should validate email format', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);

    const request = createRequest({
      email: 'invalid-email',
      role: 'editor',
    });

    const response = await POST(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
    expect(data.details.email).toBeDefined();
  });

  it('should validate role is one of allowed values', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);

    const request = createRequest({
      email: 'newmember@example.com',
      role: 'owner', // Invalid role
    });

    const response = await POST(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
    expect(data.details.role).toBeDefined();
  });

  it('should accept admin role', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);

    const mockInvitation = {
      id: 'inv-123',
      business_id: 'biz-123',
      email: 'admin@example.com',
      role: 'admin' as const,
      invited_by: 'user-123',
      token: 'abc123',
      status: 'pending' as const,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(teamService.createInvitation).mockResolvedValue(mockInvitation);

    const request = createRequest({
      email: 'admin@example.com',
      role: 'admin',
    });

    const response = await POST(request, { params: { id: 'biz-123' } });

    expect(response.status).toBe(201);
  });

  it('should accept viewer role', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);

    const mockInvitation = {
      id: 'inv-123',
      business_id: 'biz-123',
      email: 'viewer@example.com',
      role: 'viewer' as const,
      invited_by: 'user-123',
      token: 'abc123',
      status: 'pending' as const,
      expires_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(teamService.createInvitation).mockResolvedValue(mockInvitation);

    const request = createRequest({
      email: 'viewer@example.com',
      role: 'viewer',
    });

    const response = await POST(request, { params: { id: 'biz-123' } });

    expect(response.status).toBe(201);
  });

  it('should handle duplicate invitation error from service', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
    vi.mocked(teamService.createInvitation).mockRejectedValue(
      new Error('An invitation has already been sent to this email')
    );

    const request = createRequest({
      email: 'existing@example.com',
      role: 'editor',
    });

    const response = await POST(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create invitation. Please try again.');
  });

  it('should handle service layer errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
    vi.mocked(teamService.createInvitation).mockRejectedValue(
      new Error('Database error')
    );

    const request = createRequest({
      email: 'newmember@example.com',
      role: 'editor',
    });

    const response = await POST(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create invitation. Please try again.');
  });

  it('should handle missing request body', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/businesses/biz-123/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    // Empty body causes JSON parse error which results in 500 status
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

describe('GET /api/businesses/[id]/invitations', () => {
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
    return new NextRequest('http://localhost:3000/api/businesses/biz-123/invitations', {
      method: 'GET',
    });
  };

  it('should list pending invitations successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);

    const mockInvitations = [
      {
        id: 'inv-1',
        business_id: 'biz-123',
        email: 'user1@example.com',
        role: 'editor' as const,
        invited_by: 'user-123',
        token: 'token1',
        status: 'pending' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        inviter: {
          id: 'user-123',
          email: 'owner@example.com',
          user_metadata: { full_name: 'Owner User' },
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
        role: 'viewer' as const,
        invited_by: 'user-123',
        token: 'token2',
        status: 'pending' as const,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        inviter: {
          id: 'user-123',
          email: 'owner@example.com',
        },
        business: {
          id: 'biz-123',
          name: 'Test Business',
          slug: 'test-business',
        },
      },
    ];

    vi.mocked(teamService.getBusinessInvitations).mockResolvedValue(mockInvitations);

    const request = createRequest();
    const response = await GET(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitations).toHaveLength(2);
    expect(data.invitations[0].email).toBe('user1@example.com');
    expect(teamService.getBusinessInvitations).toHaveBeenCalledWith('biz-123');
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);

    const request = createRequest();
    const response = await GET(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required. Please sign in.');
  });

  it('should reject if user lacks permission', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(false);

    const request = createRequest();
    const response = await GET(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('You do not have permission to view invitations');
  });

  it('should return empty array when no invitations exist', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
    vi.mocked(teamService.getBusinessInvitations).mockResolvedValue([]);

    const request = createRequest();
    const response = await GET(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitations).toEqual([]);
  });

  it('should handle service layer errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(teamService.canManageTeam).mockResolvedValue(true);
    vi.mocked(teamService.getBusinessInvitations).mockRejectedValue(
      new Error('Database error')
    );

    const request = createRequest();
    const response = await GET(request, { params: { id: 'biz-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to load invitations. Please try again.');
  });
});
