/**
 * Team Collaboration Service Layer
 *
 * Handles permission checks, member management, invitations, and access requests
 */

import { createClient } from '@supabase/supabase-js';
import type {
  BusinessMember,
  BusinessInvitation,
  BusinessAccessRequest,
  MemberRole,
  UserBusinessPermission,
  MemberWithUser,
  InvitationWithDetails,
  AccessRequestWithUser,
} from '@/types/team';

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY']!;

// Admin client for operations that bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Permission Checking Functions
 */

export async function getUserRole(
  userId: string,
  businessId: string
): Promise<MemberRole | 'owner' | null> {
  // Check if owner
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('user_id')
    .eq('id', businessId)
    .single();

  if (business?.user_id === userId) {
    return 'owner';
  }

  // Check member role
  const { data: member } = await supabaseAdmin
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .single();

  return member?.role || null;
}

export async function isOwner(userId: string, businessId: string): Promise<boolean> {
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('user_id')
    .eq('id', businessId)
    .single();

  return business?.user_id === userId;
}

export async function canManageTeam(userId: string, businessId: string): Promise<boolean> {
  const role = await getUserRole(userId, businessId);
  return role === 'owner' || role === 'admin';
}

export async function hasPermission(
  userId: string,
  businessId: string,
  action: 'view' | 'edit' | 'manage_team' | 'delete'
): Promise<boolean> {
  const role = await getUserRole(userId, businessId);

  if (!role) return false;

  switch (action) {
    case 'view':
      return true; // All roles can view
    case 'edit':
      return ['owner', 'admin', 'editor'].includes(role);
    case 'manage_team':
      return ['owner', 'admin'].includes(role);
    case 'delete':
      return role === 'owner';
    default:
      return false;
  }
}

export async function getUserBusinessPermissions(
  userId: string,
  businessId: string
): Promise<UserBusinessPermission> {
  const role = await getUserRole(userId, businessId);

  return {
    business_id: businessId,
    user_id: userId,
    role: role || 'viewer',
    can_view: role !== null,
    can_edit: role ? ['owner', 'admin', 'editor'].includes(role) : false,
    can_manage_team: role ? ['owner', 'admin'].includes(role) : false,
    can_delete: role === 'owner',
  };
}

/**
 * Member Management Functions
 */

export async function getBusinessMembers(businessId: string): Promise<MemberWithUser[]> {
  const { data, error } = await supabaseAdmin
    .from('business_members')
    .select(`
      *,
      user:auth.users!business_members_user_id_fkey (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('business_id', businessId)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch business members:', error);
    throw new Error('Failed to fetch business members');
  }

  // Transform the data to match our type
  return (data || []).map((member: any) => ({
    ...member,
    user: {
      id: member.user.id,
      email: member.user.email,
      user_metadata: member.user.raw_user_meta_data,
    },
  }));
}

export async function addMember(
  businessId: string,
  userId: string,
  role: MemberRole,
  invitedBy: string
): Promise<BusinessMember> {
  // Check if user is already a member
  const { data: existing } = await supabaseAdmin
    .from('business_members')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('User is already a member of this business');
  }

  const { data, error } = await supabaseAdmin
    .from('business_members')
    .insert({
      business_id: businessId,
      user_id: userId,
      role,
      invited_by: invitedBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add member:', error);
    throw new Error('Failed to add member to business');
  }

  return data;
}

export async function updateMemberRole(
  businessId: string,
  userId: string,
  newRole: MemberRole
): Promise<BusinessMember> {
  const { data, error } = await supabaseAdmin
    .from('business_members')
    .update({ role: newRole })
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update member role:', error);
    throw new Error('Failed to update member role');
  }

  return data;
}

export async function removeMember(businessId: string, userId: string): Promise<void> {
  // Cannot remove business owner
  const owner = await isOwner(userId, businessId);
  if (owner) {
    throw new Error('Cannot remove business owner');
  }

  const { error } = await supabaseAdmin
    .from('business_members')
    .delete()
    .eq('business_id', businessId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to remove member:', error);
    throw new Error('Failed to remove member from business');
  }
}

/**
 * Invitation Management Functions
 */

export async function createInvitation(
  businessId: string,
  email: string,
  role: MemberRole,
  invitedBy: string
): Promise<BusinessInvitation> {
  // Check if user with this email is already a member
  const { data: existingUser } = await supabaseAdmin
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    const { data: existingMember } = await supabaseAdmin
      .from('business_members')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', existingUser.id)
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this business');
    }
  }

  // Check for pending invitation
  const { data: pendingInvitation } = await supabaseAdmin
    .from('business_invitations')
    .select('id')
    .eq('business_id', businessId)
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (pendingInvitation) {
    throw new Error('An invitation has already been sent to this email');
  }

  // Generate unique token
  const token = generateInvitationToken();

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabaseAdmin
    .from('business_invitations')
    .insert({
      business_id: businessId,
      email,
      role,
      invited_by: invitedBy,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create invitation:', error);
    throw new Error('Failed to create invitation');
  }

  return data;
}

export async function getInvitationByToken(
  token: string
): Promise<InvitationWithDetails | null> {
  const { data, error } = await supabaseAdmin
    .from('business_invitations')
    .select(`
      *,
      inviter:auth.users!business_invitations_invited_by_fkey (
        id,
        email,
        raw_user_meta_data
      ),
      business:businesses!business_invitations_business_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('token', token)
    .single();

  if (error || !data) {
    return null;
  }

  // Type assertion for complex Supabase join query
  const typedData = data as any;

  return {
    id: typedData.id,
    business_id: typedData.business_id,
    email: typedData.email,
    role: typedData.role,
    invited_by: typedData.invited_by,
    token: typedData.token,
    status: typedData.status,
    expires_at: typedData.expires_at,
    created_at: typedData.created_at,
    updated_at: typedData.updated_at,
    inviter: {
      id: typedData.inviter.id,
      email: typedData.inviter.email,
      user_metadata: typedData.inviter.raw_user_meta_data,
    },
    business: {
      id: typedData.business.id,
      name: typedData.business.name,
      slug: typedData.business.slug,
    },
  } as InvitationWithDetails;
}

export async function getBusinessInvitations(
  businessId: string
): Promise<InvitationWithDetails[]> {
  const { data, error } = await supabaseAdmin
    .from('business_invitations')
    .select(`
      *,
      inviter:auth.users!business_invitations_invited_by_fkey (
        id,
        email,
        raw_user_meta_data
      ),
      business:businesses!business_invitations_business_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('business_id', businessId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch invitations:', error);
    throw new Error('Failed to fetch invitations');
  }

  return (data || []).map((inv: any) => ({
    ...inv,
    inviter: {
      id: inv.inviter.id,
      email: inv.inviter.email,
      user_metadata: inv.inviter.raw_user_meta_data,
    },
    business: inv.business,
  }));
}

export async function acceptInvitation(token: string, userId: string): Promise<void> {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Invitation is no longer valid');
  }

  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await supabaseAdmin
      .from('business_invitations')
      .update({ status: 'expired' })
      .eq('token', token);

    throw new Error('Invitation has expired');
  }

  // Get user email to verify it matches
  const { data: user } = await supabaseAdmin
    .from('auth.users')
    .select('email')
    .eq('id', userId)
    .single();

  if (user?.email !== invitation.email) {
    throw new Error('This invitation was sent to a different email address');
  }

  // Add user as member
  await addMember(
    invitation.business_id,
    userId,
    invitation.role,
    invitation.invited_by
  );

  // Mark invitation as accepted
  await supabaseAdmin
    .from('business_invitations')
    .update({ status: 'accepted' })
    .eq('token', token);
}

export async function declineInvitation(token: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('business_invitations')
    .update({ status: 'declined' })
    .eq('token', token);

  if (error) {
    console.error('Failed to decline invitation:', error);
    throw new Error('Failed to decline invitation');
  }
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('business_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    console.error('Failed to revoke invitation:', error);
    throw new Error('Failed to revoke invitation');
  }
}

/**
 * Access Request Management Functions
 */

export async function createAccessRequest(
  businessId: string,
  userId: string,
  requestedRole: MemberRole,
  message?: string
): Promise<BusinessAccessRequest> {
  // Check if user is already a member
  const { data: existingMember } = await supabaseAdmin
    .from('business_members')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .single();

  if (existingMember) {
    throw new Error('You are already a member of this business');
  }

  // Check for pending request
  const { data: pendingRequest } = await supabaseAdmin
    .from('business_access_requests')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (pendingRequest) {
    throw new Error('You already have a pending access request for this business');
  }

  const { data, error } = await supabaseAdmin
    .from('business_access_requests')
    .insert({
      business_id: businessId,
      user_id: userId,
      requested_role: requestedRole,
      message,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create access request:', error);
    throw new Error('Failed to create access request');
  }

  return data;
}

export async function getBusinessAccessRequests(
  businessId: string
): Promise<AccessRequestWithUser[]> {
  const { data, error } = await supabaseAdmin
    .from('business_access_requests')
    .select(`
      *,
      user:auth.users!business_access_requests_user_id_fkey (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq('business_id', businessId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch access requests:', error);
    throw new Error('Failed to fetch access requests');
  }

  return (data || []).map((req: any) => ({
    ...req,
    user: {
      id: req.user.id,
      email: req.user.email,
      user_metadata: req.user.raw_user_meta_data,
    },
  }));
}

export async function approveAccessRequest(
  requestId: string,
  reviewedBy: string
): Promise<void> {
  const { data: request } = await supabaseAdmin
    .from('business_access_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) {
    throw new Error('Access request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('Access request has already been reviewed');
  }

  // Add user as member
  await addMember(
    request.business_id,
    request.user_id,
    request.requested_role,
    reviewedBy
  );

  // Mark request as approved
  await supabaseAdmin
    .from('business_access_requests')
    .update({
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);
}

export async function rejectAccessRequest(
  requestId: string,
  reviewedBy: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('business_access_requests')
    .update({
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('Failed to reject access request:', error);
    throw new Error('Failed to reject access request');
  }
}

export async function withdrawAccessRequest(requestId: string, userId: string): Promise<void> {
  const { data: request } = await supabaseAdmin
    .from('business_access_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();

  if (!request) {
    throw new Error('Access request not found');
  }

  if (request.user_id !== userId) {
    throw new Error('You can only withdraw your own access requests');
  }

  const { error } = await supabaseAdmin
    .from('business_access_requests')
    .delete()
    .eq('id', requestId);

  if (error) {
    console.error('Failed to withdraw access request:', error);
    throw new Error('Failed to withdraw access request');
  }
}

/**
 * Helper Functions
 */

function generateInvitationToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }

  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
