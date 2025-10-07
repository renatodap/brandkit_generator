/**
 * DELETE /api/businesses/[id]/invitations/[invitationId] - Revoke invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { canManageTeam, revokeInvitation } from '@/lib/services/team-service';

/**
 * DELETE /api/businesses/[id]/invitations/[invitationId]
 * Revoke an invitation (owner/admin only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const businessId = params.id;
    const invitationId = params.invitationId;

    // Check permissions
    const hasPermission = await canManageTeam(user.id, businessId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to revoke invitations' },
        { status: 403 }
      );
    }

    // Revoke invitation
    await revokeInvitation(invitationId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Failed to revoke invitation', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to revoke invitation. Please try again.',
      },
      { status: 500 }
    );
  }
}
