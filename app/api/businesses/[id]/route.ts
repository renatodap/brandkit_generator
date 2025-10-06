/**
 * Individual Business API Routes
 *
 * Handles GET, PATCH, DELETE operations for a specific business.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/supabase/server';
import { getBusinessById, updateBusiness, deleteBusiness } from '@/lib/services/business-service';
import { updateBusinessSchema } from '@/lib/validations/business';

/**
 * GET /api/businesses/[id]
 * Get a specific business by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const user = await requireUser();

    // Fetch business
    const business = await getBusinessById(params.id, user.id);

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(business, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/businesses/[id]
 * Update a business
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const user = await requireUser();

    // Parse and validate request body
    const body = await request.json();
    const validated = updateBusinessSchema.parse(body);

    // Update business
    const business = await updateBusiness(params.id, user.id, validated);

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(business, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error('Failed to update business:', error);
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/businesses/[id]
 * Delete a business (will cascade delete associated brand kit)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const user = await requireUser();

    // Delete business
    const deleted = await deleteBusiness(params.id, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Business deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete business:', error);
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500 }
    );
  }
}
