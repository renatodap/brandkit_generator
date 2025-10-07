/**
 * API route for fetching collections from recall-notebook
 *
 * GET /api/recall/collections - Get all collections from recall-notebook
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { getRecallServiceForUser } from '@/lib/services/recall-api-key-service';

/**
 * GET /api/recall/collections
 * Fetch all collections from recall-notebook for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    // Get recall service for user
    const recallService = await getRecallServiceForUser(user.id);

    if (!recallService) {
      return NextResponse.json(
        {
          success: false,
          error: 'No recall-notebook API key found. Please connect your recall-notebook account first.',
        },
        { status: 400 }
      );
    }

    // Fetch collections
    const collections = await recallService.getCollections();

    return NextResponse.json({
      success: true,
      data: collections,
    });
  } catch (error) {
    console.error('Failed to fetch recall collections:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch collections',
      },
      { status: 500 }
    );
  }
}
