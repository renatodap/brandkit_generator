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
 * Logo option validation schema
 */
export const logoOptionSchema = z.enum(['generate', 'upload', 'skip']);

/**
 * Color option validation schema
 */
export const colorOptionSchema = z.enum(['generate', 'existing']);

/**
 * Font option validation schema
 */
export const fontOptionSchema = z.enum(['generate', 'existing']);

/**
 * Style preference validation schema
 */
export const stylePreferenceSchema = z.enum([
  'modern',
  'classic',
  'minimalist',
  'bold',
  'playful',
  'elegant',
  'vintage',
  'futuristic',
]);

/**
 * Color mood validation schema
 */
export const colorMoodSchema = z.enum([
  'vibrant',
  'muted',
  'warm',
  'cool',
  'monochrome',
  'pastel',
  'earth',
  'neon',
]);

/**
 * Target audience validation schema
 */
export const targetAudienceSchema = z.enum([
  'b2b',
  'b2c',
  'gen-z',
  'millennial',
  'gen-x',
  'boomer',
  'luxury',
  'budget',
]);

/**
 * Brand tone validation schema
 */
export const brandToneSchema = z.enum([
  'professional',
  'playful',
  'serious',
  'friendly',
  'authoritative',
  'approachable',
  'innovative',
  'traditional',
]);

/**
 * Advanced options validation schema
 */
export const advancedOptionsSchema = z
  .object({
    styles: z.array(stylePreferenceSchema).optional(),
    colorMood: colorMoodSchema.optional(),
    targetAudience: targetAudienceSchema.optional(),
    brandTones: z.array(brandToneSchema).optional(),
  })
  .optional();

/**
 * Existing font validation schema
 */
export const existingFontSchema = z.object({
  name: z.string().min(1, 'Font name is required').max(50, 'Font name too long'),
  category: z.enum(['serif', 'sans-serif', 'display', 'handwriting', 'monospace']),
  url: z.string().url('Invalid font URL').optional(),
});

/**
 * Existing fonts pair validation schema
 */
export const existingFontsSchema = z.object({
  primary: existingFontSchema,
  secondary: existingFontSchema,
});

/**
 * Enhanced brand kit input validation schema
 */
export const enhancedBrandKitInputSchema = z
  .object({
    // Business ID (required for authenticated users creating brand kits)
    businessId: z.string().uuid('Business ID must be a valid UUID'),

    // Base fields
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

    // Optional contextual notes
    notes: z
      .string()
      .max(500, 'Notes must be 500 characters or less')
      .optional()
      .or(z.literal('')),

    // Logo options
    logoOption: logoOptionSchema,
    logoBase64: z.string().optional(),

    // Color palette options
    colorOption: colorOptionSchema,
    existingColors: colorPaletteSchema.optional(),

    // Typography options
    fontOption: fontOptionSchema,
    existingFonts: existingFontsSchema.optional(),

    // Advanced options
    advancedOptions: advancedOptionsSchema,
  })
  .superRefine((data, ctx) => {
    // Validate logo upload if option is 'upload'
    if (data.logoOption === 'upload' && !data.logoBase64) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Logo file is required when upload option is selected',
        path: ['logoBase64'],
      });
    }

    // Validate logoBase64 format if provided
    if (data.logoBase64 && !data.logoBase64.startsWith('data:image/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Logo must be a valid base64 image data URL',
        path: ['logoBase64'],
      });
    }

    // Validate existing colors if option is 'existing'
    if (data.colorOption === 'existing' && !data.existingColors) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Existing colors are required when existing option is selected',
        path: ['existingColors'],
      });
    }

    // Validate existing fonts if option is 'existing'
    if (data.fontOption === 'existing' && !data.existingFonts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Existing fonts are required when existing option is selected',
        path: ['existingFonts'],
      });
    }
  });

/**
 * Type inference helpers
 */
export type BrandKitInputType = z.infer<typeof brandKitInputSchema>;
export type ColorPaletteType = z.infer<typeof colorPaletteSchema>;
export type FontPairingType = z.infer<typeof fontPairingSchema>;
export type BrandKitType = z.infer<typeof brandKitSchema>;
export type IndustryType = z.infer<typeof industrySchema>;
export type EnhancedBrandKitInputType = z.infer<typeof enhancedBrandKitInputSchema>;
export type LogoOptionType = z.infer<typeof logoOptionSchema>;
export type ColorOptionType = z.infer<typeof colorOptionSchema>;
export type FontOptionType = z.infer<typeof fontOptionSchema>;
export type AdvancedOptionsType = z.infer<typeof advancedOptionsSchema>;
