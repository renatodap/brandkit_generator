/**
 * Public Invitation API
 *
 * GET /api/invitations/[token] - Get invitation details
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getInvitationByToken } from '@/lib/services/team-service';

/**
 * GET /api/invitations/[token]
 * Get invitation details by token (public access)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  try {
    const token = params.token;

    // Get invitation details
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 } // Gone
      );
    }

    // Check status
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation has been ${invitation.status}` },
        { status: 410 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error: unknown) {
    logger.error('Failed to fetch invitation', error as Error, { token: params.token });
    return NextResponse.json(
      { error: 'Failed to load invitation. Please try again.' },
      { status: 500 }
    );
  }
}
