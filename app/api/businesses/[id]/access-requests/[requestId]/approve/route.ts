/**
 * POST /api/businesses/[id]/access-requests/[requestId]/approve - Approve access request
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { canManageTeam, approveAccessRequest } from '@/lib/services/team-service';

/**
 * POST /api/businesses/[id]/access-requests/[requestId]/approve
 * Approve an access request (owner/admin only)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; requestId: string } }
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
    const requestId = params.requestId;

    // Check permissions
    const hasPermission = await canManageTeam(user.id, businessId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to approve access requests' },
        { status: 403 }
      );
    }

    // Approve request
    await approveAccessRequest(requestId, user.id);

    // TODO: Send notification to requester
    // await notifyRequesterApproved(requestId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Failed to approve access request', error as Error, { requestId: params.requestId, businessId: params.id });
    return NextResponse.json(
      {
        error: 'Failed to approve access request. Please try again.',
      },
      { status: 500 }
    );
  }
}
