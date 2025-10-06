# Team Collaboration System Design

## Overview
Enable multiple users to collaborate on businesses with role-based access control (RBAC).

## User Stories

### Business Owner
- As a business owner, I want to invite team members to collaborate on my business
- As a business owner, I want to assign different roles (admin, editor, viewer) to team members
- As a business owner, I want to review and approve/reject access requests
- As a business owner, I want to remove team members
- As a business owner, I want to transfer ownership of my business

### Team Member
- As a team member, I want to accept invitations to join businesses
- As a team member, I want to request access to a business I know exists
- As a team member, I want to see all businesses I have access to
- As a team member, I want to leave a business I'm a member of

## Design Decision: Business Ownership Model

### Chosen Approach: Business as Entity with Team Members
- Each business has ONE owner (creator)
- Owner can invite other users to collaborate
- Users can be members of multiple businesses
- Clear separation between "account type" (personal/business) and "business entity"

### Why This Approach?
1. ✅ Standard SaaS pattern (GitHub, Slack, Notion)
2. ✅ Clear ownership and permission model
3. ✅ One user can collaborate across multiple businesses
4. ✅ Easier to understand and maintain
5. ✅ Flexible for future features (workspace-level permissions, etc.)

## Database Schema

### New Tables

#### business_members
Tracks active members of a business and their roles.

```sql
CREATE TABLE business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);
```

#### business_invitations
Tracks pending invitations sent by business owners/admins.

```sql
CREATE TABLE business_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### business_access_requests
Tracks access requests from users who want to join a business.

```sql
CREATE TABLE business_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('editor', 'viewer')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id, status)
);
```

### Modified Tables

#### businesses
Add field to track if business has team collaboration enabled.

```sql
ALTER TABLE businesses
ADD COLUMN is_team_enabled BOOLEAN DEFAULT FALSE;
```

## Permissions Matrix

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| View business | ✅ | ✅ | ✅ | ✅ |
| Edit business details | ✅ | ✅ | ✅ | ❌ |
| Generate brand kits | ✅ | ✅ | ✅ | ❌ |
| View brand kits | ✅ | ✅ | ✅ | ✅ |
| Delete brand kits | ✅ | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| Approve access requests | ✅ | ✅ | ❌ | ❌ |
| Delete business | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

## User Flows

### Flow 1: Owner Invites User

1. Owner navigates to business settings → Team tab
2. Clicks "Invite Member" button
3. Enters email address and selects role (admin/editor/viewer)
4. System creates invitation record with unique token (expires in 7 days)
5. Email sent to invitee with invitation link
6. Invitee receives email, clicks link
7. If not logged in: Sign up or log in
8. If logged in: View invitation details with business info
9. Invitee accepts or declines
10. If accepted: User added to business_members table
11. Owner/admins notified of acceptance

### Flow 2: User Requests Access

1. User discovers business (via shared link or search)
2. Navigates to business page (sees read-only view)
3. Clicks "Request Access" button
4. Selects desired role (editor or viewer) and adds optional message
5. System creates access request record
6. Owner/admins receive notification
7. Owner/admin reviews request in Team → Access Requests
8. Approves or rejects with optional message
9. User receives notification of decision
10. If approved: User added to business_members table

### Flow 3: Managing Members

1. Owner/admin navigates to business settings → Team tab
2. Sees list of current members with roles
3. Can change member roles (dropdown)
4. Can remove members (confirm dialog)
5. Changes take effect immediately
6. Affected users notified via email

### Flow 4: Leaving a Business

1. Member navigates to business settings → Team tab
2. Sees "Leave Business" button
3. Clicks button, confirms action
4. Member removed from business_members table
5. Owner/admins notified

## RLS Policies

### businesses table

```sql
-- Select: Users can view businesses they own or are members of
CREATE POLICY "view_own_or_member_businesses"
ON businesses FOR SELECT
USING (
  auth.uid() = owner_id
  OR
  EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = businesses.id
    AND user_id = auth.uid()
  )
);

-- Update: Owner, admins, and editors can update
CREATE POLICY "update_business_with_permission"
ON businesses FOR UPDATE
USING (
  auth.uid() = owner_id
  OR
  EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = businesses.id
    AND user_id = auth.uid()
    AND role IN ('admin', 'editor')
  )
);

-- Delete: Only owner can delete
CREATE POLICY "delete_own_business"
ON businesses FOR DELETE
USING (auth.uid() = owner_id);
```

### business_members table

```sql
-- Select: Members can view other members of their businesses
CREATE POLICY "view_business_members"
ON business_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_members.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
      )
    )
  )
);

-- Insert: Owner and admins can add members
CREATE POLICY "add_members_with_permission"
ON business_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_members.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Update: Owner and admins can update roles
CREATE POLICY "update_members_with_permission"
ON business_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_members.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Delete: Owner, admins, or the member themselves can remove
CREATE POLICY "remove_members_with_permission"
ON business_members FOR DELETE
USING (
  user_id = auth.uid() -- Members can leave
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_members.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);
```

### business_invitations table

```sql
-- Select: Owner, admins, and the invitee can view
CREATE POLICY "view_invitations"
ON business_invitations FOR SELECT
USING (
  invited_by = auth.uid()
  OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Insert: Owner and admins can invite
CREATE POLICY "create_invitations_with_permission"
ON business_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Update: Owner, admins, and invitee can update (for status changes)
CREATE POLICY "update_invitations_with_permission"
ON business_invitations FOR UPDATE
USING (
  invited_by = auth.uid()
  OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Delete: Owner and admins can revoke invitations
CREATE POLICY "revoke_invitations_with_permission"
ON business_invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);
```

### business_access_requests table

```sql
-- Select: Requester, owner, and admins can view
CREATE POLICY "view_access_requests"
ON business_access_requests FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_access_requests.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Insert: Any authenticated user can request access
CREATE POLICY "create_access_request"
ON business_access_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update: Owner and admins can update (for approval/rejection)
CREATE POLICY "update_access_requests_with_permission"
ON business_access_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_access_requests.business_id
    AND (
      b.owner_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM business_members bm
        WHERE bm.business_id = b.id
        AND bm.user_id = auth.uid()
        AND bm.role = 'admin'
      )
    )
  )
);

-- Delete: Requester can withdraw request
CREATE POLICY "delete_own_access_request"
ON business_access_requests FOR DELETE
USING (user_id = auth.uid());
```

## API Routes

### Invitations

- `POST /api/businesses/[id]/invitations` - Create invitation
- `GET /api/businesses/[id]/invitations` - List pending invitations for business
- `DELETE /api/businesses/[id]/invitations/[invitationId]` - Revoke invitation
- `GET /api/invitations/[token]` - Get invitation details (public)
- `POST /api/invitations/[token]/accept` - Accept invitation
- `POST /api/invitations/[token]/decline` - Decline invitation

### Members

- `GET /api/businesses/[id]/members` - List all members
- `PATCH /api/businesses/[id]/members/[userId]` - Update member role
- `DELETE /api/businesses/[id]/members/[userId]` - Remove member

### Access Requests

- `POST /api/businesses/[id]/access-requests` - Create access request
- `GET /api/businesses/[id]/access-requests` - List access requests (owner/admin)
- `POST /api/businesses/[id]/access-requests/[requestId]/approve` - Approve request
- `POST /api/businesses/[id]/access-requests/[requestId]/reject` - Reject request
- `DELETE /api/businesses/[id]/access-requests/[requestId]` - Withdraw request

### Permissions Check

- `GET /api/businesses/[id]/permissions` - Get current user's permissions for business

## UI Components

### Team Management Page
- `/dashboard/[companySlug]/team`
- Tabs: Members | Invitations | Access Requests
- Only visible to owner and admins

### Members Tab
- List of current members with:
  - Avatar/initial
  - Name & email
  - Role (editable dropdown for owner/admin)
  - "Remove" button (confirm dialog)
- "Invite Member" button (opens dialog)
- Badge showing member's own role

### Invitations Tab
- List of pending invitations:
  - Email address
  - Role
  - Invited by
  - Expires at
  - "Revoke" button
- Empty state: "No pending invitations"

### Access Requests Tab
- List of pending requests:
  - User info (name, email)
  - Requested role
  - Message from requester
  - "Approve" and "Reject" buttons
- Empty state: "No pending access requests"

### Invitation Acceptance Page
- `/invitations/[token]`
- Shows business info
- Shows role being offered
- "Accept" and "Decline" buttons
- Handles auth state (redirect to sign-in if needed)

### Request Access Dialog
- Shown on business page for non-members
- Select role (editor/viewer)
- Optional message
- Submit button

## Email Templates

### Invitation Email
```
Subject: You've been invited to join [Business Name] on Persimmon Labs

Hi there,

[Inviter Name] has invited you to join [Business Name] as a [Role].

[Accept Invitation Button]

This invitation expires in 7 days.

If you don't want to accept, you can ignore this email.
```

### Access Request Notification
```
Subject: New access request for [Business Name]

Hi [Owner Name],

[Requester Name] has requested access to [Business Name] as a [Role].

Message: [User's message]

[Review Request Button]
```

### Request Approved Email
```
Subject: Your access request to [Business Name] was approved

Hi [Requester Name],

Great news! Your request to join [Business Name] has been approved.

You now have [Role] access to the business.

[View Business Button]
```

### Request Rejected Email
```
Subject: Your access request to [Business Name]

Hi [Requester Name],

Your request to join [Business Name] was not approved at this time.

[Optional message from reviewer]

You can contact the business owner if you have questions.
```

## Service Layer Functions

### Permission Checking

```typescript
// Check if user has specific permission
async function hasPermission(
  userId: string,
  businessId: string,
  action: 'view' | 'edit' | 'manage_team' | 'delete'
): Promise<boolean>

// Get user's role in business (or null if not member)
async function getUserRole(
  userId: string,
  businessId: string
): Promise<'owner' | 'admin' | 'editor' | 'viewer' | null>

// Check if user is owner
async function isOwner(
  userId: string,
  businessId: string
): Promise<boolean>

// Check if user can manage team (owner or admin)
async function canManageTeam(
  userId: string,
  businessId: string
): Promise<boolean>
```

### Member Management

```typescript
// Add member to business
async function addMember(
  businessId: string,
  userId: string,
  role: 'admin' | 'editor' | 'viewer',
  invitedBy: string
): Promise<void>

// Update member role
async function updateMemberRole(
  businessId: string,
  userId: string,
  newRole: 'admin' | 'editor' | 'viewer'
): Promise<void>

// Remove member
async function removeMember(
  businessId: string,
  userId: string
): Promise<void>

// Get all business members
async function getBusinessMembers(
  businessId: string
): Promise<Member[]>
```

### Invitation Management

```typescript
// Create invitation
async function createInvitation(
  businessId: string,
  email: string,
  role: 'admin' | 'editor' | 'viewer',
  invitedBy: string
): Promise<Invitation>

// Get invitation by token
async function getInvitationByToken(
  token: string
): Promise<Invitation | null>

// Accept invitation
async function acceptInvitation(
  token: string,
  userId: string
): Promise<void>

// Decline invitation
async function declineInvitation(
  token: string
): Promise<void>

// Revoke invitation
async function revokeInvitation(
  invitationId: string
): Promise<void>
```

## Security Considerations

1. **Email Validation**: Validate email format before sending invitations
2. **Token Security**: Use crypto-secure random tokens for invitations
3. **Expiration**: Invitations expire after 7 days
4. **Rate Limiting**: Limit number of invitations per business per day (e.g., 50)
5. **Duplicate Prevention**: Check if user is already a member or has pending invitation
6. **Permission Checks**: Always verify permissions on backend, never trust client
7. **Audit Trail**: Log all team management actions (invitations, role changes, removals)

## Testing Checklist

### Invitations
- [ ] Owner can invite user
- [ ] Admin can invite user
- [ ] Editor cannot invite user
- [ ] Viewer cannot invite user
- [ ] Invitation email sent correctly
- [ ] User can accept invitation
- [ ] User can decline invitation
- [ ] Invitation expires after 7 days
- [ ] Cannot invite existing member
- [ ] Cannot invite with pending invitation
- [ ] Owner can revoke invitation

### Access Requests
- [ ] Non-member can request access
- [ ] Member cannot request access again
- [ ] Owner receives notification
- [ ] Admin receives notification
- [ ] Owner can approve request
- [ ] Admin can approve request
- [ ] Owner can reject request
- [ ] Requester notified of approval
- [ ] Requester notified of rejection
- [ ] User can withdraw request

### Members
- [ ] Owner sees all members
- [ ] Admin sees all members
- [ ] Editor sees all members
- [ ] Viewer sees all members
- [ ] Owner can change member roles
- [ ] Admin can change member roles
- [ ] Owner can remove members
- [ ] Admin can remove members
- [ ] Member can leave business
- [ ] Cannot remove business owner

### Permissions
- [ ] Viewer can view but not edit
- [ ] Editor can edit business and brand kits
- [ ] Admin can manage team
- [ ] Owner has full control
- [ ] Removed member loses access immediately
- [ ] RLS policies enforced correctly

## Future Enhancements

- [ ] Email domain whitelist for automatic approval
- [ ] Custom roles with granular permissions
- [ ] Activity log for team actions
- [ ] Bulk invitation import (CSV)
- [ ] Guest access with limited time
- [ ] Two-factor authentication for sensitive actions
- [ ] SSO integration for business accounts
- [ ] Transfer ownership flow
- [ ] Deactivate members (suspend without removing)
