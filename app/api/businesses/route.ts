/**
 * Business API Routes
 *
 * Handles CRUD operations for businesses with proper authentication and validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/supabase/server';
import { createBusiness, getBusinesses, getBusinessesWithBrandKits } from '@/lib/services/business-service';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';
import { createBusinessSchema, listBusinessesSchema } from '@/lib/validations/business';

/**
 * GET /api/businesses
 * List all businesses for authenticated user
 *
 * Query params:
 * - include=brand_kits: Include brand kit data with each business
 * - limit, offset, sort, order, industry: Standard filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Require authentication
    const user = await requireUser();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeBrandKits = searchParams.get('include') === 'brand_kits';

    const queryParams = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sort: (searchParams.get('sort') || 'created_at') as 'name' | 'created_at' | 'updated_at',
      order: (searchParams.get('order') || 'desc') as 'asc' | 'desc',
      industry: searchParams.get('industry') || undefined,
    };

    // Validate query parameters
    const validated = listBusinessesSchema.parse(queryParams);

    // Fetch businesses with or without brand kits
    const result = includeBrandKits
      ? await getBusinessesWithBrandKits(user.id, validated)
      : await getBusinesses(user.id, validated);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    // Check authentication error FIRST
    if (error instanceof Error && error.message === 'Unauthorized') {
      logger.debug('Unauthenticated business list request');
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    logger.error('Failed to fetch businesses', error as Error);
    return NextResponse.json(
      { error: 'Failed to load businesses. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/businesses
 * Create a new business
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('POST /api/businesses - Starting request');

    // Require authentication
    const user = await requireUser();
    logger.info('User authenticated', { userId: user.id });

    // Parse and validate request body
    const body = await request.json();
    logger.info('Request body received', { name: body.name, slug: body.slug });

    const validated = createBusinessSchema.parse(body);
    logger.info('Validation passed');

    // Create business
    const business = await createBusiness(user.id, validated);
    logger.info('Business created', { businessId: business.id, userId: user.id });

    return NextResponse.json(business, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error in POST /api/businesses', error as Error);

    if (error instanceof z.ZodError) {
      logger.error('Validation error', error as Error, { details: error.flatten().fieldErrors });
      return NextResponse.json(
        { error: 'Invalid input', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if it's an authentication error
    if (error instanceof Error && error.message === 'Unauthorized') {
      logger.error('Authentication error - user not found', error);
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      logger.error('Duplicate slug error', error);
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Unhandled error', error as Error, { errorMessage });

    return NextResponse.json(
      { error: 'Failed to create business. Please try again.' },
      { status: 500 }
    );
  }
}
