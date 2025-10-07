import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/supabase/server';
import { createBrandKit, getBrandKits } from '@/lib/services/brand-kit-service';
import { createBrandKitSchema, listBrandKitsQuerySchema } from '@/lib/validations/brand-kit';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = await request.json();

    const validated = createBrandKitSchema.parse(body);
    const brandKit = await createBrandKit(user.id, validated);

    return NextResponse.json(brandKit, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: 'errors' in error ? error.errors : undefined,
        },
        { status: 400 }
      );
    }
    logger.error('Error creating brand kit', error as Error);
    return NextResponse.json(
      { error: 'Failed to create brand kit. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const query = listBrandKitsQuerySchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      favoritesOnly: searchParams.get('favorites_only'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
    });

    const result = await getBrandKits(user.id, query);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Error fetching brand kits', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch brand kits. Please try again.' },
      { status: 500 }
    );
  }
}
