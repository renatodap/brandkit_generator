import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/supabase/server';
import { createShareToken } from '@/lib/services/brand-kit-service';
import { createShareTokenSchema } from '@/lib/validations/brand-kit';
import { z } from 'zod';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';

/**
 * POST /api/brand-kits/[id]/share
 * Create a share token for a brand kit
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    const validated = createShareTokenSchema.parse(body);
    const shareToken = await createShareToken(params.id, user.id, validated.expiresInDays);

    if (!shareToken) {
      return NextResponse.json({ error: 'Brand kit not found' }, { status: 404 });
    }

    const shareUrl = `${process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'}/share/${shareToken.token}`;

    return NextResponse.json({
      shareUrl,
      token: shareToken.token,
      expiresAt: shareToken.expires_at,
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten().fieldErrors }, { status: 400 });
    }
    logger.error('Error creating share token', error as Error, { brandKitId: params.id });
    return NextResponse.json({ error: 'Failed to create share link. Please try again.' }, { status: 500 });
  }
}
