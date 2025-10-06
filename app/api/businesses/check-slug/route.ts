/**
 * Check Slug Availability API
 *
 * Allows users to check if a slug is available before creating/updating a business.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { isSlugAvailable } from '@/lib/services/business-service';

/**
 * GET /api/businesses/check-slug?slug=my-business&excludeId=uuid
 * Check if a slug is available for the authenticated user
 */
export async function GET(request: NextRequest) {
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
  } catch (error) {
    console.error('Failed to check slug availability:', error);
    return NextResponse.json(
      { error: 'Failed to check slug availability' },
      { status: 500 }
    );
  }
}
