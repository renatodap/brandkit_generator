# User Accounts & Brand Kit History - Test Plan

**Feature**: User Accounts & Brand Kit History
**Test Coverage Target**: ≥80%
**Test Types**: Unit, Integration, E2E, Accessibility, Performance
**Date Created**: 2025-01-05

---

## 1. Test Scenarios Overview

### Happy Path Scenarios
1. ✅ User signs up and creates first brand kit
2. ✅ User logs in and views dashboard
3. ✅ User views specific brand kit details
4. ✅ User favorites a brand kit
5. ✅ User deletes a brand kit
6. ✅ User creates share link and shares brand kit
7. ✅ Anonymous user accesses shared brand kit

### Edge Cases
8. ⚠️ User with 0 brand kits (empty state)
9. ⚠️ User with 100+ brand kits (pagination)
10. ⚠️ Expired share link access
11. ⚠️ User tries to access another user's kit (403)
12. ⚠️ Invalid brand kit ID (404)
13. ⚠️ Network failure during save
14. ⚠️ Concurrent deletion (two tabs)

### Error Scenarios
15. ❌ Database connection failure
16. ❌ Authentication token expired
17. ❌ Invalid authentication token
18. ❌ Supabase RLS policy violation
19. ❌ Rate limit exceeded
20. ❌ Malformed request data

---

## 2. Unit Tests

### `lib/supabase.ts` - Supabase Client

**Test File**: `lib/supabase.test.ts`

```typescript
describe('Supabase Client', () => {
  test('should initialize client with correct config', () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(client.supabaseUrl).toBe(process.env.NEXT_PUBLIC_SUPABASE_URL);
  });

  test('should throw error if SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => getSupabaseClient()).toThrow('Missing Supabase URL');
  });

  test('should throw error if SUPABASE_ANON_KEY is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => getSupabaseClient()).toThrow('Missing Supabase anon key');
  });
});
```

---

### `lib/auth.ts` - Authentication Helpers

**Test File**: `lib/auth.test.ts`

```typescript
import { auth } from '@clerk/nextjs';

describe('Authentication Helpers', () => {
  describe('getCurrentUserId', () => {
    test('should return user ID from Clerk auth', async () => {
      // Mock Clerk auth
      vi.spyOn(auth, 'userId').mockReturnValue('user_123');

      const userId = await getCurrentUserId();
      expect(userId).toBe('user_123');
    });

    test('should return null if not authenticated', async () => {
      vi.spyOn(auth, 'userId').mockReturnValue(null);

      const userId = await getCurrentUserId();
      expect(userId).toBeNull();
    });
  });

  describe('requireAuth', () => {
    test('should return user ID if authenticated', async () => {
      vi.spyOn(auth, 'userId').mockReturnValue('user_123');

      const userId = await requireAuth();
      expect(userId).toBe('user_123');
    });

    test('should throw UnauthorizedError if not authenticated', async () => {
      vi.spyOn(auth, 'userId').mockReturnValue(null);

      await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });
  });
});
```

---

### `lib/services/brand-kit-service.ts` - CRUD Operations

**Test File**: `lib/services/brand-kit-service.test.ts`

```typescript
import { createBrandKit, getBrandKits, deleteBrandKit } from './brand-kit-service';

describe('Brand Kit Service', () => {
  describe('createBrandKit', () => {
    test('should insert brand kit into database', async () => {
      const mockBrandKit = {
        businessName: 'Test Co',
        businessDescription: 'A test company',
        industry: 'tech',
        logoUrl: 'data:image/png;base64,xxx',
        colors: [{ name: 'Primary', hex: '#0066FF', usage: 'main' }],
        fonts: { primary: 'Inter', secondary: 'Source Code Pro' },
        tagline: 'Test tagline',
      };

      const result = await createBrandKit('user_123', mockBrandKit);

      expect(result).toHaveProperty('id');
      expect(result.businessName).toBe('Test Co');
      expect(result.userId).toBe('user_123');
    });

    test('should throw error if required fields missing', async () => {
      const invalidKit = { businessName: 'Test' }; // Missing other fields

      await expect(
        createBrandKit('user_123', invalidKit as any)
      ).rejects.toThrow('Validation error');
    });

    test('should throw error if database insert fails', async () => {
      // Mock Supabase to return error
      vi.spyOn(supabase.from('brand_kits'), 'insert').mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        createBrandKit('user_123', mockBrandKit)
      ).rejects.toThrow('Failed to create brand kit');
    });
  });

  describe('getBrandKits', () => {
    test('should return all brand kits for user', async () => {
      const result = await getBrandKits('user_123');

      expect(result).toBeInstanceOf(Array);
      expect(result.every(kit => kit.userId === 'user_123')).toBe(true);
    });

    test('should filter by favorites if requested', async () => {
      const result = await getBrandKits('user_123', { favoritesOnly: true });

      expect(result.every(kit => kit.isFavorite === true)).toBe(true);
    });

    test('should limit results', async () => {
      const result = await getBrandKits('user_123', { limit: 10 });

      expect(result.length).toBeLessThanOrEqual(10);
    });

    test('should return empty array if no kits', async () => {
      const result = await getBrandKits('user_no_kits');

      expect(result).toEqual([]);
    });
  });

  describe('deleteBrandKit', () => {
    test('should delete brand kit by ID', async () => {
      const kitId = 'kit_123';

      await deleteBrandKit('user_123', kitId);

      const result = await getBrandKitById(kitId);
      expect(result).toBeNull();
    });

    test('should throw error if kit not found', async () => {
      await expect(
        deleteBrandKit('user_123', 'nonexistent_id')
      ).rejects.toThrow('Brand kit not found');
    });

    test('should throw error if user does not own kit', async () => {
      await expect(
        deleteBrandKit('user_456', 'kit_owned_by_123')
      ).rejects.toThrow('Forbidden');
    });
  });
});
```

---

### `lib/validations/brand-kit-validation.ts` - Validation Schemas

**Test File**: `lib/validations/brand-kit-validation.test.ts`

```typescript
import { createBrandKitSchema, updateBrandKitSchema } from './brand-kit-validation';

describe('Brand Kit Validation', () => {
  describe('createBrandKitSchema', () => {
    test('should validate correct brand kit data', () => {
      const validData = {
        businessName: 'Test Company',
        businessDescription: 'A valid description',
        industry: 'tech',
        logoUrl: 'data:image/png;base64,iVBORw0KG...',
        colors: [
          { name: 'Primary', hex: '#0066FF', usage: 'main' },
          { name: 'Secondary', hex: '#FF6B35', usage: 'accent' },
        ],
        fonts: { primary: 'Inter', secondary: 'Roboto' },
        tagline: 'Innovate the future',
      };

      const result = createBrandKitSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject if businessName is missing', () => {
      const invalidData = { /* missing businessName */ };

      const result = createBrandKitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('businessName');
    });

    test('should reject if logoUrl is not valid data URI', () => {
      const invalidData = {
        businessName: 'Test',
        logoUrl: 'not-a-valid-url',
        // ... other required fields
      };

      const result = createBrandKitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject if colors array is empty', () => {
      const invalidData = {
        businessName: 'Test',
        colors: [], // Empty array
        // ... other required fields
      };

      const result = createBrandKitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject if hex color is invalid format', () => {
      const invalidData = {
        businessName: 'Test',
        colors: [{ name: 'Primary', hex: 'not-a-hex', usage: 'main' }],
        // ... other required fields
      };

      const result = createBrandKitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateBrandKitSchema', () => {
    test('should allow partial updates', () => {
      const partialData = { isFavorite: true };

      const result = updateBrandKitSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    test('should validate updated businessName', () => {
      const data = { businessName: 'Updated Name' };

      const result = updateBrandKitSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('should reject invalid fields', () => {
      const data = { invalidField: 'value' };

      const result = updateBrandKitSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
```

---

## 3. Integration Tests

### API Route: `POST /api/brand-kits`

**Test File**: `app/api/brand-kits/route.test.ts`

```typescript
import { POST } from './route';

describe('POST /api/brand-kits', () => {
  test('should create brand kit with valid auth', async () => {
    const mockAuth = vi.fn().mockReturnValue({ userId: 'user_123' });
    vi.mock('@clerk/nextjs', () => ({ auth: mockAuth }));

    const request = new Request('http://localhost:3000/api/brand-kits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Test Co',
        businessDescription: 'Test description',
        industry: 'tech',
        logoUrl: 'data:image/png;base64,xxx',
        colors: [{ name: 'Primary', hex: '#0066FF', usage: 'main' }],
        fonts: { primary: 'Inter', secondary: 'Roboto' },
        tagline: 'Test tagline',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.businessName).toBe('Test Co');
  });

  test('should return 401 if not authenticated', async () => {
    vi.mock('@clerk/nextjs', () => ({ auth: () => ({ userId: null }) }));

    const request = new Request('http://localhost:3000/api/brand-kits', {
      method: 'POST',
      body: JSON.stringify({ /* valid data */ }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  test('should return 400 if request body invalid', async () => {
    vi.mock('@clerk/nextjs', () => ({ auth: () => ({ userId: 'user_123' }) }));

    const request = new Request('http://localhost:3000/api/brand-kits', {
      method: 'POST',
      body: JSON.stringify({ businessName: 'Test' }), // Missing required fields
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  test('should return 500 if database error', async () => {
    vi.mock('@clerk/nextjs', () => ({ auth: () => ({ userId: 'user_123' }) }));

    // Mock database error
    vi.spyOn(brandKitService, 'createBrandKit').mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new Request('http://localhost:3000/api/brand-kits', {
      method: 'POST',
      body: JSON.stringify({ /* valid data */ }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
```

---

### API Route: `GET /api/brand-kits`

```typescript
describe('GET /api/brand-kits', () => {
  test('should return all brand kits for authenticated user', async () => {
    const request = new Request('http://localhost:3000/api/brand-kits');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('brandKits');
    expect(data).toHaveProperty('total');
    expect(data.brandKits).toBeInstanceOf(Array);
  });

  test('should filter by favorites', async () => {
    const request = new Request(
      'http://localhost:3000/api/brand-kits?favorites_only=true'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.brandKits.every(kit => kit.isFavorite)).toBe(true);
  });

  test('should limit results', async () => {
    const request = new Request('http://localhost:3000/api/brand-kits?limit=5');

    const response = await GET(request);
    const data = await response.json();

    expect(data.brandKits.length).toBeLessThanOrEqual(5);
    expect(data.limit).toBe(5);
  });

  test('should return 401 if not authenticated', async () => {
    vi.mock('@clerk/nextjs', () => ({ auth: () => ({ userId: null }) }));

    const request = new Request('http://localhost:3000/api/brand-kits');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
```

---

### API Route: `DELETE /api/brand-kits/[id]`

```typescript
describe('DELETE /api/brand-kits/[id]', () => {
  test('should delete brand kit if user owns it', async () => {
    const kitId = 'existing_kit_id';

    const request = new Request(
      `http://localhost:3000/api/brand-kits/${kitId}`,
      { method: 'DELETE' }
    );

    const response = await DELETE(request, { params: { id: kitId } });

    expect(response.status).toBe(204);
  });

  test('should return 404 if brand kit not found', async () => {
    const request = new Request(
      'http://localhost:3000/api/brand-kits/nonexistent',
      { method: 'DELETE' }
    );

    const response = await DELETE(request, { params: { id: 'nonexistent' } });

    expect(response.status).toBe(404);
  });

  test('should return 403 if user does not own kit', async () => {
    const kitId = 'kit_owned_by_another_user';

    const request = new Request(
      `http://localhost:3000/api/brand-kits/${kitId}`,
      { method: 'DELETE' }
    );

    const response = await DELETE(request, { params: { id: kitId } });

    expect(response.status).toBe(403);
  });
});
```

---

## 4. E2E Tests (Playwright)

### Test File: `e2e/user-accounts.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Accounts Flow', () => {
  test('should sign up, generate kit, and view dashboard', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('http://localhost:3000');

    // 2. Click Sign Up
    await page.click('button:has-text("Sign Up")');

    // 3. Fill Clerk sign up form (adjust selectors based on Clerk UI)
    await page.fill('input[name="emailAddress"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button:has-text("Continue")');

    // 4. Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');

    // 5. Click "Create New Brand Kit"
    await page.click('button:has-text("Create New Brand Kit")');

    // 6. Fill brand kit form
    await page.fill('input[name="businessName"]', 'Test Company');
    await page.fill('textarea[name="businessDescription"]', 'A test description');
    await page.selectOption('select[name="industry"]', 'tech');

    // 7. Submit form
    await page.click('button:has-text("Generate Brand Kit")');

    // 8. Wait for generation (loading state)
    await expect(page.locator('text=Generating')).toBeVisible();

    // 9. Wait for results page
    await page.waitForURL('**/brand-kit/*');

    // 10. Verify brand kit displayed
    await expect(page.locator('h1:has-text("Test Company")')).toBeVisible();
    await expect(page.locator('img[alt*="logo"]')).toBeVisible();

    // 11. Navigate back to dashboard
    await page.click('a:has-text("Dashboard")');

    // 12. Verify brand kit appears in dashboard
    await expect(page.locator('text=Test Company')).toBeVisible();
  });

  test('should favorite a brand kit', async ({ page }) => {
    // Assumes user is logged in and has at least one kit
    await page.goto('http://localhost:3000/dashboard');

    // Click first brand kit
    await page.click('.brand-kit-card:first-child');

    // Click favorite button
    await page.click('button[aria-label="Favorite"]');

    // Verify toast notification
    await expect(page.locator('text=Added to favorites')).toBeVisible();

    // Navigate back to dashboard
    await page.click('a:has-text("Dashboard")');

    // Filter by favorites
    await page.click('button:has-text("Favorites")');

    // Verify kit is in favorites
    await expect(page.locator('.brand-kit-card')).toHaveCount(1);
  });

  test('should delete a brand kit with confirmation', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    const initialCount = await page.locator('.brand-kit-card').count();

    // Click first brand kit
    await page.click('.brand-kit-card:first-child');

    // Click delete button
    await page.click('button[aria-label="Delete"]');

    // Confirm deletion in modal
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await page.click('button:has-text("Delete")');

    // Verify toast notification
    await expect(page.locator('text=Brand kit deleted')).toBeVisible();

    // Verify redirected to dashboard
    await page.waitForURL('**/dashboard');

    // Verify count decreased
    const newCount = await page.locator('.brand-kit-card').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should create and access share link', async ({ page, context }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Click first brand kit
    await page.click('.brand-kit-card:first-child');

    // Click share button
    await page.click('button:has-text("Share")');

    // Wait for share link to be generated
    await expect(page.locator('input[value*="/share/"]')).toBeVisible();

    // Copy share link
    const shareLink = await page.locator('input[value*="/share/"]').inputValue();

    // Open share link in new tab (as anonymous user)
    const newPage = await context.newPage();
    await newPage.goto(shareLink);

    // Verify brand kit is visible without auth
    await expect(newPage.locator('h1')).toBeVisible();
    await expect(newPage.locator('img[alt*="logo"]')).toBeVisible();

    // Verify cannot edit/delete (no buttons)
    await expect(newPage.locator('button:has-text("Delete")')).not.toBeVisible();
  });
});

test.describe('Empty State', () => {
  test('should show empty state for new user', async ({ page }) => {
    // Create new user account
    await page.goto('http://localhost:3000/sign-up');
    // ... sign up flow

    // Dashboard should show empty state
    await expect(page.locator('text=No brand kits yet')).toBeVisible();
    await expect(page.locator('button:has-text("Create Your First")')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should show error if database unavailable', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/brand-kits', route => route.abort());

    await page.goto('http://localhost:3000/dashboard');

    // Verify error message
    await expect(page.locator('text=Unable to load')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should handle expired authentication token', async ({ page }) => {
    // Mock expired token response (401)
    await page.route('**/api/brand-kits', route =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) })
    );

    await page.goto('http://localhost:3000/dashboard');

    // Verify redirect to sign in
    await page.waitForURL('**/sign-in');
  });
});
```

---

## 5. Accessibility Tests

### Test File: `e2e/accessibility.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test('dashboard page should have no violations', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('brand kit view page should have no violations', async ({ page }) => {
    await page.goto('http://localhost:3000/brand-kit/[id]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Focus on first button
    await page.keyboard.press('Tab'); // Focus on second button

    // Verify focus visible
    const focused = await page.locator(':focus');
    await expect(focused).toHaveCSS('outline', /.*solid.*/);
  });

  test('should announce actions to screen readers', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Click favorite button
    await page.click('button[aria-label="Favorite"]');

    // Verify aria-live region updated
    const liveRegion = await page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText('Added to favorites');
  });
});
```

---

## 6. Performance Tests

### Test File: `e2e/performance.spec.ts`

```typescript
test.describe('Performance', () => {
  test('dashboard should load within 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle 100 brand kits efficiently', async ({ page }) => {
    // Seed database with 100 kits
    // ... seeding logic

    const startTime = Date.now();
    await page.goto('http://localhost:3000/dashboard');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3s for large dataset
  });

  test('API response time should be <500ms', async () => {
    const startTime = Date.now();

    const response = await fetch('http://localhost:3000/api/brand-kits', {
      headers: { Authorization: 'Bearer test_token' },
    });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(500);
    expect(response.ok).toBe(true);
  });
});
```

---

## 7. Security Tests

### Test File: `e2e/security.spec.ts`

```typescript
test.describe('Security', () => {
  test('should prevent access to other users brand kits', async ({ page }) => {
    // Log in as user A
    await page.goto('http://localhost:3000/sign-in');
    // ... login flow

    // Try to access user B's brand kit directly
    await page.goto('http://localhost:3000/brand-kit/user_b_kit_id');

    // Verify 403 Forbidden
    await expect(page.locator('text=Forbidden')).toBeVisible();
  });

  test('should reject invalid JWT tokens', async () => {
    const response = await fetch('http://localhost:3000/api/brand-kits', {
      headers: { Authorization: 'Bearer invalid_token_123' },
    });

    expect(response.status).toBe(401);
  });

  test('should prevent SQL injection', async () => {
    const response = await fetch('http://localhost:3000/api/brand-kits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: "'; DROP TABLE brand_kits; --",
        // ... other fields
      }),
    });

    // Should not crash, should sanitize input
    expect(response.status).not.toBe(500);
  });

  test('should enforce RLS policies in Supabase', async () => {
    // Direct Supabase query as user A
    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('user_id', 'user_b');

    // Should return empty (RLS blocks access)
    expect(data).toEqual([]);
  });
});
```

---

## 8. Test Data & Fixtures

### Mock Data

```typescript
// test/fixtures/brand-kits.ts
export const mockBrandKit = {
  businessName: 'Test Company',
  businessDescription: 'A test company description',
  industry: 'tech',
  logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
  colors: [
    { name: 'Primary', hex: '#0066FF', usage: 'main' },
    { name: 'Secondary', hex: '#FF6B35', usage: 'accent' },
    { name: 'Background', hex: '#FFFFFF', usage: 'background' },
  ],
  fonts: {
    primary: 'Inter',
    secondary: 'Source Code Pro',
  },
  tagline: 'Innovate the future',
};

export const mockUser = {
  userId: 'user_test_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

export const mockShareToken = {
  token: 'abc123xyz',
  brandKitId: 'kit_123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
};
```

---

## 9. Coverage Requirements

### Minimum Coverage Targets

| Category | Target |
|----------|--------|
| **Statements** | 80% |
| **Branches** | 75% |
| **Functions** | 80% |
| **Lines** | 80% |

### Critical Paths (100% Coverage Required)
- Authentication flow
- Database CRUD operations
- RLS policy enforcement
- API input validation
- Error handling

### Coverage Exemptions
- UI components (tested via E2E)
- Third-party library code
- Configuration files

---

## 10. Test Commands

```bash
# Run all unit tests
npm test

# Run unit tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run accessibility tests
npm run test:a11y

# Run all tests
npm run test:all
```

---

## 11. CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

---

## 12. Test Execution Schedule

### Pre-Commit
- Lint checks (ESLint, Prettier)
- Unit tests for changed files

### Pre-Push
- All unit tests
- Integration tests

### Pull Request
- Full test suite (unit, integration, E2E)
- Coverage report
- Accessibility scan

### Deployment (Staging)
- Full test suite
- Performance tests
- Security scans

### Production
- Smoke tests
- Health check endpoints

---

## 13. Success Criteria

### Definition of Done
- ✅ All tests passing (unit, integration, E2E)
- ✅ Coverage ≥80%
- ✅ No accessibility violations (WCAG 2.1 AA)
- ✅ Performance targets met (<2s load time)
- ✅ Security tests passing (no vulnerabilities)
- ✅ Manual QA completed
- ✅ Code reviewed and approved

### Quality Gates
- 0 critical bugs
- 0 accessibility violations
- 0 security vulnerabilities (high/critical)
- <5 code smells (SonarQube)
- Test coverage trend: not decreasing

---

## Conclusion

This test plan ensures comprehensive coverage of the User Accounts & Brand Kit History feature following production-level standards. All tests are designed to be:

- **Automated**: Run in CI/CD pipeline
- **Repeatable**: Same results every time
- **Fast**: Complete in <5 minutes
- **Reliable**: No flaky tests
- **Maintainable**: Clear, documented, DRY

Next step: Implement tests in parallel with feature development (TDD approach).
