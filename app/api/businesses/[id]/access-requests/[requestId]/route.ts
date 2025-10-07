/**
 * DELETE /api/businesses/[id]/access-requests/[requestId] - Withdraw access request
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { withdrawAccessRequest } from '@/lib/services/team-service';

/**
 * DELETE /api/businesses/[id]/access-requests/[requestId]
 * Withdraw an access request
 */
export async function DELETE(
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

    const requestId = params.requestId;

    // Withdraw request
    await withdrawAccessRequest(requestId, user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Failed to withdraw access request', error as Error, { requestId: params.requestId });
    return NextResponse.json(
      {
        error: 'Failed to withdraw access request. Please try again.',
      },
      { status: 500 }
    );
  }
}
