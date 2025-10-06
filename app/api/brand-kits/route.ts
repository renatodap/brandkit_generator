import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { createBrandKit, getBrandKits } from '@/lib/services/brand-kit-service';
import { createBrandKitSchema, listBrandKitsQuerySchema } from '@/lib/validations/brand-kit';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const validated = createBrandKitSchema.parse(body);
    const brandKit = await createBrandKit(user.id, validated);

    return NextResponse.json(brandKit, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating brand kit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching brand kits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
