/**
 * Validation schemas for business operations
 */

import { z } from 'zod';

/**
 * Schema for creating a new business
 */
export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(255, 'Business name must be less than 255 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with a hyphen'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  industry: z.string().max(100, 'Industry must be less than 100 characters').optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

/**
 * Schema for updating a business
 */
export const updateBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(255, 'Business name must be less than 255 characters').optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with a hyphen')
    .optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
  industry: z.string().max(100, 'Industry must be less than 100 characters').optional().nullable(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

/**
 * Schema for listing businesses with filters
 */
export const listBusinessesSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sort: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  industry: z.string().optional(),
});

export type ListBusinessesQuery = z.infer<typeof listBusinessesSchema>;

/**
 * Helper function to generate slug from business name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
