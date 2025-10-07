/**
 * Brand Kit Validation Schemas
 *
 * Zod schemas for validating brand kit data
 * used in API routes and database operations.
 */

import { z } from 'zod';

// Color data schema
export const colorSchema = z.object({
  name: z.string().min(1, 'Color name is required'),
  hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format (must be #RRGGBB)'),
  usage: z.string().min(1, 'Color usage is required'),
});

// Font data schema
export const fontSchema = z.object({
  primary: z.string().min(1, 'Primary font is required'),
  secondary: z.string().min(1, 'Secondary font is required'),
});

// Create brand kit schema
export const createBrandKitSchema = z.object({
  businessId: z.string().uuid('Business ID must be a valid UUID'),
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .max(255, 'Business name must be 255 characters or less'),
  businessDescription: z.string().optional(),
  industry: z.string().optional(),
  logoUrl: z.string().min(1, 'Logo URL is required'),
  logoSvg: z.string().optional(),
  colors: z
    .array(colorSchema)
    .min(1, 'At least one color is required')
    .max(10, 'Maximum 10 colors allowed'),
  fonts: fontSchema,
  tagline: z.string().optional(),
  designJustification: z.string().optional(),
});

// Update brand kit schema (partial updates allowed)
export const updateBrandKitSchema = z.object({
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .max(255, 'Business name must be 255 characters or less')
    .optional(),
  isFavorite: z.boolean().optional(),
});

// Share token schema
export const createShareTokenSchema = z.object({
  expiresInDays: z.number().int().positive().max(365).optional(),
});

// Query parameters for listing brand kits
export const listBrandKitsQuerySchema = z.object({
  limit: z
    .union([z.string(), z.number(), z.null()])
    .transform((val) => {
      if (val === null || val === undefined) return 50;
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return isNaN(num) ? 50 : Math.min(Math.max(num, 1), 100);
    }),
  offset: z
    .union([z.string(), z.number(), z.null()])
    .transform((val) => {
      if (val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return isNaN(num) ? 0 : Math.max(num, 0);
    }),
  favoritesOnly: z
    .union([z.enum(['true', 'false']), z.null()])
    .transform((val) => val === 'true')
    .optional(),
  sort: z
    .union([z.enum(['created_at', 'updated_at', 'business_name']), z.null()])
    .transform((val) => val || 'created_at'),
  order: z
    .union([z.enum(['asc', 'desc']), z.null()])
    .transform((val) => val || 'desc'),
});

// Type exports
export type ColorData = z.infer<typeof colorSchema>;
export type FontData = z.infer<typeof fontSchema>;
export type CreateBrandKitInput = z.infer<typeof createBrandKitSchema>;
export type UpdateBrandKitInput = z.infer<typeof updateBrandKitSchema>;
export type CreateShareTokenInput = z.infer<typeof createShareTokenSchema>;
export type ListBrandKitsQuery = z.infer<typeof listBrandKitsQuerySchema>;
