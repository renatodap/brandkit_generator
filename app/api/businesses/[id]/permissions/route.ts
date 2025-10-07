/**
 * GET /api/businesses/[id]/permissions
 *
 * Get current user's permissions for a specific business
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { getUserBusinessPermissions } from '@/lib/services/team-service';

/**
 * GET /api/businesses/[id]/permissions
 * Get current user's permissions for a business
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

    // Get permissions
    const permissions = await getUserBusinessPermissions(user.id, businessId);

    return NextResponse.json(permissions);
  } catch (error: unknown) {
    logger.error('Failed to get permissions', error as Error);
    return NextResponse.json(
      { error: 'Failed to load permissions. Please try again.' },
      { status: 500 }
    );
  }
}
