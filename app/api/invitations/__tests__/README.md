# Invitations API Test Suite

Comprehensive test coverage for the Business Invitations API.

## Test Files

### 1. Business Invitations Routes (`app/api/businesses/[id]/invitations/__tests__/route.test.ts`)
**Coverage: 15 tests**

Tests for creating and listing invitations:
- ✅ POST `/api/businesses/[id]/invitations` - Create invitation
- ✅ GET `/api/businesses/[id]/invitations` - List pending invitations

**Test Coverage:**
- **Authentication & Authorization:**
  - Requires authentication for all operations
  - Only owners/admins can create invitations
  - Only owners/admins can view invitations

- **Invitation Creation:**
  - Valid invitation creation (admin, editor, viewer roles)
  - Email format validation
  - Role validation (must be admin, editor, or viewer)
  - Duplicate invitation prevention
  - Service layer error handling
  - Missing request body handling

- **Invitation Listing:**
  - Returns all pending invitations
  - Returns empty array when no invitations exist
  - Includes inviter and business details
  - Handles service errors gracefully

### 2. Revoke Invitation Route (`app/api/businesses/[id]/invitations/[invitationId]/__tests__/route.test.ts`)
**Coverage: 7 tests**

Tests for revoking invitations:
- ✅ DELETE `/api/businesses/[id]/invitations/[invitationId]` - Revoke invitation

**Test Coverage:**
- **Authorization:**
  - Requires authentication
  - Only owners/admins can revoke invitations
  - Verifies business ID matches

- **Revocation:**
  - Successfully revokes pending invitation
  - Handles non-existent invitations
  - Handles service layer errors

### 3. Get Invitation by Token (`app/api/invitations/__tests__/get-invitation.test.ts`)
**Coverage: 10 tests**

Tests for public invitation retrieval:
- ✅ GET `/api/invitations/[token]` - Get invitation details (public)

**Test Coverage:**
- **Public Access:**
  - No authentication required
  - Returns invitation details for valid tokens

- **Validation:**
  - Returns 404 for non-existent invitations
  - Returns 410 (Gone) for expired invitations
  - Returns 410 for accepted invitations
  - Returns 410 for declined invitations
  - Millisecond-precision expiration checking

- **Response Format:**
  - Includes all invitation details
  - Includes business information
  - Includes inviter information

### 4. Accept Invitation (`app/api/invitations/__tests__/accept-invitation.test.ts`)
**Coverage: 12 tests**

Tests for accepting invitations:
- ✅ POST `/api/invitations/[token]/accept` - Accept invitation

**Test Coverage:**
- **Authentication:**
  - Requires user to be logged in
  - Passes user ID to service layer

- **Validation:**
  - Checks if invitation exists
  - Checks if invitation has expired
  - Checks if invitation is still valid (status = pending)
  - Verifies user email matches invitation email
  - Prevents accepting if already a member

- **Success Flow:**
  - Creates member record
  - Marks invitation as accepted
  - Supports all role types (admin, editor, viewer)

### 5. Decline Invitation (`app/api/invitations/__tests__/decline-invitation.test.ts`)
**Coverage: 13 tests**

Tests for declining invitations:
- ✅ POST `/api/invitations/[token]/decline` - Decline invitation (public)

**Test Coverage:**
- **Public Access:**
  - No authentication required
  - Anyone with token can decline

- **Validation:**
  - Handles non-existent invitations
  - Handles already declined invitations
  - Handles already accepted invitations
  - Works for expired invitations

- **Error Handling:**
  - Database errors
  - Generic errors with fallback message
  - Service layer error messages

- **Token Handling:**
  - Accepts various token formats
  - Idempotent operations (handles concurrent declines)

### 6. Invitation Flow Integration Tests (`app/api/invitations/__tests__/invitation-flow.integration.test.ts`)
**Coverage: 7 integration tests**

End-to-end flow tests:

**Test Scenarios:**
1. **Complete Accept Flow:**
   - Owner creates invitation
   - Public user views invitation
   - Invitee accepts invitation
   - Member record created

2. **Complete Decline Flow:**
   - Owner creates invitation
   - Invitation declined (no auth required)

3. **Revoke Flow:**
   - Owner creates invitation
   - Owner revokes pending invitation

4. **Duplicate Prevention:**
   - First invitation succeeds
   - Second invitation to same email fails

5. **Expiration Handling:**
   - Expired invitations rejected on view (410)
   - Expired invitations rejected on accept (400)

6. **List Invitations:**
   - Returns all pending invitations
   - Includes complete details

7. **Email Mismatch:**
   - Accept fails when user email doesn't match

## Test Statistics

- **Total Test Files:** 6
- **Total Tests:** 64
- **Estimated Coverage:** ≥95%

## Key Features Tested

### Security
- ✅ Authentication requirements
- ✅ Authorization checks (owner/admin only for management)
- ✅ Public access where appropriate (view, decline)
- ✅ Email verification on accept
- ✅ Business ownership verification

### Business Logic
- ✅ Invitation creation with roles
- ✅ Token-based invitation retrieval
- ✅ Accept/decline flows
- ✅ Invitation revocation
- ✅ Expiration handling
- ✅ Duplicate prevention
- ✅ Status transitions (pending → accepted/declined)

### Error Handling
- ✅ Invalid tokens
- ✅ Expired invitations
- ✅ Already processed invitations
- ✅ Email mismatches
- ✅ Permission errors
- ✅ Database errors
- ✅ Service layer errors

### Data Validation
- ✅ Email format validation
- ✅ Role validation (admin, editor, viewer only)
- ✅ Required fields enforcement
- ✅ Token format handling

## Running Tests

```bash
# Run all invitation tests
npm test -- invitations/__tests__ --run

# Run specific test file
npm test -- get-invitation.test.ts --run

# Run with coverage
npm test -- invitations/__tests__ --coverage

# Run integration tests only
npm test -- invitation-flow.integration.test.ts --run
```

## Mock Strategy

All tests use comprehensive mocking:
- **Supabase Client:** Mocked with `vi.mock('@/lib/supabase/server')`
- **Team Service:** Mocked with `vi.mock('@/lib/services/team-service')`
- **Logger:** Mocked to suppress console output during tests

This ensures:
- Fast test execution (no real database calls)
- Isolated unit testing
- Predictable test outcomes
- No external dependencies

## Coverage Gaps (Future Enhancements)

Potential areas for additional testing:
1. Email sending functionality (currently TODO in code)
2. Rate limiting on invitation creation
3. Bulk invitation operations
4. Invitation expiration background jobs
5. Notification preferences for invitations

## Related Documentation

- API Documentation: `/docs/api/invitations.md`
- Service Layer: `/lib/services/team-service.ts`
- Type Definitions: `/types/team.ts`
