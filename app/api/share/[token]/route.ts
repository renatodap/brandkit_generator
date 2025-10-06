import { NextRequest, NextResponse } from 'next/server';
import { getBrandKitByShareToken } from '@/lib/services/brand-kit-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const brandKit = await getBrandKitByShareToken(params.token);

    if (!brandKit) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    // Remove user_id from response for privacy
    const { user_id, ...publicData } = brandKit;

    return NextResponse.json(publicData);
  } catch (error) {
    console.error('Error fetching shared brand kit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
