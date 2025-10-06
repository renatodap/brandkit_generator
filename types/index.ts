/**
 * Industry categories for brand generation
 */
export type Industry =
  | 'tech'
  | 'food'
  | 'fashion'
  | 'health'
  | 'creative'
  | 'finance'
  | 'education'
  | 'other';

/**
 * Input for brand kit generation
 */
export interface BrandKitInput {
  businessName: string;
  businessDescription: string;
  industry: Industry;
}

/**
 * Color palette with hex values
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  background: string;
}

/**
 * Font pairing recommendation
 */
export interface FontPairing {
  primary: {
    name: string;
    family: string;
    url: string;
    category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  };
  secondary: {
    name: string;
    family: string;
    url: string;
    category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  };
}

/**
 * Complete brand kit output
 */
export interface BrandKit {
  id?: string;
  businessName: string;
  businessDescription: string;
  industry: Industry;
  logo: {
    url: string;
    svgCode?: string;
  } | null;
  colors: ColorPalette;
  fonts: FontPairing;
  tagline: string;
  justifications?: {
    colors?: string;
    fonts?: string;
    logo?: string;
  };
  generatedAt: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Error response from API
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

/**
 * Logo generation parameters
 */
export interface LogoGenerationParams {
  businessName: string;
  industry: Industry;
  description: string;
}

/**
 * Tagline generation parameters
 */
export interface TaglineGenerationParams {
  businessName: string;
  industry: Industry;
  description: string;
}

/**
 * Color palette generation parameters
 */
export interface ColorPaletteParams {
  businessName: string;
  industry: Industry;
  description: string;
}

/**
 * Font pairing parameters
 */
export interface FontPairingParams {
  industry: Industry;
  businessName: string;
  description?: string;
}

/**
 * Download bundle contents
 */
export interface DownloadBundle {
  logoBlob: Blob;
  brandKitInfo: string;
  htmlPreview: string;
}

/**
 * Logo generation options
 */
export type LogoOption = 'generate' | 'upload' | 'skip';

/**
 * Color palette generation options
 */
export type ColorOption = 'generate' | 'existing';

/**
 * Typography generation options
 */
export type FontOption = 'generate' | 'existing';

/**
 * Style preferences for brand generation
 */
export type StylePreference =
  | 'modern'
  | 'classic'
  | 'minimalist'
  | 'bold'
  | 'playful'
  | 'elegant'
  | 'vintage'
  | 'futuristic';

/**
 * Color mood preferences
 */
export type ColorMood =
  | 'vibrant'
  | 'muted'
  | 'warm'
  | 'cool'
  | 'monochrome'
  | 'pastel'
  | 'earth'
  | 'neon';

/**
 * Target audience types
 */
export type TargetAudience =
  | 'b2b'
  | 'b2c'
  | 'gen-z'
  | 'millennial'
  | 'gen-x'
  | 'boomer'
  | 'luxury'
  | 'budget';

/**
 * Brand tone preferences
 */
export type BrandTone =
  | 'professional'
  | 'playful'
  | 'serious'
  | 'friendly'
  | 'authoritative'
  | 'approachable'
  | 'innovative'
  | 'traditional';

/**
 * Advanced generation options
 */
export interface AdvancedOptions {
  styles?: StylePreference[];
  colorMood?: ColorMood;
  targetAudience?: TargetAudience;
  brandTones?: BrandTone[];
}

/**
 * Enhanced input for brand kit generation with user control
 */
export interface EnhancedBrandKitInput {
  // Base fields
  businessName: string;
  businessDescription: string;
  industry: Industry;

  // Optional contextual notes
  notes?: string;

  // Logo options
  logoOption: LogoOption;
  logoBase64?: string; // Base64 encoded file when logoOption === 'upload'

  // Color palette options
  colorOption: ColorOption;
  existingColors?: ColorPalette;

  // Typography options
  fontOption: FontOption;
  existingFonts?: {
    primary: {
      name: string;
      category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
      url?: string;
    };
    secondary: {
      name: string;
      category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
      url?: string;
    };
  };

  // Advanced options
  advancedOptions?: AdvancedOptions;
}
