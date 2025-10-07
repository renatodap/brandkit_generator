/**
 * POST /api/invitations/[token]/decline - Decline invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { declineInvitation } from '@/lib/services/team-service';

/**
 * POST /api/invitations/[token]/decline
 * Decline an invitation (public access)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  try {
    const token = params.token;

    // Decline invitation (no auth required - public action)
    await declineInvitation(token);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Failed to decline invitation', error as Error, { token: params.token });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to decline invitation. Please try again.',
      },
      { status: 400 }
    );
  }
}
