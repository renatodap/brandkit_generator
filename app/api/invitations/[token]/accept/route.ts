/**
 * POST /api/invitations/[token]/accept - Accept invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { acceptInvitation } from '@/lib/services/team-service';

export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
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
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to accept invitation',
      },
      { status: 400 }
    );
  }
}
