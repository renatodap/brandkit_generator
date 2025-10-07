/**
 * Check Slug Availability API
 *
 * Allows users to check if a slug is available before creating/updating a business.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/supabase/server';
import { isSlugAvailable } from '@/lib/services/business-service';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/businesses/check-slug?slug=my-business&excludeId=uuid
 * Check if a slug is available for the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Require authentication
    const user = await requireUser();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const excludeId = searchParams.get('excludeId') || undefined;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // Check availability
    const available = await isSlugAvailable(slug, user.id, excludeId);

    return NextResponse.json({ available }, { status: 200 });
  } catch (error: unknown) {
    logger.error('Failed to check slug availability', error as Error, { slug: request.nextUrl.searchParams.get('slug') });

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check slug availability. Please try again.' },
      { status: 500 }
    );
  }
}
