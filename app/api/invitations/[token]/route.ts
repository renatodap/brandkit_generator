/**
 * Public Invitation API
 *
 * GET /api/invitations/[token] - Get invitation details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvitationByToken } from '@/lib/services/team-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
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
  } catch (error) {
    console.error('Failed to fetch invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}
