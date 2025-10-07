/**
 * API routes for managing individual business collection links
 *
 * DELETE /api/businesses/[id]/collections/[collectionId] - Unlink collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { unlinkCollectionFromBusiness } from '@/lib/services/business-collection-service';

/**
 * DELETE /api/businesses/[id]/collections/[collectionId]
 * Unlink a collection from a business
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; collectionId: string } }
) {
  try {
    await requireUser();

    const businessCollectionId = params.collectionId;

    await unlinkCollectionFromBusiness(businessCollectionId);

    return NextResponse.json({
      success: true,
      message: 'Collection unlinked successfully',
    });
  } catch (error) {
    console.error('Failed to unlink collection:', error);

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
        error: 'Failed to unlink collection',
      },
      { status: 500 }
    );
  }
}
