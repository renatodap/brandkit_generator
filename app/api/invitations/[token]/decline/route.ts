/**
 * POST /api/invitations/[token]/decline - Decline invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { declineInvitation } from '@/lib/services/team-service';

export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // Decline invitation (no auth required - public action)
    await declineInvitation(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to decline invitation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to decline invitation',
      },
      { status: 400 }
    );
  }
}
