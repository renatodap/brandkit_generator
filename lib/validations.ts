import { z } from 'zod';

/**
 * Industry validation schema
 */
export const industrySchema = z.enum([
  'tech',
  'food',
  'fashion',
  'health',
  'creative',
  'finance',
  'education',
  'other',
]);

/**
 * Brand kit input validation schema
 */
export const brandKitInputSchema = z.object({
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .max(50, 'Business name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9\s&'-]+$/, 'Business name contains invalid characters'),
  businessDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be 500 characters or less'),
  industry: industrySchema,
});

/**
 * Hex color validation schema
 */
export const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format');

/**
 * Color palette validation schema
 */
export const colorPaletteSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  accent: hexColorSchema,
  neutral: hexColorSchema,
  background: hexColorSchema,
});

/**
 * Font validation schema
 */
export const fontSchema = z.object({
  name: z.string().min(1),
  family: z.string().min(1),
  url: z.string().url(),
  category: z.enum(['serif', 'sans-serif', 'display', 'handwriting', 'monospace']),
});

/**
 * Font pairing validation schema
 */
export const fontPairingSchema = z.object({
  primary: fontSchema,
  secondary: fontSchema,
});

/**
 * Logo validation schema
 */
export const logoSchema = z.object({
  url: z.string().url(),
  prompt: z.string().min(1),
});

/**
 * Complete brand kit validation schema
 */
export const brandKitSchema = z.object({
  businessName: z.string().min(1),
  industry: industrySchema,
  logo: logoSchema,
  colors: colorPaletteSchema,
  fonts: fontPairingSchema,
  tagline: z.string().min(1).max(200),
  generatedAt: z.string().datetime(),
});

/**
 * Environment variables validation schema
 */
export const envSchema = z.object({
  HUGGINGFACE_API_KEY: z.string().min(1, 'Hugging Face API key is required'),
  OPENAI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Brand Kit Generator'),
});

/**
 * Type inference helpers
 */
export type BrandKitInputType = z.infer<typeof brandKitInputSchema>;
export type ColorPaletteType = z.infer<typeof colorPaletteSchema>;
export type FontPairingType = z.infer<typeof fontPairingSchema>;
export type BrandKitType = z.infer<typeof brandKitSchema>;
export type IndustryType = z.infer<typeof industrySchema>;
