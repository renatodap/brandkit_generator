/**
 * Brand Kit Validation Tests
 *
 * Comprehensive tests for all brand kit Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  colorSchema,
  fontSchema,
  createBrandKitSchema,
  updateBrandKitSchema,
  createShareTokenSchema,
  listBrandKitsQuerySchema,
} from '../brand-kit';

describe('colorSchema', () => {
  it('should validate a valid color object', () => {
    const result = colorSchema.safeParse({
      name: 'Primary Blue',
      hex: '#3B82F6',
      usage: 'Primary brand color',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Primary Blue');
      expect(result.data.hex).toBe('#3B82F6');
      expect(result.data.usage).toBe('Primary brand color');
    }
  });

  it('should accept lowercase hex colors', () => {
    const result = colorSchema.safeParse({
      name: 'Red',
      hex: '#ff0000',
      usage: 'Error color',
    });

    expect(result.success).toBe(true);
  });

  it('should accept uppercase hex colors', () => {
    const result = colorSchema.safeParse({
      name: 'Green',
      hex: '#00FF00',
      usage: 'Success color',
    });

    expect(result.success).toBe(true);
  });

  it('should accept mixed case hex colors', () => {
    const result = colorSchema.safeParse({
      name: 'Purple',
      hex: '#9B30Ff',
      usage: 'Accent color',
    });

    expect(result.success).toBe(true);
  });

  it('should reject missing name', () => {
    const result = colorSchema.safeParse({
      hex: '#3B82F6',
      usage: 'Primary brand color',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Required');
    }
  });

  it('should reject empty name', () => {
    const result = colorSchema.safeParse({
      name: '',
      hex: '#3B82F6',
      usage: 'Primary brand color',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Color name is required');
    }
  });

  it('should reject invalid hex color format (missing #)', () => {
    const result = colorSchema.safeParse({
      name: 'Blue',
      hex: '3B82F6',
      usage: 'Primary',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid hex color format');
    }
  });

  it('should reject invalid hex color format (too short)', () => {
    const result = colorSchema.safeParse({
      name: 'Blue',
      hex: '#3B82F',
      usage: 'Primary',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid hex color format (too long)', () => {
    const result = colorSchema.safeParse({
      name: 'Blue',
      hex: '#3B82F6A',
      usage: 'Primary',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid hex color format (invalid characters)', () => {
    const result = colorSchema.safeParse({
      name: 'Blue',
      hex: '#GGGGGG',
      usage: 'Primary',
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing usage', () => {
    const result = colorSchema.safeParse({
      name: 'Blue',
      hex: '#3B82F6',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Required');
    }
  });

  it('should reject empty usage', () => {
    const result = colorSchema.safeParse({
      name: 'Blue',
      hex: '#3B82F6',
      usage: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Color usage is required');
    }
  });
});

describe('fontSchema', () => {
  it('should validate valid font object', () => {
    const result = fontSchema.safeParse({
      primary: 'Inter',
      secondary: 'Lora',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primary).toBe('Inter');
      expect(result.data.secondary).toBe('Lora');
    }
  });

  it('should reject missing primary font', () => {
    const result = fontSchema.safeParse({
      secondary: 'Lora',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Required');
    }
  });

  it('should reject empty primary font', () => {
    const result = fontSchema.safeParse({
      primary: '',
      secondary: 'Lora',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Primary font is required');
    }
  });

  it('should reject missing secondary font', () => {
    const result = fontSchema.safeParse({
      primary: 'Inter',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Required');
    }
  });

  it('should reject empty secondary font', () => {
    const result = fontSchema.safeParse({
      primary: 'Inter',
      secondary: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Secondary font is required');
    }
  });
});

describe('createBrandKitSchema', () => {
  const validInput = {
    businessId: '550e8400-e29b-41d4-a716-446655440000',
    businessName: 'Acme Corporation',
    businessDescription: 'Leading provider of innovative solutions',
    industry: 'Technology',
    logoUrl: 'https://example.com/logo.png',
    logoSvg: '<svg>...</svg>',
    colors: [
      { name: 'Primary', hex: '#3B82F6', usage: 'Primary brand color' },
      { name: 'Secondary', hex: '#10B981', usage: 'Accent color' },
    ],
    fonts: {
      primary: 'Inter',
      secondary: 'Lora',
    },
    tagline: 'Innovation at its finest',
    designJustification: 'Modern, professional design reflecting tech leadership',
  };

  it('should validate complete valid input', () => {
    const result = createBrandKitSchema.safeParse(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.businessName).toBe('Acme Corporation');
      expect(result.data.colors).toHaveLength(2);
    }
  });

  it('should validate minimal required input', () => {
    const result = createBrandKitSchema.safeParse({
      businessId: '550e8400-e29b-41d4-a716-446655440000',
      businessName: 'Test Business',
      logoUrl: 'https://example.com/logo.png',
      colors: [{ name: 'Primary', hex: '#000000', usage: 'Main' }],
      fonts: { primary: 'Arial', secondary: 'Georgia' },
    });

    expect(result.success).toBe(true);
  });

  it('should reject missing businessId', () => {
    const input = { ...validInput };
    delete (input as any).businessId;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject invalid businessId (not UUID)', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      businessId: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('UUID');
    }
  });

  it('should reject missing businessName', () => {
    const input = { ...validInput };
    delete (input as any).businessName;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Required');
    }
  });

  it('should reject empty businessName', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      businessName: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Business name is required');
    }
  });

  it('should reject businessName exceeding 255 characters', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      businessName: 'a'.repeat(256),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('255 characters or less');
    }
  });

  it('should accept businessName with exactly 255 characters', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      businessName: 'a'.repeat(255),
    });

    expect(result.success).toBe(true);
  });

  it('should accept optional businessDescription', () => {
    const input = { ...validInput };
    delete (input as any).businessDescription;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should accept optional industry', () => {
    const input = { ...validInput };
    delete (input as any).industry;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject missing logoUrl', () => {
    const input = { ...validInput };
    delete (input as any).logoUrl;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Required');
    }
  });

  it('should reject empty logoUrl', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      logoUrl: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Logo URL is required');
    }
  });

  it('should accept optional logoSvg', () => {
    const input = { ...validInput };
    delete (input as any).logoSvg;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject empty colors array', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      colors: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one color is required');
    }
  });

  it('should accept exactly 1 color', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      colors: [{ name: 'Primary', hex: '#000000', usage: 'Main' }],
    });

    expect(result.success).toBe(true);
  });

  it('should accept exactly 10 colors', () => {
    const colors = Array.from({ length: 10 }, (_, i) => ({
      name: `Color ${i + 1}`,
      hex: '#000000',
      usage: 'Usage',
    }));

    const result = createBrandKitSchema.safeParse({
      ...validInput,
      colors,
    });

    expect(result.success).toBe(true);
  });

  it('should reject more than 10 colors', () => {
    const colors = Array.from({ length: 11 }, (_, i) => ({
      name: `Color ${i + 1}`,
      hex: '#000000',
      usage: 'Usage',
    }));

    const result = createBrandKitSchema.safeParse({
      ...validInput,
      colors,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Maximum 10 colors allowed');
    }
  });

  it('should reject invalid color in array', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      colors: [{ name: 'Primary', hex: 'invalid', usage: 'Main' }],
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing fonts', () => {
    const input = { ...validInput };
    delete (input as any).fonts;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject invalid fonts object', () => {
    const result = createBrandKitSchema.safeParse({
      ...validInput,
      fonts: { primary: 'Inter' }, // Missing secondary
    });

    expect(result.success).toBe(false);
  });

  it('should accept optional tagline', () => {
    const input = { ...validInput };
    delete (input as any).tagline;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should accept optional designJustification', () => {
    const input = { ...validInput };
    delete (input as any).designJustification;
    const result = createBrandKitSchema.safeParse(input);

    expect(result.success).toBe(true);
  });
});

describe('updateBrandKitSchema', () => {
  it('should validate businessName update', () => {
    const result = updateBrandKitSchema.safeParse({
      businessName: 'Updated Business Name',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.businessName).toBe('Updated Business Name');
    }
  });

  it('should validate isFavorite update', () => {
    const result = updateBrandKitSchema.safeParse({
      isFavorite: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFavorite).toBe(true);
    }
  });

  it('should validate both fields together', () => {
    const result = updateBrandKitSchema.safeParse({
      businessName: 'New Name',
      isFavorite: false,
    });

    expect(result.success).toBe(true);
  });

  it('should allow empty object (no updates)', () => {
    const result = updateBrandKitSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('should reject empty businessName if provided', () => {
    const result = updateBrandKitSchema.safeParse({
      businessName: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Business name is required');
    }
  });

  it('should reject businessName exceeding 255 characters', () => {
    const result = updateBrandKitSchema.safeParse({
      businessName: 'a'.repeat(256),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('255 characters or less');
    }
  });

  it('should accept businessName with exactly 255 characters', () => {
    const result = updateBrandKitSchema.safeParse({
      businessName: 'a'.repeat(255),
    });

    expect(result.success).toBe(true);
  });

  it('should reject non-boolean isFavorite', () => {
    const result = updateBrandKitSchema.safeParse({
      isFavorite: 'true',
    });

    expect(result.success).toBe(false);
  });
});

describe('createShareTokenSchema', () => {
  it('should validate valid expiresInDays', () => {
    const result = createShareTokenSchema.safeParse({
      expiresInDays: 7,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiresInDays).toBe(7);
    }
  });

  it('should allow empty object (no expiresInDays)', () => {
    const result = createShareTokenSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('should accept 1 day', () => {
    const result = createShareTokenSchema.safeParse({
      expiresInDays: 1,
    });

    expect(result.success).toBe(true);
  });

  it('should accept 365 days (max)', () => {
    const result = createShareTokenSchema.safeParse({
      expiresInDays: 365,
    });

    expect(result.success).toBe(true);
  });

  it('should reject 0 days', () => {
    const result = createShareTokenSchema.safeParse({
      expiresInDays: 0,
    });

    expect(result.success).toBe(false);
  });

  it('should reject negative days', () => {
    const result = createShareTokenSchema.safeParse({
      expiresInDays: -5,
    });

    expect(result.success).toBe(false);
  });

  it('should reject more than 365 days', () => {
    const result = createShareTokenSchema.safeParse({
      expiresInDays: 366,
    });

    expect(result.success).toBe(false);
  });

  it('should reject decimal days', () => {
    const result = createShareTokenSchema.safeParse({
      expiresInDays: 7.5,
    });

    expect(result.success).toBe(false);
  });
});

describe('listBrandKitsQuerySchema', () => {
  it('should use default values when no input provided', () => {
    const result = listBrandKitsQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
      expect(result.data.sort).toBe('created_at');
      expect(result.data.order).toBe('desc');
    }
  });

  it('should validate custom limit', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      limit: '20',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('should coerce string limit to number', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      limit: '10',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.limit).toBe('number');
      expect(result.data.limit).toBe(10);
    }
  });

  it('should validate custom offset', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      offset: '100',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.offset).toBe(100);
    }
  });

  it('should coerce string offset to number', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      offset: '50',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.offset).toBe('number');
      expect(result.data.offset).toBe(50);
    }
  });

  it('should reject limit of 0', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      limit: '0',
    });

    expect(result.success).toBe(false);
  });

  it('should reject negative limit', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      limit: '-10',
    });

    expect(result.success).toBe(false);
  });

  it('should reject limit exceeding 100', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      limit: '101',
    });

    expect(result.success).toBe(false);
  });

  it('should accept limit of exactly 100', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      limit: '100',
    });

    expect(result.success).toBe(true);
  });

  it('should reject negative offset', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      offset: '-10',
    });

    expect(result.success).toBe(false);
  });

  it('should accept offset of 0', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      offset: '0',
    });

    expect(result.success).toBe(true);
  });

  it('should transform favoritesOnly string to boolean (true)', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      favoritesOnly: 'true',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.favoritesOnly).toBe(true);
    }
  });

  it('should transform favoritesOnly string to boolean (false)', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      favoritesOnly: 'false',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.favoritesOnly).toBe(false);
    }
  });

  it('should reject invalid favoritesOnly value', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      favoritesOnly: 'yes',
    });

    expect(result.success).toBe(false);
  });

  it('should accept valid sort values', () => {
    const sorts = ['created_at', 'updated_at', 'business_name'];

    sorts.forEach((sort) => {
      const result = listBrandKitsQuerySchema.safeParse({ sort });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe(sort);
      }
    });
  });

  it('should reject invalid sort value', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      sort: 'invalid',
    });

    expect(result.success).toBe(false);
  });

  it('should accept valid order values', () => {
    const orders = ['asc', 'desc'];

    orders.forEach((order) => {
      const result = listBrandKitsQuerySchema.safeParse({ order });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe(order);
      }
    });
  });

  it('should reject invalid order value', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      order: 'ascending',
    });

    expect(result.success).toBe(false);
  });

  it('should validate complex query with all fields', () => {
    const result = listBrandKitsQuerySchema.safeParse({
      limit: '25',
      offset: '50',
      favoritesOnly: 'true',
      sort: 'business_name',
      order: 'asc',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
      expect(result.data.offset).toBe(50);
      expect(result.data.favoritesOnly).toBe(true);
      expect(result.data.sort).toBe('business_name');
      expect(result.data.order).toBe('asc');
    }
  });
});
