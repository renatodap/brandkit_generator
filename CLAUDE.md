# Production-Level Development Standards

This document defines the mandatory standards for all production-level code in this project. Claude Code must follow these standards for every feature, component, and deployment.

---

## Core Principle
**Production-level means the code is ready to be used by real users, withstand scrutiny from other developers, pass legal requirements, and operate reliably at scale.**

---

## 1. Development Process (TDD + UI Verification)

All features **MUST** follow this 7-step sequence:

### Step 1: Feature Design
- Create `docs/design/{feature}.md` with:
  - User stories
  - Functional requirements
  - Technical approach
  - API contracts
  - Data models
  - Edge cases

### Step 2: Test Design
- Create `docs/testing/{feature}_test.md` with:
  - Test scenarios (happy path, edge cases, errors)
  - Expected inputs/outputs
  - Mock data structures
  - Coverage targets (≥80%)

### Step 3: Code Design
- Define TypeScript interfaces/types first
- Create API contracts
- Define component props
- Plan state management

### Step 4: Test Implementation
- Write tests **BEFORE** implementation
- Unit tests for logic
- Integration tests for API routes
- E2E tests for critical flows
- Accessibility tests

### Step 5: Feature Implementation
- Implement until all tests pass
- Follow code quality standards (Section 2)
- Handle all error cases
- Add proper logging

### Step 6: Validation
- Verify ≥80% code coverage
- Run all linters (ESLint, TypeScript)
- Manual testing across devices
- Performance testing

### Step 7: UI Verification (MANDATORY)
Every single aspect must be accessible and functional through UI:

#### 7a. Verify All Buttons Created
- [ ] Every action has a corresponding button/link
- [ ] No orphaned functionality
- [ ] All buttons are properly labeled

#### 7b. Verify All Pages Accessible
- [ ] All routes are linked from navigation or other pages
- [ ] No dead-end pages
- [ ] Back/forward navigation works
- [ ] Breadcrumbs where appropriate

#### 7c. Verify Button Feedback
- [ ] Loading states (spinners, skeleton screens)
- [ ] Success confirmations (toasts, modals)
- [ ] Error messages (user-friendly, actionable)
- [ ] Disabled states when action unavailable
- [ ] Hover states clearly indicate clickability

#### 7d. Verify Button Visibility
- [ ] Sufficient contrast (WCAG AA: 4.5:1 for text, 3:1 for UI)
- [ ] Clear visual hierarchy (primary, secondary, tertiary)
- [ ] Adequate size (minimum 44x44px touch target)
- [ ] Consistent styling across app
- [ ] Clear focus indicators for keyboard navigation

#### 7e. Verify Style Best Practices
- [ ] Responsive on mobile, tablet, desktop
- [ ] Consistent spacing (use design tokens)
- [ ] Professional typography hierarchy
- [ ] Color system follows brand guidelines
- [ ] Smooth transitions and animations
- [ ] Dark mode support (if applicable)
- [ ] No layout shifts or jank

---

## 2. Code Quality Standards

### TypeScript
```typescript
// ✅ REQUIRED
- Strict mode enabled in tsconfig.json
- No 'any' types (use 'unknown' if necessary)
- Explicit return types on functions
- Interfaces for all data structures
- Zod schemas for runtime validation

// ❌ FORBIDDEN
- Type assertions without validation
- Ignoring TypeScript errors with @ts-ignore
- Implicit any
- Unused variables/imports
```

### File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── (routes)/          # Page routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
├── lib/                   # Utilities and services
│   ├── api/              # API clients
│   ├── utils/            # Helper functions
│   └── validations/      # Zod schemas
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── config/               # Configuration files
└── __tests__/            # Test files (mirror src structure)
```

### Naming Conventions
- **Files**: `kebab-case.tsx`, `PascalCase.tsx` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase` (prefix interfaces with `I` only if necessary)
- **API Routes**: `kebab-case/route.ts`

### Code Organization
```typescript
// Component structure (top to bottom)
1. Imports (external, then internal)
2. Type definitions
3. Constants
4. Main component function
5. Helper functions (or extract to utils/)
6. Exports

// Example:
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { validateInput } from '@/lib/utils';

interface FormProps {
  onSubmit: (data: FormData) => void;
}

const MAX_LENGTH = 100;

export function Form({ onSubmit }: FormProps) {
  // Implementation
}

function helperFunction() {
  // Keep small, or move to lib/utils
}
```

---

## 3. Security Standards

### Environment Variables
```typescript
// ✅ REQUIRED
- All secrets in .env.local (NEVER commit)
- Validate env vars on startup with Zod
- Prefix client vars with NEXT_PUBLIC_
- Document all vars in .env.example
- NEVER expose SUPABASE_SERVICE_KEY or SUPABASE_ACCESS_TOKEN in client-side code

// Example validation:
import { z } from 'zod';

const envSchema = z.object({
  // Supabase (CRITICAL: Protect service keys!)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1), // Safe for client
  SUPABASE_SERVICE_KEY: z.string().min(1), // SERVER-ONLY
  SUPABASE_ACCESS_TOKEN: z.string().min(1).optional(), // For Supabase CLI/migrations

  // AI APIs
  GROQ_API_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1).optional(),

  // App config
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

### Supabase Security Best Practices

**CRITICAL: Three Types of Supabase Keys**

1. **Anon/Public Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - ✅ Safe to use in browser/client-side code
   - Respects Row Level Security (RLS) policies
   - Use with `createBrowserClient()` from `@supabase/ssr`
   - Example: User sign-in, fetching own data

2. **Service Role Key** (`SUPABASE_SERVICE_KEY`)
   - ❌ NEVER use in client-side code
   - Bypasses ALL Row Level Security policies
   - Only use in API routes, server components, server actions
   - Use with `createClient()` from `@supabase/supabase-js` with service key
   - Example: Admin operations, public share links, migrations

3. **Access Token** (`SUPABASE_ACCESS_TOKEN`)
   - For Supabase CLI and management API
   - Used for database migrations, project management
   - Never needed in application code

**Usage Examples:**

```typescript
// ✅ CORRECT: Client-side (respects RLS)
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Uses anon key
  );
}

// ✅ CORRECT: Server-side with user context (respects RLS)
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Still uses anon key
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}

// ✅ CORRECT: Admin operations (bypasses RLS)
// lib/supabase/server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, // Uses service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ❌ WRONG: Service key in client-side code
// app/components/my-component.tsx (CLIENT COMPONENT)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // NEVER DO THIS!
);
```

**Row Level Security (RLS) Policies**

All database tables MUST have RLS enabled with proper policies:

```sql
-- Enable RLS
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own brand kits
CREATE POLICY "Users can view own brand kits"
  ON brand_kits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own brand kits
CREATE POLICY "Users can insert own brand kits"
  ON brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own brand kits
CREATE POLICY "Users can update own brand kits"
  ON brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own brand kits
CREATE POLICY "Users can delete own brand kits"
  ON brand_kits FOR DELETE
  USING (auth.uid() = user_id);

-- Public share access (no user_id check)
CREATE POLICY "Anyone can view shared brand kits"
  ON share_tokens FOR SELECT
  USING (expires_at > NOW());
```

**When to Use Each Client:**

| Scenario | Client Type | Key Used | RLS |
|----------|-------------|----------|-----|
| User viewing own data | Browser/Server Client | Anon Key | ✅ Enforced |
| User creating data | Browser/Server Client | Anon Key | ✅ Enforced |
| Public share page | Admin Client (API route) | Service Key | ❌ Bypassed |
| Background jobs | Admin Client (server) | Service Key | ❌ Bypassed |
| Database migrations | Supabase CLI | Access Token | N/A |

### API Security
```typescript
// ✅ REQUIRED
- Rate limiting on all API routes
- Input validation with Zod
- Sanitize user inputs
- CORS configuration
- Security headers (helmet.js or Next.js config)
- API key rotation strategy

// Example rate limiting:
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

### Data Handling
- Never log sensitive data (passwords, API keys, tokens)
- Sanitize error messages before showing to users
- Use HTTPS only (enforce in production)
- Implement CSRF protection for forms
- All Supabase queries MUST use RLS policies (except admin operations)
- Validate and sanitize ALL user inputs before database operations

### Supabase Database Operations

**Service Layer Pattern (REQUIRED)**

Always use a service layer to centralize database operations:

```typescript
// lib/services/brand-kit-service.ts
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Create a new brand kit (uses RLS - user context required)
 */
export async function createBrandKit(userId: string, data: CreateBrandKitInput) {
  const supabase = await createClient(); // Uses anon key with user session

  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .insert({
      user_id: userId, // RLS will verify this matches auth.uid()
      business_name: data.businessName,
      business_description: data.businessDescription,
      industry: data.industry,
      logo_url: data.logoUrl,
      logo_svg: data.logoSvg,
      colors: data.colors,
      fonts: data.fonts,
      tagline: data.tagline,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create brand kit:', error);
    throw new Error('Failed to create brand kit');
  }

  return brandKit;
}

/**
 * Get brand kit by share token (bypasses RLS - admin operation)
 */
export async function getBrandKitByShareToken(token: string) {
  const supabase = createAdminClient(); // Uses service key to bypass RLS

  // First, verify token is valid and not expired
  const { data: shareToken, error: tokenError } = await supabase
    .from('share_tokens')
    .select('brand_kit_id, expires_at')
    .eq('token', token)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (tokenError || !shareToken) {
    return null;
  }

  // Fetch brand kit with admin client (bypasses user_id check)
  const { data: brandKit, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('id', shareToken.brand_kit_id)
    .single();

  if (error) {
    return null;
  }

  return brandKit;
}

/**
 * Get user's brand kits (uses RLS - automatically filtered by user_id)
 */
export async function getUserBrandKits(userId: string, filters?: {
  isFavorite?: boolean;
  industry?: string;
  limit?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('brand_kits')
    .select('*')
    .eq('user_id', userId) // Redundant with RLS, but explicit
    .order('created_at', { ascending: false });

  if (filters?.isFavorite) {
    query = query.eq('is_favorite', true);
  }

  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch brand kits:', error);
    throw new Error('Failed to fetch brand kits');
  }

  return data;
}
```

**API Route Usage:**

```typescript
// app/api/brand-kits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { createBrandKit } from '@/lib/services/brand-kit-service';
import { z } from 'zod';

const createBrandKitSchema = z.object({
  businessName: z.string().min(1).max(255),
  businessDescription: z.string().optional(),
  industry: z.string().optional(),
  logoUrl: z.string().url(),
  logoSvg: z.string().optional(),
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string().regex(/^#[0-9A-F]{6}$/i),
    usage: z.string(),
  })),
  fonts: z.object({
    primary: z.string(),
    secondary: z.string(),
  }),
  tagline: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser(); // Throws if not authenticated

    // Validate input
    const body = await request.json();
    const validated = createBrandKitSchema.parse(body);

    // Create brand kit (service layer handles RLS)
    const brandKit = await createBrandKit(user.id, validated);

    return NextResponse.json(brandKit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Failed to create brand kit:', error);
    return NextResponse.json(
      { error: 'Failed to create brand kit' },
      { status: 500 }
    );
  }
}
```

**Database Migration Best Practices:**

Use Supabase CLI for migrations (requires `SUPABASE_ACCESS_TOKEN`):

```bash
# Install Supabase CLI
npm install -g supabase

# Login with access token
supabase login

# Link to your project
supabase link --project-ref abtunlcxubymirloekto

# Create a new migration
supabase migration new add_brand_kits_table

# Edit the migration file in supabase/migrations/

# Apply migrations
supabase db push

# Or run SQL directly via CLI
supabase db execute --file ./supabase-schema.sql
```

**Testing Database Operations:**

```typescript
// Mock Supabase client for tests
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
  requireUser: jest.fn(),
}));

describe('createBrandKit', () => {
  it('should create brand kit with RLS', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '123', business_name: 'Test' },
        error: null,
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await createBrandKit('user-123', {
      businessName: 'Test Business',
      logoUrl: 'https://example.com/logo.png',
      colors: [],
      fonts: { primary: 'Inter', secondary: 'Lora' },
    });

    expect(result.id).toBe('123');
    expect(mockSupabase.from).toHaveBeenCalledWith('brand_kits');
  });
});
```

---

## 4. Legal & Compliance

### Required Pages
1. **Privacy Policy** (`/privacy`)
   - Data collection practices
   - Cookie usage
   - Third-party services (API providers)
   - User rights (GDPR, CCPA)
   - Contact information

2. **Terms of Service** (`/terms`)
   - Acceptable use policy
   - Intellectual property rights
   - Disclaimer about AI-generated content
   - Limitation of liability
   - Governing law

3. **Cookie Consent** (if using analytics)
   - Clear opt-in/opt-out
   - Granular controls (necessary, analytics, marketing)

### AI Content Disclaimer
```typescript
// Required on all generated assets
"⚠️ AI-Generated Content: These assets are created by AI and should
be reviewed before commercial use. Check for trademark conflicts and
ensure compliance with your industry regulations."
```

### Attribution
- Credit all AI models used (e.g., "Powered by Hugging Face SDXL")
- Link to open-source libraries in footer
- Include copyright notice: `© 2025 Brand Kit Generator`

---

## 5. UI/UX Standards

### Responsive Design
```css
/* Mobile-first breakpoints */
sm: 640px   /* Tablet */
md: 768px   /* Small laptop */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Accessibility (WCAG 2.1 Level AA)
```typescript
// ✅ REQUIRED
- Semantic HTML (header, nav, main, footer, article)
- ARIA labels for interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus visible indicators
- Alt text for all images
- Color contrast ratios (4.5:1 text, 3:1 UI)
- Screen reader testing

// Example:
<button
  aria-label="Generate brand kit"
  aria-describedby="generation-info"
  disabled={isLoading}
  className="focus:ring-2 focus:ring-offset-2"
>
  {isLoading ? 'Generating...' : 'Generate'}
</button>
```

### Loading States
```typescript
// Required for all async operations:
1. Skeleton screens (page loads)
2. Spinners (button actions)
3. Progress indicators (multi-step processes)
4. Optimistic UI updates where possible

// Example:
{isLoading ? (
  <Skeleton className="h-64 w-full" />
) : (
  <BrandKitResult data={brandKit} />
)}
```

### Error Handling
```typescript
// User-facing errors must be:
- Clear and actionable
- Non-technical language
- Suggest next steps
- Offer retry/fallback options

// Example:
"Unable to generate logo. This might be due to high demand.
Please try again in a few seconds."

// NOT: "Error 500: Internal Server Error"
```

### Feedback Mechanisms
- Success: Green toast notification (3-5 seconds)
- Error: Red toast with retry option (dismissible)
- Info: Blue toast (dismissible)
- Loading: Spinner + descriptive text

---

## 6. Performance Standards

### Metrics (Lighthouse)
- Performance: ≥90
- Accessibility: 100
- Best Practices: 100
- SEO: ≥90

### Optimization Checklist
- [ ] Images: Next.js Image component, WebP format
- [ ] Fonts: Font subsetting, preload critical fonts
- [ ] Code splitting: Dynamic imports for heavy components
- [ ] Bundle size: Monitor with `@next/bundle-analyzer`
- [ ] Caching: Proper cache headers (static assets: 1 year)
- [ ] Lazy loading: Below-the-fold images and components

```typescript
// Example lazy loading:
import dynamic from 'next/dynamic';

const BrandKitResult = dynamic(() => import('@/components/BrandKitResult'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-only if needed
});
```

---

## 7. Testing Standards

### Test Coverage
- Minimum 80% overall coverage
- 100% coverage for critical paths (payment, auth, data generation)
- Unit tests for all utility functions
- Integration tests for API routes
- E2E tests for user flows

### Testing Tools
```json
{
  "unit": "Vitest",
  "integration": "Vitest + MSW (API mocking)",
  "e2e": "Playwright",
  "accessibility": "@axe-core/react"
}
```

### Test Structure
```typescript
// describe blocks for each function/component
// it/test blocks for each scenario

describe('generateBrandKit', () => {
  it('should generate kit with valid inputs', async () => {
    const result = await generateBrandKit(validInput);
    expect(result).toHaveProperty('logo');
    expect(result.colors).toHaveLength(5);
  });

  it('should throw error with invalid business name', async () => {
    await expect(generateBrandKit({ name: '' }))
      .rejects.toThrow('Business name required');
  });

  it('should handle API failures gracefully', async () => {
    // Test error handling
  });
});
```

---

## 8. Documentation Standards

### README.md (Required Sections)
1. Project overview and features
2. Tech stack
3. Prerequisites (Node version, API keys)
4. Installation steps
5. Environment variables (.env.example reference)
6. Development commands
7. Testing commands
8. Deployment guide
9. Contributing guidelines
10. License

### Code Comments
```typescript
// ✅ Good comments (explain WHY)
// Using setTimeout to debounce API calls and prevent rate limiting
setTimeout(fetchData, 300);

// ❌ Bad comments (explain WHAT - code should be self-documenting)
// Loop through array
for (const item of items) { }

// JSDoc for public functions:
/**
 * Generates a brand kit based on business details
 * @param input - Business name, description, and industry
 * @returns Promise resolving to complete brand kit
 * @throws {ValidationError} If input is invalid
 */
export async function generateBrandKit(input: BrandKitInput): Promise<BrandKit> {
  // Implementation
}
```

### API Documentation
- Document all endpoints in `docs/api/README.md`
- Include request/response examples
- List all error codes and meanings
- Provide curl examples

---

## 9. Error Handling & Logging

### Error Handling Levels
```typescript
// 1. Try-catch at API route level
export async function POST(req: Request) {
  try {
    const data = await generateBrandKit(input);
    return Response.json(data);
  } catch (error) {
    console.error('Brand kit generation failed:', error);

    if (error instanceof ValidationError) {
      return Response.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 2. Custom error classes
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 3. Error boundaries in React
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### Logging Strategy
```typescript
// Development: Console logs
// Production: Structured logging (Vercel Analytics, Sentry)

const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }));
  },
  error: (message: string, error: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      ...meta
    }));
  },
};
```

---

## 10. SEO Standards

### Meta Tags (Every Page)
```typescript
// app/layout.tsx or page.tsx
export const metadata: Metadata = {
  title: 'Brand Kit Generator - AI-Powered Brand Identity',
  description: 'Generate professional brand kits in seconds with AI. Get logos, color palettes, fonts, and taglines instantly.',
  keywords: ['brand kit', 'logo generator', 'AI branding', 'color palette'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'Brand Kit Generator',
    description: 'AI-powered brand identity generation',
    url: 'https://yourdomain.com',
    siteName: 'Brand Kit Generator',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brand Kit Generator',
    description: 'AI-powered brand identity generation',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Structured Data (JSON-LD)
```typescript
// For homepage or key pages
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Brand Kit Generator",
  "description": "AI-powered brand identity generator",
  "url": "https://yourdomain.com",
  "applicationCategory": "DesignApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

---

## 11. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Lighthouse scores meet targets
- [ ] No console errors or warnings
- [ ] Environment variables documented
- [ ] .env.example up to date
- [ ] README.md complete
- [ ] Legal pages (privacy, terms) finalized
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (if desired)

### Vercel Deployment
```bash
# Production build test
npm run build
npm run start

# Environment variables in Vercel dashboard:
HUGGINGFACE_API_KEY=xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Deployment settings:
- Build command: npm run build
- Output directory: .next
- Install command: npm install
- Node version: 18.x or 20.x
```

### Post-Deployment
- [ ] Verify all pages load correctly
- [ ] Test all user flows end-to-end
- [ ] Check mobile responsiveness
- [ ] Verify API routes work in production
- [ ] Test error scenarios
- [ ] Monitor error tracking dashboard
- [ ] Set up uptime monitoring

---

## 12. Git & Version Control

### Commit Messages
```
Format: <type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting, missing semicolons
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

Examples:
feat(api): add logo generation endpoint
fix(ui): resolve mobile menu overflow
docs(readme): update installation steps
```

### Branch Strategy
```
main        - Production-ready code
develop     - Integration branch
feature/*   - New features
fix/*       - Bug fixes
hotfix/*    - Urgent production fixes
```

---

## 13. Code Review Checklist

Before merging any PR, verify:
- [ ] All tests pass
- [ ] Code coverage ≥80%
- [ ] No TypeScript errors
- [ ] ESLint/Prettier pass
- [ ] Manual testing completed
- [ ] Accessibility verified
- [ ] Responsive design checked
- [ ] Error handling tested
- [ ] Loading states work
- [ ] Documentation updated
- [ ] No sensitive data exposed
- [ ] Performance acceptable

---

## 14. Continuous Improvement

### Regular Audits
- Weekly: Lighthouse scores
- Monthly: Dependency updates (`npm audit`)
- Quarterly: Security review, performance optimization

### User Feedback Loop
- Error tracking → Identify common failures
- Analytics → Understand user behavior
- User testing → Validate UX decisions

---

## Summary: Production-Level Definition

Code is production-level when:
1. ✅ All 7 TDD steps completed
2. ✅ All UI elements verified (7a-7e)
3. ✅ Security standards met
4. ✅ Legal requirements satisfied
5. ✅ Accessibility compliant (WCAG AA)
6. ✅ Performance targets achieved (Lighthouse ≥90)
7. ✅ Test coverage ≥80%
8. ✅ Documentation complete
9. ✅ Error handling comprehensive
10. ✅ Ready for real users without shame

**If you can proudly share it with the world, it's production-level.**

---

## Quick Reference: Daily Checklist

When implementing any feature:
- [ ] Create design doc
- [ ] Create test plan
- [ ] Write tests first
- [ ] Implement feature
- [ ] Verify all buttons/UI work
- [ ] Check responsive design
- [ ] Test error scenarios
- [ ] Verify accessibility
- [ ] Update documentation
- [ ] Code review (self or peer)
- [ ] Deploy to staging
- [ ] Final production check

---

**Remember: Users don't see your code, they experience your UI. Make every interaction delightful, clear, and professional.**
