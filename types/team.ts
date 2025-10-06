/**
 * Team Collaboration Types
 */

export type MemberRole = 'admin' | 'editor' | 'viewer';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // Joined data from auth.users
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface BusinessInvitation {
  id: string;
  business_id: string;
  email: string;
  role: MemberRole;
  invited_by: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  inviter?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  business?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface BusinessAccessRequest {
  id: string;
  business_id: string;
  user_id: string;
  requested_role: MemberRole;
  message: string | null;
  status: AccessRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  reviewer?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface UserBusinessPermission {
  business_id: string;
  user_id: string;
  role: MemberRole | 'owner';
  can_view: boolean;
  can_edit: boolean;
  can_manage_team: boolean;
  can_delete: boolean;
}

// Request/Response types for API

export interface CreateInvitationRequest {
  email: string;
  role: MemberRole;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface CreateAccessRequestRequest {
  business_id: string;
  requested_role: MemberRole;
  message?: string;
}

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}

export interface ReviewAccessRequestRequest {
  action: 'approve' | 'reject';
  message?: string;
}

export interface MemberWithUser extends BusinessMember {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface InvitationWithDetails extends BusinessInvitation {
  inviter: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  business: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AccessRequestWithUser extends BusinessAccessRequest {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}
