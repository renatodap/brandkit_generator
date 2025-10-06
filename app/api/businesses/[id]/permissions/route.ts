/**
 * GET /api/businesses/[id]/permissions
 *
 * Get current user's permissions for a specific business
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserBusinessPermissions } from '@/lib/services/team-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = params.id;

    // Get permissions
    const permissions = await getUserBusinessPermissions(user.id, businessId);

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Failed to get permissions:', error);
    return NextResponse.json(
      { error: 'Failed to get permissions' },
      { status: 500 }
    );
  }
}
