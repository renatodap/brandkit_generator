import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { createShareToken } from '@/lib/services/brand-kit-service';
import { createShareTokenSchema } from '@/lib/validations/brand-kit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    const validated = createShareTokenSchema.parse(body);
    const shareToken = await createShareToken(params.id, user.id, validated.expiresInDays);

    if (!shareToken) {
      return NextResponse.json({ error: 'Brand kit not found' }, { status: 404 });
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareToken.token}`;

    return NextResponse.json({
      shareUrl,
      token: shareToken.token,
      expiresAt: shareToken.expires_at,
    }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating share token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
