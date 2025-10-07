/**
 * API route for refreshing collection cache
 *
 * POST /api/businesses/[id]/collections/[collectionId]/refresh - Refresh cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { refreshCollectionCache } from '@/lib/services/business-collection-service';

/**
 * POST /api/businesses/[id]/collections/[collectionId]/refresh
 * Manually refresh the knowledge cache for a collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; collectionId: string } }
) {
  try {
    const user = await requireUser();
    const businessCollectionId = params.collectionId;

    await refreshCollectionCache(businessCollectionId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
    });
  } catch (error) {
    console.error('Failed to refresh cache:', error);

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
        error: 'Failed to refresh cache',
      },
      { status: 500 }
    );
  }
}
