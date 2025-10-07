/**
 * Individual Business API Routes
 *
 * Handles GET, PATCH, DELETE operations for a specific business.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/supabase/server';
import { getBusinessById, updateBusiness, deleteBusiness } from '@/lib/services/business-service';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';
import { updateBusinessSchema } from '@/lib/validations/business';

/**
 * GET /api/businesses/[id]
 * Get a specific business by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Require authentication
    const user = await requireUser();

    // Await params (Next.js 15 pattern)
    const { id } = await params;

    // Fetch business
    const business = await getBusinessById(id, user.id);

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(business, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }
    logger.error('Failed to fetch business', error as Error);
    return NextResponse.json(
      { error: 'Failed to load business. Please try again.' },
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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Require authentication
    const user = await requireUser();

    // Await params (Next.js 15 pattern)
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validated = updateBusinessSchema.parse(body);

    // Update business
    const business = await updateBusiness(id, user.id, validated);

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(business, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

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

    logger.error('Failed to update business', error as Error);
    return NextResponse.json(
      { error: 'Failed to update business. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/businesses/[id]
 * Delete a business (will cascade delete associated brand kit)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Require authentication
    const user = await requireUser();

    // Await params (Next.js 15 pattern)
    const { id } = await params;

    // Delete business
    const deleted = await deleteBusiness(id, user.id);

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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }
    logger.error('Failed to delete business', error as Error);
    return NextResponse.json(
      { error: 'Failed to delete business. Please try again.' },
      { status: 500 }
    );
  }
}
