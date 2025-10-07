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
 * Business entity
 * Users can create multiple businesses, each with one brand kit
 */
export interface Business {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
}

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
  business_id?: string; // Foreign key to businesses table
  businessName: string;
  businessDescription?: string;
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
 * Brand kit with associated business information
 */
export interface BrandKitWithBusiness extends BrandKit {
  business: Business;
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

/**
 * Recall Notebook Integration Types
 */

/**
 * User's recall-notebook API key
 */
export interface RecallApiKey {
  id: string;
  user_id: string;
  api_key: string;
  recall_user_id?: string;
  is_active: boolean;
  last_verified_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Recall-notebook collection data from API
 */
export interface RecallCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  collection_type: string;
  metadata?: Record<string, any>;
  source_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Recall-notebook source data from API
 */
export interface RecallSource {
  id: string;
  user_id: string;
  title: string;
  content_type: string;
  original_content: string;
  url?: string;
  source_type: string;
  tags?: string[];
  metadata?: Record<string, any>;
  summary?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Recall-notebook content chunk (for semantic search)
 */
export interface RecallContentChunk {
  id: string;
  source_id: string;
  chunk_index: number;
  content: string;
  metadata?: Record<string, any>;
  relevance_score?: number;
}

/**
 * Business collection link
 */
export interface BusinessCollection {
  id: string;
  business_id: string;
  collection_id: string;
  collection_name: string;
  collection_description?: string;
  added_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Cached knowledge from recall-notebook
 */
export interface BusinessKnowledgeCache {
  id: string;
  business_collection_id: string;
  cached_data: {
    sources: Array<{
      id: string;
      title: string;
      content: string;
      summary?: string;
      tags?: string[];
    }>;
  };
  source_count: number;
  total_chunks: number;
  last_synced_at: string;
  cache_expires_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request to link a collection to a business
 */
export interface LinkCollectionRequest {
  business_id: string;
  collection_id: string;
  recall_api_key: string;
}

/**
 * Request to search knowledge for brand generation
 */
export interface KnowledgeSearchRequest {
  business_id: string;
  query: string;
  max_results?: number;
}

/**
 * Knowledge search result
 */
export interface KnowledgeSearchResult {
  sources: Array<{
    id: string;
    title: string;
    content: string;
    relevance_score: number;
    tags?: string[];
  }>;
  total_count: number;
  from_cache: boolean;
}

/**
 * Recall API response wrapper
 */
export interface RecallApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
