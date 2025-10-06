# User Accounts & Brand Kit History - Feature Design

**Status**: In Development
**Priority**: High
**Estimated Time**: 5-7 days
**Target Completion**: [Date + 7 days]

---

## 1. Executive Summary

### Problem Statement
Users currently generate brand kits but have no way to:
- Save their generated brand kits for future access
- View history of past generations
- Share brand kits with team members or clients
- Organize and manage multiple brand projects

This creates friction and prevents user retention.

### Solution Overview
Implement a complete user authentication and brand kit management system that allows users to:
1. Create accounts and authenticate securely
2. Automatically save all generated brand kits
3. View, manage, and organize their brand kit history
4. Download any previous brand kit at any time
5. Share brand kits via unique links
6. Mark favorites and delete unwanted kits

### Success Metrics
- **User Retention**: 60%+ users return within 7 days
- **Save Rate**: 90%+ of generated kits saved to accounts
- **Share Rate**: 20%+ of kits shared via links
- **Load Time**: Dashboard loads in <2 seconds
- **Error Rate**: <0.5% auth/database errors

---

## 2. User Stories

### Primary Users (Personas #1-50)

**As a startup founder (#1)**, I want to save my brand kits so that I can iterate on my brand identity over time without losing previous versions.

**As a freelancer (#8)**, I want to create multiple brand kits for different client projects and keep them organized in one place.

**As a small business owner (#2)**, I want to share my brand kit with my team or designer so they can access the assets and guidelines.

**As a content creator (#9)**, I want to quickly access my brand kit whenever I need to create new content without regenerating it.

**As an agency professional (#19)**, I want to save client brand kits and present multiple options during pitch meetings.

### User Flows

#### Flow 1: New User Registration
1. User lands on homepage
2. Clicks "Get Started" or "Sign Up"
3. Completes registration via Clerk (email/password or social login)
4. Redirected to dashboard (empty state)
5. Clicks "Create New Brand Kit"
6. Fills form and generates kit
7. Kit automatically saved to account

#### Flow 2: Returning User
1. User clicks "Sign In"
2. Authenticates via Clerk
3. Redirected to dashboard showing all saved kits
4. Clicks on any kit to view details
5. Downloads or shares kit

#### Flow 3: Guest User (No Account)
1. User generates brand kit without signing in
2. After generation, sees prompt: "Sign up to save this kit"
3. Creates account (kit saved retroactively to session)
4. Kit transferred to new account

---

## 3. Technical Architecture

### Tech Stack Selection

**Authentication**: **Clerk** (chosen)
- ✅ FREE tier: 10,000 Monthly Active Users
- ✅ Pre-built React components
- ✅ Social login (Google, GitHub)
- ✅ Session management
- ✅ User metadata support
- ✅ Excellent Next.js App Router integration

**Database**: **Supabase** (chosen)
- ✅ FREE tier: 500MB storage, 50,000 monthly active users
- ✅ PostgreSQL (relational, ACID compliant)
- ✅ Row Level Security (RLS)
- ✅ Real-time subscriptions (future feature)
- ✅ Auto-generated REST API
- ✅ TypeScript SDK

**Alternative Considered**: Auth0 + MongoDB Atlas
- ❌ Auth0 free tier only 7,000 MAUs
- ❌ MongoDB Atlas 512MB limit
- ✅ Clerk + Supabase better free tiers

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│  - Homepage (public)                                         │
│  - Dashboard (protected) ← Clerk Middleware                  │
│  - Brand Kit View (protected/shareable)                      │
│  - Sign In/Up (Clerk components)                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  /api/brand-kits                                             │
│    - POST /create        (create new kit)                    │
│    - GET /list           (get user's kits)                   │
│    - GET /[id]           (get specific kit)                  │
│    - PATCH /[id]         (update kit - favorite, etc.)       │
│    - DELETE /[id]        (delete kit)                        │
│                                                              │
│  /api/share/[token]      (get shared kit - public)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Clerk Authentication                       │
│  - User management                                           │
│  - Session tokens (JWT)                                      │
│  - User metadata                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                         │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│    - brand_kits (id, user_id, name, data, created_at, ...)  │
│    - share_tokens (id, brand_kit_id, token, expires_at)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### Table: `brand_kits`

```sql
CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,  -- Clerk user ID
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  industry VARCHAR(100),

  -- Brand Kit Data (JSON)
  logo_url TEXT NOT NULL,           -- Stored in Supabase Storage or base64
  colors JSONB NOT NULL,            -- Array of color objects
  fonts JSONB NOT NULL,             -- Primary and secondary font objects
  tagline TEXT,

  -- Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_brand_kits_user_id ON brand_kits(user_id);
CREATE INDEX idx_brand_kits_created_at ON brand_kits(created_at DESC);
CREATE INDEX idx_brand_kits_is_favorite ON brand_kits(user_id, is_favorite);

-- Row Level Security
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand kits"
  ON brand_kits FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::VARCHAR);

CREATE POLICY "Users can insert own brand kits"
  ON brand_kits FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::VARCHAR);

CREATE POLICY "Users can update own brand kits"
  ON brand_kits FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::VARCHAR);

CREATE POLICY "Users can delete own brand kits"
  ON brand_kits FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::VARCHAR);
```

### Table: `share_tokens`

```sql
CREATE TABLE IF NOT EXISTS share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id UUID NOT NULL REFERENCES brand_kits(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,  -- Random secure token
  expires_at TIMESTAMPTZ,               -- NULL = never expires
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_token UNIQUE (token)
);

CREATE INDEX idx_share_tokens_token ON share_tokens(token);
CREATE INDEX idx_share_tokens_brand_kit_id ON share_tokens(brand_kit_id);

-- RLS: Share tokens are publicly readable by token
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read valid share tokens"
  ON share_tokens FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );
```

### Table: `users` (Sync from Clerk)

```sql
CREATE TABLE IF NOT EXISTS users (
  clerk_user_id VARCHAR(255) PRIMARY KEY,  -- From Clerk
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_image_url TEXT,

  -- Metadata
  total_kits_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
```

---

## 5. API Contracts

### POST `/api/brand-kits`
**Description**: Create a new brand kit (called after generation)

**Auth**: Required (Clerk JWT)

**Request Body**:
```typescript
{
  businessName: string;
  businessDescription: string;
  industry: string;
  logoUrl: string;         // Base64 or storage URL
  colors: {
    name: string;
    hex: string;
    usage: string;
  }[];
  fonts: {
    primary: string;
    secondary: string;
  };
  tagline: string;
}
```

**Response** (201 Created):
```typescript
{
  id: string;
  businessName: string;
  createdAt: string;
  logoUrl: string;
  // ... full brand kit data
}
```

**Errors**:
- 401: Unauthorized (no auth token)
- 400: Validation error (missing required fields)
- 500: Database error

---

### GET `/api/brand-kits`
**Description**: Get all brand kits for authenticated user

**Auth**: Required

**Query Params**:
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)
- `favorites_only` (optional, boolean)
- `sort` (optional: "created_at" | "updated_at" | "name", default: "created_at")

**Response** (200 OK):
```typescript
{
  brandKits: Array<{
    id: string;
    businessName: string;
    industry: string;
    logoUrl: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

---

### GET `/api/brand-kits/[id]`
**Description**: Get specific brand kit by ID

**Auth**: Required (must own the kit)

**Response** (200 OK):
```typescript
{
  id: string;
  businessName: string;
  businessDescription: string;
  industry: string;
  logoUrl: string;
  colors: Array<{name: string; hex: string; usage: string}>;
  fonts: {primary: string; secondary: string};
  tagline: string;
  isFavorite: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

**Errors**:
- 404: Brand kit not found
- 403: Forbidden (not owner)

---

### PATCH `/api/brand-kits/[id]`
**Description**: Update brand kit metadata (favorite, name, etc.)

**Auth**: Required

**Request Body** (partial update):
```typescript
{
  isFavorite?: boolean;
  businessName?: string;
}
```

**Response** (200 OK):
```typescript
{
  id: string;
  // ... updated fields
}
```

---

### DELETE `/api/brand-kits/[id]`
**Description**: Delete a brand kit

**Auth**: Required

**Response** (204 No Content)

**Errors**:
- 404: Not found
- 403: Forbidden

---

### POST `/api/brand-kits/[id]/share`
**Description**: Generate shareable link for brand kit

**Auth**: Required

**Request Body**:
```typescript
{
  expiresInDays?: number;  // Optional, null = never expires
}
```

**Response** (201 Created):
```typescript
{
  shareUrl: string;  // "https://app.com/share/abc123xyz"
  token: string;
  expiresAt: string | null;
}
```

---

### GET `/api/share/[token]`
**Description**: Get brand kit by share token (public, no auth)

**Auth**: Not required

**Response** (200 OK):
```typescript
{
  // Same as GET /api/brand-kits/[id] but without user-specific data
  businessName: string;
  logoUrl: string;
  colors: [...];
  fonts: {...};
  tagline: string;
  createdAt: string;
}
```

**Errors**:
- 404: Invalid or expired token

---

## 6. UI/UX Design

### New Pages

#### `/dashboard`
**Layout**: Grid layout with sidebar

**Components**:
- Header with user profile (Clerk UserButton)
- "Create New Brand Kit" CTA button
- Filter/sort controls (All, Favorites, Sort by date/name)
- Grid of brand kit cards (4 columns on desktop, 2 on tablet, 1 on mobile)
- Empty state for new users
- Pagination controls (if >50 kits)

**Brand Kit Card**:
```
┌───────────────────────────────┐
│ [Logo Preview]                │
│                               │
│ Business Name                 │
│ Industry • Created 2 days ago │
│                               │
│ [View] [Download] [⭐]        │
└───────────────────────────────┘
```

#### `/brand-kit/[id]`
**Layout**: Single column, full brand kit display (similar to current results page)

**Additional Features**:
- "Favorite" toggle button
- "Share" button (generates link)
- "Delete" button (with confirmation modal)
- "Download" button
- "Edit" button (future feature - disabled for now)
- Breadcrumb navigation (Dashboard > Brand Kit Name)

#### `/share/[token]`
**Layout**: Public view of brand kit (no auth required)

**Features**:
- View-only brand kit display
- Download button
- Watermark: "Shared by [User Name]"
- CTA: "Create your own brand kit"
- No edit/delete capabilities

---

### Updated Homepage

**Changes**:
- Add "Sign In" button in header (Clerk `SignInButton`)
- Add "Get Started Free" CTA that prompts sign-up
- Keep anonymous generation as option
- After anonymous generation, show modal: "Sign up to save this kit"

---

## 7. Security & Privacy

### Authentication
- **Clerk JWT tokens** for all protected routes
- **Middleware**: Next.js middleware to protect `/dashboard` and `/brand-kit/*`
- **Session management**: Handled by Clerk (auto-refresh)

### Database Security
- **Row Level Security (RLS)**: Users can only access their own brand kits
- **Parameterized queries**: Prevent SQL injection (Supabase client handles this)
- **User ID validation**: Check Clerk user ID matches database user_id

### Data Privacy
- **GDPR Compliance**: Add data export and account deletion features
- **Data retention**: Keep brand kits indefinitely (user can delete manually)
- **Share links**: Optional expiration dates
- **No PII in brand kits**: Only business data, no user personal info

### Rate Limiting
- **API routes**: Reuse existing Upstash rate limiting
- **Generation limit**: 50 brand kits per user per day (prevent abuse)
- **Share link creation**: 100 share links per user per day

---

## 8. Error Scenarios & Handling

### Scenario 1: Database Connection Failure
**Handling**:
- Retry with exponential backoff (3 attempts)
- Show user-friendly error: "Unable to connect to database. Please try again."
- Log error to Sentry
- Graceful degradation: Allow anonymous generation to continue

### Scenario 2: User Deletes Account (Clerk)
**Handling**:
- Clerk webhook triggers deletion
- Cascade delete all brand kits in Supabase
- Clean up share tokens
- No orphaned data

### Scenario 3: Expired Share Link
**Handling**:
- Check `expires_at` timestamp
- Return 404 with message: "This share link has expired"
- Suggest contacting the person who shared it

### Scenario 4: Concurrent Writes (Race Condition)
**Handling**:
- Supabase handles transactions with ACID guarantees
- Use optimistic locking with `updated_at` timestamp
- Retry on conflict

### Scenario 5: Storage Quota Exceeded (500MB Supabase limit)
**Handling**:
- Monitor storage usage
- Compress logo images before storage
- Alert at 80% capacity
- Implement image cleanup for deleted kits
- Upgrade to paid plan if needed

---

## 9. Performance Optimization

### Database Queries
- **Indexes**: On `user_id`, `created_at`, `is_favorite`
- **Query limits**: Default 50, max 100 brand kits per request
- **Pagination**: Offset-based (cursor-based for future optimization)
- **Caching**: Cache user's brand kit list for 5 minutes (React Query)

### Image Handling
- **Logo storage**: Store as base64 in DB for MVP (small size)
- **Future**: Move to Supabase Storage or Cloudinary
- **Compression**: Use sharp.js to compress PNG before saving
- **Lazy loading**: Load logo thumbnails, full images on click

### API Routes
- **Response caching**: Cache GET requests for 60 seconds
- **Parallel requests**: Use `Promise.all()` for bulk operations
- **Debouncing**: Debounce search/filter inputs (300ms)

### Client-Side
- **React Query**: Cache API responses, automatic refetching
- **Optimistic updates**: Update UI immediately, rollback on error
- **Skeleton screens**: Show loading state while fetching

---

## 10. Testing Strategy

### Unit Tests
- `lib/supabase.ts`: Database client initialization
- `lib/auth.ts`: Clerk helper functions
- `lib/api/brand-kits.ts`: CRUD service functions
- Input validation (Zod schemas)

### Integration Tests
- API route tests (mocked database)
- Authentication flow tests (mocked Clerk)
- Database CRUD operations (test database)

### E2E Tests (Playwright)
- User registration → generate kit → save → view dashboard
- User login → view existing kits → download
- Create share link → access as anonymous user
- Delete brand kit → verify removal

### Security Tests
- RLS policy enforcement (try to access other user's kits)
- JWT validation (expired tokens, tampered tokens)
- SQL injection attempts (should be prevented by Supabase)

### Performance Tests
- Dashboard load time with 100 brand kits
- Concurrent user load (100 simultaneous requests)
- Database query performance (<100ms for list queries)

---

## 11. Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- ✅ All buttons and links focusable
- ✅ Tab order logical (top to bottom, left to right)
- ✅ Escape key closes modals
- ✅ Enter key submits forms

### Screen Readers
- ✅ ARIA labels on icon-only buttons ("Favorite", "Delete")
- ✅ ARIA live regions for toast notifications
- ✅ Alt text on logo images
- ✅ Semantic HTML (`<main>`, `<nav>`, `<article>`)

### Visual
- ✅ Color contrast 4.5:1 for text (already met)
- ✅ Focus indicators visible
- ✅ Button size 44x44px minimum
- ✅ Error messages clear and actionable

---

## 12. Deployment Plan

### Phase 1: Setup (Day 1)
1. Create Clerk account and Next.js app
2. Install Clerk SDK: `npm install @clerk/nextjs`
3. Configure environment variables
4. Create Supabase project
5. Install Supabase client: `npm install @supabase/supabase-js`
6. Run database migrations

### Phase 2: Backend (Days 2-3)
1. Implement authentication middleware
2. Create API routes (`/api/brand-kits/*`)
3. Implement database service layer
4. Add error handling and validation
5. Write unit tests

### Phase 3: Frontend (Days 4-5)
1. Build dashboard page
2. Build brand kit view page
3. Add share functionality
4. Integrate with existing generation flow
5. Update homepage with auth buttons

### Phase 4: Testing & Polish (Days 6-7)
1. Write E2E tests
2. Manual QA (all user flows)
3. Accessibility audit
4. Performance optimization
5. Deploy to Vercel
6. Monitor errors (Sentry)

### Environment Variables (Production)
```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx (server-side only)

# Existing
HUGGINGFACE_API_KEY=hf_xxx
NEXT_PUBLIC_SENTRY_DSN=xxx
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## 13. Rollout Strategy

### Soft Launch (Week 1)
- Deploy to production
- Enable for 10% of users (A/B test)
- Monitor error rates, performance
- Collect user feedback

### Full Launch (Week 2)
- Enable for 100% of users
- Announce on homepage banner
- Send email to existing users (if collected)
- Monitor usage metrics

### Post-Launch (Week 3+)
- Analyze retention metrics
- Identify pain points
- Plan next iteration (editing, regeneration)

---

## 14. Success Criteria

### Must-Have (MVP)
- [x] User can sign up and log in
- [x] Brand kits automatically saved to account
- [x] Dashboard shows all saved kits
- [x] User can view and download any past kit
- [x] User can delete kits
- [x] User can favorite kits
- [x] Share links work for public access
- [x] All API routes protected with auth
- [x] RLS policies prevent unauthorized access
- [x] No auth/database errors in production

### Nice-to-Have (Future)
- [ ] Edit brand kit components
- [ ] Regenerate individual components
- [ ] Duplicate brand kits
- [ ] Export multiple kits at once
- [ ] Team collaboration features
- [ ] Usage analytics dashboard

---

## 15. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase free tier limit hit | Low | High | Monitor usage, upgrade to paid if needed ($25/mo) |
| Clerk free tier limit hit | Very Low | High | 10k MAUs is generous, upgrade if needed ($25/mo) |
| Database performance issues | Medium | Medium | Optimize queries, add indexes, implement caching |
| User confusion with auth flow | Low | Medium | Clear UI/UX, onboarding tooltips |
| Data loss during migration | Very Low | Very High | Test migrations thoroughly, backup production data |
| GDPR compliance issues | Low | High | Implement data export/deletion, privacy policy update |

---

## 16. Next Steps After Implementation

### Immediate (Week 2)
1. Add onboarding tooltips for new users
2. Implement search/filter on dashboard
3. Add sorting options (by date, name, industry)
4. Email notifications (kit saved, shared)

### Short-term (Month 2)
1. Component regeneration feature
2. Edit brand kit colors/fonts
3. Duplicate brand kit functionality
4. Export multiple kits as ZIP

### Long-term (Months 3-6)
1. Team/workspace features
2. Brand kit versioning
3. Comments and collaboration
4. Integration with design tools (Figma, Canva)
5. Premium tier (unlimited kits, advanced features)

---

## 17. Documentation Updates Required

### User-Facing
- Update README.md with account features
- Update QUICK_START.md with authentication setup
- Create user guide for dashboard

### Developer-Facing
- Document Clerk setup process
- Document Supabase schema and RLS policies
- Update API documentation with new endpoints
- Add troubleshooting section for auth issues

---

## Conclusion

This feature represents a significant upgrade from MVP to a production-ready SaaS application. It addresses the core user need for persistence and organization while laying the groundwork for future features like collaboration, monetization, and advanced editing.

**Estimated effort**: 5-7 days of focused development
**Expected impact**: 3x increase in user retention, foundation for premium tier
**Technical debt**: Minimal (following best practices throughout)

Ready to implement following TDD methodology (Step 4: Test Design next).
