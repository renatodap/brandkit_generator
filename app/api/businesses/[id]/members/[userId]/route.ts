/**
 * Business Member Management API
 *
 * PATCH /api/businesses/[id]/members/[userId] - Update member role
 * DELETE /api/businesses/[id]/members/[userId] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  canManageTeam,
  updateMemberRole,
  removeMember,
} from '@/lib/services/team-service';

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
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
    const targetUserId = params.userId;

    // Check permissions
    const hasPermission = await canManageTeam(user.id, businessId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to manage team members' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validated = updateMemberSchema.parse(body);

    // Update member role
    const member = await updateMemberRole(businessId, targetUserId, validated.role);

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Failed to update member:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update member',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
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
    const targetUserId = params.userId;

    // Check if user is removing themselves (members can leave)
    const isSelf = user.id === targetUserId;

    if (!isSelf) {
      // Check permissions for removing others
      const hasPermission = await canManageTeam(user.id, businessId);

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'You do not have permission to remove team members' },
          { status: 403 }
        );
      }
    }

    // Remove member
    await removeMember(businessId, targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove member:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to remove member',
      },
      { status: 500 }
    );
  }
}
