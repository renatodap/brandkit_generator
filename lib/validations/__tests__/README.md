# Validation Tests

Comprehensive Vitest test suite for all Zod validation schemas in the Brand Kit Generator application.

## Test Files

### 1. `brand-kit.test.ts` (74 tests)

Tests for brand kit validation schemas in `lib/validations/brand-kit.ts`:

#### `colorSchema` (10 tests)
- ✅ Valid color objects with different hex formats (lowercase, uppercase, mixed)
- ✅ Missing/empty required fields (name, usage)
- ✅ Invalid hex color formats (missing #, wrong length, invalid characters)

#### `fontSchema` (6 tests)
- ✅ Valid font objects
- ✅ Missing/empty primary and secondary fonts

#### `createBrandKitSchema` (36 tests)
- ✅ Complete and minimal valid inputs
- ✅ Business ID validation (UUID format)
- ✅ Business name validation (required, max 255 chars)
- ✅ Optional fields (description, industry, logo SVG, tagline, design justification)
- ✅ Logo URL validation (required, non-empty)
- ✅ Colors array validation (min 1, max 10 colors, invalid color validation)
- ✅ Fonts object validation
- ✅ Edge cases (exactly 255 chars, exactly 1 color, exactly 10 colors)

#### `updateBrandKitSchema` (8 tests)
- ✅ Valid businessName and isFavorite updates
- ✅ Partial updates (both fields together, empty object)
- ✅ Business name validation (empty string, max 255 chars)
- ✅ Boolean validation for isFavorite

#### `createShareTokenSchema` (7 tests)
- ✅ Valid expiresInDays values (1-365)
- ✅ Optional field (empty object)
- ✅ Edge cases (1 day, 365 days)
- ✅ Invalid values (0, negative, >365, decimals)

#### `listBrandKitsQuerySchema` (7 tests)
- ✅ Default values when no input provided
- ✅ String coercion for limit and offset
- ✅ Limit validation (1-100, rejects 0, negative, >100)
- ✅ Offset validation (≥0, rejects negative)
- ✅ favoritesOnly string-to-boolean transformation
- ✅ Sort and order enum validation
- ✅ Complex queries with all fields

### 2. `business.test.ts` (90 tests)

Tests for business validation schemas in `lib/validations/business.ts`:

#### `createBusinessSchema` (29 tests)
- ✅ Complete and minimal valid inputs
- ✅ Name validation (required, empty, max 255 chars, exactly 255 chars)
- ✅ Slug validation:
  - ✅ Required, empty, max 255 chars
  - ✅ Lowercase letters, numbers, hyphens
  - ✅ Rejects uppercase, spaces, special characters
  - ✅ Cannot start or end with hyphen
- ✅ Description validation (optional, max 1000 chars, exactly 1000 chars)
- ✅ Industry validation (optional, max 100 chars, exactly 100 chars)

#### `updateBusinessSchema` (20 tests)
- ✅ Valid updates for all fields
- ✅ Partial updates (all fields together, empty object)
- ✅ Name validation (empty string, max 255 chars)
- ✅ Slug validation (same rules as create)
- ✅ Nullable description and industry
- ✅ Length validations (max 255 name, max 1000 description, max 100 industry)

#### `listBusinessesSchema` (14 tests)
- ✅ Default values when no input provided
- ✅ Limit validation (1-100, rejects 0, negative, >100)
- ✅ Offset validation (≥0, rejects negative)
- ✅ Sort enum validation (name, created_at, updated_at)
- ✅ Order enum validation (asc, desc)
- ✅ Optional industry filter
- ✅ Complex queries with all fields

#### `generateSlug` function (27 tests)
- ✅ Simple name to slug conversion
- ✅ Uppercase to lowercase conversion
- ✅ Space to hyphen replacement
- ✅ Special character removal (all common special chars)
- ✅ Multiple spaces/hyphens to single hyphen
- ✅ Leading/trailing hyphen removal
- ✅ Numbers preservation
- ✅ Whitespace trimming
- ✅ Edge cases (empty string, only special chars, only spaces)
- ✅ Complex business names (apostrophes, parentheses, dots, commas)
- ✅ Long business names

## Coverage

```
File             | % Stmts | % Branch | % Funcs | % Lines |
-----------------|---------|----------|---------|---------|
brand-kit.ts     |     100 |      100 |     100 |     100 |
business.ts      |     100 |      100 |     100 |     100 |
```

**Total: 164 tests, 100% coverage**

## Running Tests

```bash
# Run all validation tests
npm test -- lib/validations/__tests__/ --run

# Run specific test file
npm test -- lib/validations/__tests__/brand-kit.test.ts --run
npm test -- lib/validations/__tests__/business.test.ts --run

# Run with coverage
npm test -- lib/validations/ --coverage --run

# Watch mode
npm test -- lib/validations/__tests__/
```

## Test Patterns Used

### 1. Valid Input Testing
```typescript
it('should validate valid input', () => {
  const result = schema.safeParse(validInput);
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.field).toBe(expectedValue);
  }
});
```

### 2. Invalid Input Testing
```typescript
it('should reject invalid input', () => {
  const result = schema.safeParse(invalidInput);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toContain('error message');
  }
});
```

### 3. Edge Case Testing
```typescript
// Boundary values
it('should accept exactly max length', () => {
  const result = schema.safeParse({ field: 'a'.repeat(255) });
  expect(result.success).toBe(true);
});

it('should reject exceeding max length', () => {
  const result = schema.safeParse({ field: 'a'.repeat(256) });
  expect(result.success).toBe(false);
});
```

### 4. Transformation Testing
```typescript
it('should transform string to boolean', () => {
  const result = schema.safeParse({ field: 'true' });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.field).toBe(true);
    expect(typeof result.data.field).toBe('boolean');
  }
});
```

### 5. Array Validation Testing
```typescript
it('should accept exactly 10 items', () => {
  const items = Array.from({ length: 10 }, () => ({ /* valid item */ }));
  const result = schema.safeParse({ items });
  expect(result.success).toBe(true);
});

it('should reject more than 10 items', () => {
  const items = Array.from({ length: 11 }, () => ({ /* valid item */ }));
  const result = schema.safeParse({ items });
  expect(result.success).toBe(false);
});
```

## Key Testing Principles

1. **Comprehensive Coverage**: Test all validation rules (required, optional, format, length, range)
2. **Edge Cases**: Test boundary values (min, max, exactly at limit)
3. **Error Messages**: Verify correct error messages are returned
4. **Type Safety**: Use TypeScript type guards to access parsed data
5. **Transformations**: Test schema transformations (string to number, string to boolean)
6. **Refinements**: Test custom validation logic (slug format, hyphen positions)

## Notes

- Zod's default error message for missing required fields is `"Required"` (not custom messages)
- Custom error messages appear for validation failures on provided values (e.g., regex, length)
- All tests use `.safeParse()` to get detailed error information
- Tests check both `result.success` and the actual error/data content
