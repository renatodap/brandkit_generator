/**
 * DELETE /api/businesses/[id]/access-requests/[requestId] - Withdraw access request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withdrawAccessRequest } from '@/lib/services/team-service';

export async function DELETE(
  request: NextRequest,
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

    const requestId = params.requestId;

    // Withdraw request
    await withdrawAccessRequest(requestId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to withdraw access request:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to withdraw access request',
      },
      { status: 500 }
    );
  }
}
