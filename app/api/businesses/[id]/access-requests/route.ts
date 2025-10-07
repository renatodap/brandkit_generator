/**
 * Business Access Requests API
 *
 * POST /api/businesses/[id]/access-requests - Create access request
 * GET /api/businesses/[id]/access-requests - List pending access requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import {
  canManageTeam,
  createAccessRequest,
  getBusinessAccessRequests,
} from '@/lib/services/team-service';

const createAccessRequestSchema = z.object({
  requested_role: z.enum(['editor', 'viewer']),
  message: z.string().max(500).optional(),
});

/**
 * POST /api/businesses/[id]/access-requests
 * Create an access request for a business
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const businessId = params.id;

    // Validate request body
    const body = await request.json();
    const validated = createAccessRequestSchema.parse(body);

    // Create access request
    const accessRequest = await createAccessRequest(
      businessId,
      user.id,
      validated.requested_role,
      validated.message
    );

    // TODO: Send notification to business owner/admins
    // await notifyBusinessOwner(accessRequest);

    return NextResponse.json(accessRequest, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    logger.error('Failed to create access request', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to create access request. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/businesses/[id]/access-requests
 * Get pending access requests for a business (owner/admin only)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
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

    const businessId = params.id;

    // Check permissions (only owner/admin can view)
    const hasPermission = await canManageTeam(user.id, businessId);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to view access requests' },
        { status: 403 }
      );
    }

    // Get access requests
    const requests = await getBusinessAccessRequests(businessId);

    return NextResponse.json({ requests });
  } catch (error: unknown) {
    logger.error('Failed to fetch access requests', error as Error);
    return NextResponse.json(
      { error: 'Failed to load access requests. Please try again.' },
      { status: 500 }
    );
  }
}
