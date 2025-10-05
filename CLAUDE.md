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

// Example validation:
import { z } from 'zod';

const envSchema = z.object({
  HUGGINGFACE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

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
- Never log sensitive data
- Sanitize error messages before showing to users
- Use HTTPS only (enforce in production)
- Implement CSRF protection for forms

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
