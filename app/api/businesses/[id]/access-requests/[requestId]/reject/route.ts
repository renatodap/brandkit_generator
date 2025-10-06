/**
 * POST /api/businesses/[id]/access-requests/[requestId]/reject - Reject access request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canManageTeam, rejectAccessRequest } from '@/lib/services/team-service';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; requestId: string } }
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
    const requestId = params.requestId;

    // Check permissions
    const hasPermission = await canManageTeam(user.id, businessId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to reject access requests' },
        { status: 403 }
      );
    }

    // Reject request
    await rejectAccessRequest(requestId, user.id);

    // TODO: Send notification to requester
    // await notifyRequesterRejected(requestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reject access request:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reject access request',
      },
      { status: 500 }
    );
  }
}
