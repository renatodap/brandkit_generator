import { NextRequest, NextResponse } from 'next/server';
import { getBrandKitByShareToken } from '@/lib/services/brand-kit-service';
import { logger } from '@/lib/logger';

/**
 * GET /api/share/[token]
 * Get shared brand kit by token (public access)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  try {
    const brandKit = await getBrandKitByShareToken(params.token);

    if (!brandKit) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    // Remove user_id from response for privacy
    const { user_id, ...publicData } = brandKit;

    return NextResponse.json(publicData);
  } catch (error: unknown) {
    logger.error('Error fetching shared brand kit', error as Error, { token: params.token });
    return NextResponse.json(
      { error: 'Failed to load shared brand kit. Please try again.' },
      { status: 500 }
    );
  }
}
