/**
 * API routes for managing business collections
 *
 * GET /api/businesses/[id]/collections - Get all collections linked to business
 * POST /api/businesses/[id]/collections - Link a collection to business
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import {
  getBusinessCollections,
  linkCollectionToBusiness,
} from '@/lib/services/business-collection-service';
import { z } from 'zod';

const linkCollectionSchema = z.object({
  collectionId: z.string().uuid('Invalid collection ID'),
});

/**
 * GET /api/businesses/[id]/collections
 * Get all collections linked to a business
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser();

    const businessId = params.id;

    const collections = await getBusinessCollections(businessId);

    return NextResponse.json({
      success: true,
      data: collections,
    });
  } catch (error) {
    console.error('Failed to fetch business collections:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.message.includes('not found') ? 404 : 500 }
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

/**
 * POST /api/businesses/[id]/collections
 * Link a recall-notebook collection to a business
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const businessId = params.id;

    const body = await request.json();
    const validated = linkCollectionSchema.parse(body);

    const businessCollection = await linkCollectionToBusiness(
      businessId,
      validated.collectionId,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: businessCollection,
      message: 'Collection linked successfully',
    });
  } catch (error) {
    console.error('Failed to link collection:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to link collection',
      },
      { status: 500 }
    );
  }
}
