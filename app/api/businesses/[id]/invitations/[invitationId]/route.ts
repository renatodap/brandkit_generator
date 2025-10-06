/**
 * DELETE /api/businesses/[id]/invitations/[invitationId] - Revoke invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canManageTeam, revokeInvitation } from '@/lib/services/team-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  } catch (error) {
    console.error('Failed to revoke invitation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to revoke invitation',
      },
      { status: 500 }
    );
  }
}
