/**
 * Business Validation Tests
 *
 * Comprehensive tests for all business Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  createBusinessSchema,
  updateBusinessSchema,
  listBusinessesSchema,
  generateSlug,
} from '../business';

describe('createBusinessSchema', () => {
  const validInput = {
    name: 'Acme Corporation',
    slug: 'acme-corporation',
    description: 'Leading provider of innovative solutions',
    industry: 'Technology',
  };

  it('should validate complete valid input', () => {
    const result = createBusinessSchema.safeParse(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Acme Corporation');
      expect(result.data.slug).toBe('acme-corporation');
      expect(result.data.description).toBe('Leading provider of innovative solutions');
      expect(result.data.industry).toBe('Technology');
    }
  });

  it('should validate minimal required input (name and slug only)', () => {
    const result = createBusinessSchema.safeParse({
      name: 'Test Business',
      slug: 'test-business',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Business');
      expect(result.data.slug).toBe('test-business');
    }
  });

  it('should reject missing name', () => {
    const input = { ...validInput };
    delete (input as any).name;
    const result = createBusinessSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      name: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Business name is required');
    }
  });

  it('should reject name exceeding 255 characters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      name: 'a'.repeat(256),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 255 characters');
    }
  });

  it('should accept name with exactly 255 characters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      name: 'a'.repeat(255),
    });

    expect(result.success).toBe(true);
  });

  it('should reject missing slug', () => {
    const input = { ...validInput };
    delete (input as any).slug;
    const result = createBusinessSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject empty slug', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Slug is required');
    }
  });

  it('should reject slug exceeding 255 characters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: 'a'.repeat(256),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 255 characters');
    }
  });

  it('should accept slug with exactly 255 characters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: 'a'.repeat(255),
    });

    expect(result.success).toBe(true);
  });

  it('should accept slug with lowercase letters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: 'testbusiness',
    });

    expect(result.success).toBe(true);
  });

  it('should accept slug with numbers', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: 'test-business-123',
    });

    expect(result.success).toBe(true);
  });

  it('should accept slug with hyphens', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: 'test-business-name',
    });

    expect(result.success).toBe(true);
  });

  it('should reject slug with uppercase letters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: 'Test-Business',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('lowercase');
    }
  });

  it('should reject slug with spaces', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: 'test business',
    });

    expect(result.success).toBe(false);
  });

  it('should reject slug with special characters', () => {
    const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '=', '+', '[', ']', '{', '}', '\\', '|', ';', ':', '"', "'", ',', '.', '<', '>', '/', '?'];

    specialChars.forEach((char) => {
      const result = createBusinessSchema.safeParse({
        ...validInput,
        slug: `test${char}business`,
      });

      expect(result.success).toBe(false);
    });
  });

  it('should reject slug starting with hyphen', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: '-test-business',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.message.includes('cannot start or end with a hyphen'))).toBe(true);
    }
  });

  it('should reject slug ending with hyphen', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: 'test-business-',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.message.includes('cannot start or end with a hyphen'))).toBe(true);
    }
  });

  it('should reject slug starting and ending with hyphen', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      slug: '-test-business-',
    });

    expect(result.success).toBe(false);
  });

  it('should accept optional description', () => {
    const input = { ...validInput };
    delete (input as any).description;
    const result = createBusinessSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject description exceeding 1000 characters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      description: 'a'.repeat(1001),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 1000 characters');
    }
  });

  it('should accept description with exactly 1000 characters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      description: 'a'.repeat(1000),
    });

    expect(result.success).toBe(true);
  });

  it('should accept empty description', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      description: '',
    });

    expect(result.success).toBe(true);
  });

  it('should accept optional industry', () => {
    const input = { ...validInput };
    delete (input as any).industry;
    const result = createBusinessSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject industry exceeding 100 characters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      industry: 'a'.repeat(101),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 100 characters');
    }
  });

  it('should accept industry with exactly 100 characters', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      industry: 'a'.repeat(100),
    });

    expect(result.success).toBe(true);
  });

  it('should accept empty industry', () => {
    const result = createBusinessSchema.safeParse({
      ...validInput,
      industry: '',
    });

    expect(result.success).toBe(true);
  });
});

describe('updateBusinessSchema', () => {
  it('should validate name update', () => {
    const result = updateBusinessSchema.safeParse({
      name: 'Updated Business Name',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Updated Business Name');
    }
  });

  it('should validate slug update', () => {
    const result = updateBusinessSchema.safeParse({
      slug: 'updated-slug',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('updated-slug');
    }
  });

  it('should validate description update', () => {
    const result = updateBusinessSchema.safeParse({
      description: 'Updated description',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Updated description');
    }
  });

  it('should validate industry update', () => {
    const result = updateBusinessSchema.safeParse({
      industry: 'Healthcare',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.industry).toBe('Healthcare');
    }
  });

  it('should validate all fields together', () => {
    const result = updateBusinessSchema.safeParse({
      name: 'New Name',
      slug: 'new-slug',
      description: 'New description',
      industry: 'Finance',
    });

    expect(result.success).toBe(true);
  });

  it('should allow empty object (no updates)', () => {
    const result = updateBusinessSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('should reject empty name if provided', () => {
    const result = updateBusinessSchema.safeParse({
      name: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Business name is required');
    }
  });

  it('should reject name exceeding 255 characters', () => {
    const result = updateBusinessSchema.safeParse({
      name: 'a'.repeat(256),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('less than 255 characters');
    }
  });

  it('should accept name with exactly 255 characters', () => {
    const result = updateBusinessSchema.safeParse({
      name: 'a'.repeat(255),
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty slug if provided', () => {
    const result = updateBusinessSchema.safeParse({
      slug: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Slug is required');
    }
  });

  it('should reject slug exceeding 255 characters', () => {
    const result = updateBusinessSchema.safeParse({
      slug: 'a'.repeat(256),
    });

    expect(result.success).toBe(false);
  });

  it('should accept slug with exactly 255 characters', () => {
    const result = updateBusinessSchema.safeParse({
      slug: 'a'.repeat(255),
    });

    expect(result.success).toBe(true);
  });

  it('should reject slug with invalid characters', () => {
    const result = updateBusinessSchema.safeParse({
      slug: 'Invalid-Slug',
    });

    expect(result.success).toBe(false);
  });

  it('should reject slug starting with hyphen', () => {
    const result = updateBusinessSchema.safeParse({
      slug: '-test-slug',
    });

    expect(result.success).toBe(false);
  });

  it('should reject slug ending with hyphen', () => {
    const result = updateBusinessSchema.safeParse({
      slug: 'test-slug-',
    });

    expect(result.success).toBe(false);
  });

  it('should accept null description', () => {
    const result = updateBusinessSchema.safeParse({
      description: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe(null);
    }
  });

  it('should accept empty description', () => {
    const result = updateBusinessSchema.safeParse({
      description: '',
    });

    expect(result.success).toBe(true);
  });

  it('should reject description exceeding 1000 characters', () => {
    const result = updateBusinessSchema.safeParse({
      description: 'a'.repeat(1001),
    });

    expect(result.success).toBe(false);
  });

  it('should accept description with exactly 1000 characters', () => {
    const result = updateBusinessSchema.safeParse({
      description: 'a'.repeat(1000),
    });

    expect(result.success).toBe(true);
  });

  it('should accept null industry', () => {
    const result = updateBusinessSchema.safeParse({
      industry: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.industry).toBe(null);
    }
  });

  it('should accept empty industry', () => {
    const result = updateBusinessSchema.safeParse({
      industry: '',
    });

    expect(result.success).toBe(true);
  });

  it('should reject industry exceeding 100 characters', () => {
    const result = updateBusinessSchema.safeParse({
      industry: 'a'.repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it('should accept industry with exactly 100 characters', () => {
    const result = updateBusinessSchema.safeParse({
      industry: 'a'.repeat(100),
    });

    expect(result.success).toBe(true);
  });
});

describe('listBusinessesSchema', () => {
  it('should use default values when no input provided', () => {
    const result = listBusinessesSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
      expect(result.data.sort).toBe('created_at');
      expect(result.data.order).toBe('desc');
    }
  });

  it('should validate custom limit', () => {
    const result = listBusinessesSchema.safeParse({
      limit: 20,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('should validate custom offset', () => {
    const result = listBusinessesSchema.safeParse({
      offset: 100,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.offset).toBe(100);
    }
  });

  it('should reject limit less than 1', () => {
    const result = listBusinessesSchema.safeParse({
      limit: 0,
    });

    expect(result.success).toBe(false);
  });

  it('should reject negative limit', () => {
    const result = listBusinessesSchema.safeParse({
      limit: -10,
    });

    expect(result.success).toBe(false);
  });

  it('should reject limit exceeding 100', () => {
    const result = listBusinessesSchema.safeParse({
      limit: 101,
    });

    expect(result.success).toBe(false);
  });

  it('should accept limit of exactly 1', () => {
    const result = listBusinessesSchema.safeParse({
      limit: 1,
    });

    expect(result.success).toBe(true);
  });

  it('should accept limit of exactly 100', () => {
    const result = listBusinessesSchema.safeParse({
      limit: 100,
    });

    expect(result.success).toBe(true);
  });

  it('should reject negative offset', () => {
    const result = listBusinessesSchema.safeParse({
      offset: -10,
    });

    expect(result.success).toBe(false);
  });

  it('should accept offset of 0', () => {
    const result = listBusinessesSchema.safeParse({
      offset: 0,
    });

    expect(result.success).toBe(true);
  });

  it('should accept valid sort values', () => {
    const sorts = ['name', 'created_at', 'updated_at'];

    sorts.forEach((sort) => {
      const result = listBusinessesSchema.safeParse({ sort });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe(sort);
      }
    });
  });

  it('should reject invalid sort value', () => {
    const result = listBusinessesSchema.safeParse({
      sort: 'invalid',
    });

    expect(result.success).toBe(false);
  });

  it('should accept valid order values', () => {
    const orders = ['asc', 'desc'];

    orders.forEach((order) => {
      const result = listBusinessesSchema.safeParse({ order });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe(order);
      }
    });
  });

  it('should reject invalid order value', () => {
    const result = listBusinessesSchema.safeParse({
      order: 'ascending',
    });

    expect(result.success).toBe(false);
  });

  it('should validate optional industry filter', () => {
    const result = listBusinessesSchema.safeParse({
      industry: 'Technology',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.industry).toBe('Technology');
    }
  });

  it('should accept query without industry filter', () => {
    const result = listBusinessesSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.industry).toBeUndefined();
    }
  });

  it('should validate complex query with all fields', () => {
    const result = listBusinessesSchema.safeParse({
      limit: 25,
      offset: 50,
      sort: 'name',
      order: 'asc',
      industry: 'Healthcare',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
      expect(result.data.offset).toBe(50);
      expect(result.data.sort).toBe('name');
      expect(result.data.order).toBe('asc');
      expect(result.data.industry).toBe('Healthcare');
    }
  });
});

describe('generateSlug', () => {
  it('should convert simple name to slug', () => {
    expect(generateSlug('Test Business')).toBe('test-business');
  });

  it('should convert uppercase to lowercase', () => {
    expect(generateSlug('ACME CORPORATION')).toBe('acme-corporation');
  });

  it('should replace spaces with hyphens', () => {
    expect(generateSlug('My New Business')).toBe('my-new-business');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Test & Business!')).toBe('test-business');
  });

  it('should handle multiple special characters', () => {
    expect(generateSlug('Test@#$%Business')).toBe('testbusiness');
  });

  it('should replace multiple spaces with single hyphen', () => {
    expect(generateSlug('Test    Business')).toBe('test-business');
  });

  it('should replace multiple hyphens with single hyphen', () => {
    expect(generateSlug('Test---Business')).toBe('test-business');
  });

  it('should remove leading hyphen', () => {
    expect(generateSlug('-Test Business')).toBe('test-business');
  });

  it('should remove trailing hyphen', () => {
    expect(generateSlug('Test Business-')).toBe('test-business');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(generateSlug('-Test Business-')).toBe('test-business');
  });

  it('should handle name with numbers', () => {
    expect(generateSlug('Business 123')).toBe('business-123');
  });

  it('should preserve existing hyphens', () => {
    expect(generateSlug('Test-Business-Name')).toBe('test-business-name');
  });

  it('should trim whitespace', () => {
    expect(generateSlug('  Test Business  ')).toBe('test-business');
  });

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('should handle string with only special characters', () => {
    expect(generateSlug('@#$%^&*()')).toBe('');
  });

  it('should handle string with only spaces', () => {
    expect(generateSlug('     ')).toBe('');
  });

  it('should handle complex business name', () => {
    expect(generateSlug('Joe\'s Coffee & Tea Shop #1')).toBe('joes-coffee-tea-shop-1');
  });

  it('should handle name with apostrophes', () => {
    expect(generateSlug('Bob\'s Burgers')).toBe('bobs-burgers');
  });

  it('should handle name with parentheses', () => {
    expect(generateSlug('Business (Incorporated)')).toBe('business-incorporated');
  });

  it('should handle name with dots', () => {
    expect(generateSlug('Test.Business.Inc')).toBe('testbusinessinc');
  });

  it('should handle name with commas', () => {
    expect(generateSlug('Business, LLC')).toBe('business-llc');
  });

  it('should handle long business name', () => {
    const longName = 'This is a Very Long Business Name With Many Words That Should Be Converted';
    expect(generateSlug(longName)).toBe('this-is-a-very-long-business-name-with-many-words-that-should-be-converted');
  });

  it('should handle name with consecutive special characters and spaces', () => {
    expect(generateSlug('Test @#$ %^& Business')).toBe('test-business');
  });
});
