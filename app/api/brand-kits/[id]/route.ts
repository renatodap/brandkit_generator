import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/supabase/server';
import { getBrandKitById, updateBrandKit, deleteBrandKit } from '@/lib/services/brand-kit-service';
import { updateBrandKitSchema } from '@/lib/validations/brand-kit';
import { z } from 'zod';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/brand-kits/[id]
 * Get a specific brand kit by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const brandKit = await getBrandKitById(params.id, user.id);

    if (!brandKit) {
      return NextResponse.json({ error: 'Brand kit not found' }, { status: 404 });
    }

    return NextResponse.json(brandKit);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'You do not have access to this brand kit' }, { status: 403 });
    }
    logger.error('Error fetching brand kit', error as Error, { brandKitId: params.id });
    return NextResponse.json({ error: 'Failed to load brand kit. Please try again.' }, { status: 500 });
  }
}

/**
 * PATCH /api/brand-kits/[id]
 * Update a brand kit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = await request.json();

    const validated = updateBrandKitSchema.parse(body);
    const brandKit = await updateBrandKit(params.id, user.id, validated);

    if (!brandKit) {
      return NextResponse.json({ error: 'Brand kit not found' }, { status: 404 });
    }

    return NextResponse.json(brandKit);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten().fieldErrors }, { status: 400 });
    }
    logger.error('Error updating brand kit', error as Error, { brandKitId: params.id });
    return NextResponse.json({ error: 'Failed to update brand kit. Please try again.' }, { status: 500 });
  }
}

/**
 * DELETE /api/brand-kits/[id]
 * Delete a brand kit
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const deleted = await deleteBrandKit(params.id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Brand kit not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
    }
    logger.error('Error deleting brand kit', error as Error, { brandKitId: params.id });
    return NextResponse.json({ error: 'Failed to delete brand kit. Please try again.' }, { status: 500 });
  }
}
