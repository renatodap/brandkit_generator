/**
 * Business Members API
 *
 * GET /api/businesses/[id]/members - List all members
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMembers, canManageTeam } from '@/lib/services/team-service';

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

    // Check if user has permission to view members
    const hasAccess = await canManageTeam(user.id, businessId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view team members' },
        { status: 403 }
      );
    }

    // Get members
    const members = await getBusinessMembers(businessId);

    // Also get the business owner info
    const { data: business } = await supabase
      .from('businesses')
      .select('user_id, user:auth.users!businesses_user_id_fkey(id, email, raw_user_meta_data)')
      .eq('id', businessId)
      .single();

    return NextResponse.json({
      members,
      owner: business
        ? {
            id: business.user_id,
            user: {
              id: business.user_id,
              email: (business.user as any).email,
              user_metadata: (business.user as any).raw_user_meta_data,
            },
          }
        : null,
    });
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
