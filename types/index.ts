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
  businessName: string;
  businessDescription: string;
  industry: Industry;
  logo: {
    url: string;
    prompt: string;
  };
  colors: ColorPalette;
  fonts: FontPairing;
  tagline: string;
  justifications?: {
    colors?: string;
    fonts?: string;
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
