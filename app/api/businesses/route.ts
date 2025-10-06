/**
 * Business API Routes
 *
 * Handles CRUD operations for businesses with proper authentication and validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/supabase/server';
import { createBusiness, getBusinesses, getBusinessesWithBrandKits } from '@/lib/services/business-service';
import { createBusinessSchema, listBusinessesSchema } from '@/lib/validations/business';

/**
 * GET /api/businesses
 * List all businesses for authenticated user
 *
 * Query params:
 * - include=brand_kits: Include brand kit data with each business
 * - limit, offset, sort, order, industry: Standard filtering
 */
export async function GET(request: NextRequest) {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Failed to fetch businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/businesses
 * Create a new business
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    // Parse and validate request body
    const body = await request.json();
    const validated = createBusinessSchema.parse(body);

    // Create business
    const business = await createBusiness(user.id, validated);

    return NextResponse.json(business, { status: 201 });
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

    console.error('Failed to create business:', error);
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
