/**
 * POST /api/invitations/[token]/accept - Accept invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { acceptInvitation } from '@/lib/services/team-service';

/**
 * POST /api/invitations/[token]/accept
 * Accept an invitation (requires authentication)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
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
        { error: 'You must be logged in to accept an invitation' },
        { status: 401 }
      );
    }

    const token = params.token;

    // Accept invitation
    await acceptInvitation(token, user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Failed to accept invitation', error as Error, { token: params.token });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to accept invitation. Please try again.',
      },
      { status: 400 }
    );
  }
}
