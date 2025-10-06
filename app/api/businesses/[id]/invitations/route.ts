/**
 * Business Invitations API
 *
 * POST /api/businesses/[id]/invitations - Create invitation
 * GET /api/businesses/[id]/invitations - List pending invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  canManageTeam,
  createInvitation,
  getBusinessInvitations,
} from '@/lib/services/team-service';

const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check permissions
    const hasPermission = await canManageTeam(user.id, businessId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to invite team members' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validated = createInvitationSchema.parse(body);

    // Create invitation
    const invitation = await createInvitation(
      businessId,
      validated.email,
      validated.role,
      user.id
    );

    // TODO: Send invitation email
    // await sendInvitationEmail(invitation);

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Failed to create invitation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create invitation',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check permissions
    const hasPermission = await canManageTeam(user.id, businessId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to view invitations' },
        { status: 403 }
      );
    }

    // Get invitations
    const invitations = await getBusinessInvitations(businessId);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Failed to fetch invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
