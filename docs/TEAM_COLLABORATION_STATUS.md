# Team Collaboration System - Implementation Status

## ✅ Completed

### 1. Design & Planning
- [x] Complete design document (`docs/design/team-collaboration.md`)
- [x] Database schema design with RLS policies
- [x] Permissions matrix defined
- [x] User flows documented

### 2. Database Layer
- [x] Migration SQL file created (`supabase/migrations/team_collaboration.sql`)
- [x] Three new tables: `business_members`, `business_invitations`, `business_access_requests`
- [x] Comprehensive RLS policies for all tables
- [x] Updated RLS policies for `businesses` and `brand_kits` tables
- [x] Helper functions for permission checks
- [x] Triggers for `updated_at` timestamps

### 3. TypeScript Types
- [x] Complete type definitions (`types/team.ts`)
- [x] Request/Response interfaces for all API operations

### 4. Service Layer
- [x] Full service layer (`lib/services/team-service.ts`) with:
  - Permission checking functions
  - Member management (add, update, remove)
  - Invitation management (create, accept, decline, revoke)
  - Access request management (create, approve, reject, withdraw)

### 5. API Routes
- [x] Permissions: `GET /api/businesses/[id]/permissions`
- [x] Members:
  - `GET /api/businesses/[id]/members` - List members
  - `PATCH /api/businesses/[id]/members/[userId]` - Update role
  - `DELETE /api/businesses/[id]/members/[userId]` - Remove member
- [x] Invitations:
  - `POST /api/businesses/[id]/invitations` - Create invitation
  - `GET /api/businesses/[id]/invitations` - List invitations
  - `DELETE /api/businesses/[id]/invitations/[invitationId]` - Revoke invitation
  - `GET /api/invitations/[token]` - Get invitation details (public)
  - `POST /api/invitations/[token]/accept` - Accept invitation
  - `POST /api/invitations/[token]/decline` - Decline invitation
- [x] Access Requests:
  - `POST /api/businesses/[id]/access-requests` - Create request
  - `GET /api/businesses/[id]/access-requests` - List requests
  - `DELETE /api/businesses/[id]/access-requests/[requestId]` - Withdraw request
  - `POST /api/businesses/[id]/access-requests/[requestId]/approve` - Approve request
  - `POST /api/businesses/[id]/access-requests/[requestId]/reject` - Reject request

### 6. UI Components
- [x] Invitation acceptance page (`app/invitations/[token]/page.tsx`)
  - Beautiful UI with role descriptions
  - Auth state handling
  - Email mismatch warnings
  - Success/error handling

## 🚧 In Progress / Next Steps

### 1. Run Database Migration
**Priority: HIGH - Required before testing**

You need to apply the database migration to your Supabase database. Here are your options:

#### Option A: Supabase Dashboard (Recommended)
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/abtunlcxubymirloekto/sql/new)
2. Copy the entire contents of `supabase/migrations/team_collaboration.sql`
3. Paste into the SQL editor
4. Click "Run" to execute
5. Verify no errors in the output

#### Option B: Migration Script
```bash
npx ts-node scripts/run-migration.ts team_collaboration.sql
```

**⚠️ IMPORTANT**: The migration will:
- Create 3 new tables
- Update RLS policies on existing `businesses` and `brand_kits` tables
- This is safe and non-destructive to existing data

### 2. Build Team Management UI
**Priority: HIGH - Core feature**

Create the team management page for business owners/admins:

#### File: `app/dashboard/[companySlug]/team/page.tsx`

Should include:
- **Members Tab**:
  - List current members with avatars
  - Show owner (non-removable)
  - Role dropdown (admin/editor/viewer)
  - Remove member button
  - "Invite Member" button

- **Invitations Tab**:
  - List pending invitations
  - Show email, role, invited by, expires at
  - "Revoke" button
  - "Resend" button (optional)

- **Access Requests Tab**:
  - List pending requests
  - Show requester info, requested role, message
  - "Approve" and "Reject" buttons

#### Example Structure:
```tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersTab } from '@/components/team/members-tab';
import { InvitationsTab } from '@/components/team/invitations-tab';
import { AccessRequestsTab } from '@/components/team/access-requests-tab';

export default function TeamPage({ params }) {
  return (
    <div className="container py-12">
      <h1>Team Management</h1>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersTab businessId={params.companySlug} />
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationsTab businessId={params.companySlug} />
        </TabsContent>

        <TabsContent value="requests">
          <AccessRequestsTab businessId={params.companySlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3. UI Components to Create

#### `components/team/members-tab.tsx`
- Fetch members via `/api/businesses/[id]/members`
- Display in table or card grid
- Role selector dropdown
- Remove button with confirmation

#### `components/team/invitations-tab.tsx`
- Fetch invitations via `/api/businesses/[id]/invitations`
- Display pending invitations
- Revoke button
- "Invite Member" dialog

#### `components/team/access-requests-tab.tsx`
- Fetch requests via `/api/businesses/[id]/access-requests`
- Display pending requests
- Approve/Reject buttons

#### `components/team/invite-member-dialog.tsx`
- Email input
- Role selector
- Submit to `/api/businesses/[id]/invitations`

### 4. Add Team Navigation Link
Add "Team" link to business navigation menu:

```tsx
// In your business dashboard layout
<nav>
  <Link href={`/dashboard/${businessSlug}`}>Overview</Link>
  <Link href={`/dashboard/${businessSlug}/tools/brand-kit`}>Brand Kit</Link>
  <Link href={`/dashboard/${businessSlug}/team`}>Team</Link> {/* NEW */}
</nav>
```

### 5. Handle Redirect After Sign-In
Update sign-in page to handle invitation redirect:

```tsx
// app/sign-in/page.tsx
const searchParams = useSearchParams();
const redirect = searchParams.get('redirect');

// After successful sign-in:
if (redirect) {
  router.push(redirect);
} else {
  router.push('/dashboard');
}
```

### 6. Email Notifications (Optional, but Recommended)

You'll want to send emails for:
- Invitation sent
- Access request submitted
- Access request approved/rejected

Consider using:
- [Resend](https://resend.com/) (recommended, free tier)
- SendGrid
- AWS SES

Example integration points are marked with `// TODO:` comments in the API routes.

## 📝 Testing Checklist

Once the UI is built and migration is run:

### Invitation Flow
- [ ] Business owner can invite user by email
- [ ] Invitation email is sent (if email configured)
- [ ] Invited user receives invitation link
- [ ] User can view invitation details
- [ ] User can accept invitation (becomes member)
- [ ] User can decline invitation
- [ ] Invitation expires after 7 days
- [ ] Cannot invite existing member
- [ ] Owner can revoke pending invitation

### Access Request Flow
- [ ] Non-member can request access to business
- [ ] Owner/admin receives notification
- [ ] Owner/admin can view pending requests
- [ ] Owner/admin can approve request
- [ ] Owner/admin can reject request
- [ ] Requester is notified of decision
- [ ] User can withdraw their request

### Member Management
- [ ] Owner/admin can view all members
- [ ] Owner/admin can change member roles
- [ ] Owner/admin can remove members
- [ ] Members can leave business (self-remove)
- [ ] Cannot remove business owner
- [ ] Removed members lose access immediately

### Permissions
- [ ] Viewer can view but not edit
- [ ] Editor can edit business and brand kits
- [ ] Admin can manage team
- [ ] Owner has full control
- [ ] RLS policies enforced correctly

## 🎯 Quick Start Guide

### For Developers

1. **Run Migration**
   ```bash
   # Copy SQL from supabase/migrations/team_collaboration.sql
   # Paste into Supabase Dashboard SQL Editor
   # Click "Run"
   ```

2. **Test API Routes**
   ```bash
   npm run dev

   # Test permissions endpoint
   curl http://localhost:3000/api/businesses/[business-id]/permissions

   # Test creating invitation
   curl -X POST http://localhost:3000/api/businesses/[business-id]/invitations \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "role": "editor"}'
   ```

3. **Build Team Management UI**
   - Start with `app/dashboard/[companySlug]/team/page.tsx`
   - Create tab components in `components/team/`
   - Test each flow manually

### For Users

Once complete, users will be able to:

1. **As Business Owner**:
   - Go to Business → Team
   - Click "Invite Member"
   - Enter email and select role
   - Send invitation

2. **As Invited User**:
   - Receive invitation email
   - Click invitation link
   - Sign in or create account
   - Accept invitation
   - Access business

3. **As Team Member**:
   - View business and brand kits
   - Edit based on role (viewer/editor/admin)
   - Leave business if desired

## 📚 Key Files Reference

### Backend
- `types/team.ts` - TypeScript types
- `lib/services/team-service.ts` - Business logic
- `app/api/businesses/[id]/...` - API routes

### Database
- `supabase/migrations/team_collaboration.sql` - Migration
- `docs/design/team-collaboration.md` - Full design

### Frontend (To Create)
- `app/dashboard/[companySlug]/team/page.tsx` - Main team page
- `components/team/members-tab.tsx` - Members list
- `components/team/invitations-tab.tsx` - Invitations list
- `components/team/access-requests-tab.tsx` - Requests list
- `components/team/invite-member-dialog.tsx` - Invite dialog

## 🔐 Security Notes

- All API routes check authentication
- Permissions verified server-side (never trust client)
- RLS policies enforce row-level security
- Invitation tokens are cryptographically secure
- Email verification prevents unauthorized access
- Rate limiting should be added for production

## 🎉 What's Next?

After completing the above:

1. **Email Integration**: Set up Resend or SendGrid
2. **Notifications**: In-app notification system
3. **Activity Log**: Track team actions
4. **Bulk Invitations**: Import from CSV
5. **Custom Roles**: More granular permissions
6. **SSO**: Enterprise single sign-on

## 💡 Tips

- Start with just the Members tab to get familiar
- Use mock data while building UI
- Test with multiple browser profiles (different users)
- Use Supabase Dashboard to verify data changes
- Check browser console for API errors

---

## Questions or Issues?

- Check `docs/design/team-collaboration.md` for detailed design
- Review service layer (`lib/services/team-service.ts`) for available functions
- Test API routes directly before building UI
- Use Supabase logs to debug RLS policy issues
