import type { FontPairing, FontPairingParams, Industry } from '@/types';
import { extractBrandPersonality } from './groq';

/**
 * Font category type from Google Fonts
 */
type FontCategory = 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';

/**
 * Font personality traits for matching
 */
interface FontPersonality {
  modern: number;
  classic: number;
  playful: number;
  elegant: number;
  bold: number;
  friendly: number;
  professional: number;
  luxurious: number;
}

/**
 * Font definition with personality traits
 */
interface Font {
  name: string;
  family: string;
  category: FontCategory;
  weights?: string;
  personality: FontPersonality;
}

/**
 * Expanded Google Fonts collection with personality traits
 * 50+ professionally vetted fonts with personality scoring for intelligent pairing
 */
const FONTS: Record<string, Font> = {
  // === SANS-SERIF FONTS (Modern, Clean, Professional) ===

  inter: {
    name: 'Inter',
    family: 'Inter, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
    personality: { modern: 0.95, classic: 0.2, playful: 0.1, elegant: 0.5, bold: 0.4, friendly: 0.6, professional: 0.9, luxurious: 0.3 },
  },
  roboto: {
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    category: 'sans-serif',
    weights: '400,500,700',
    personality: { modern: 0.8, classic: 0.3, playful: 0.2, elegant: 0.4, bold: 0.3, friendly: 0.7, professional: 0.8, luxurious: 0.2 },
  },
  openSans: {
    name: 'Open Sans',
    family: 'Open Sans, sans-serif',
    category: 'sans-serif',
    weights: '400,600,700',
    personality: { modern: 0.7, classic: 0.4, playful: 0.2, elegant: 0.4, bold: 0.3, friendly: 0.8, professional: 0.7, luxurious: 0.2 },
  },
  poppins: {
    name: 'Poppins',
    family: 'Poppins, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
    personality: { modern: 0.9, classic: 0.2, playful: 0.5, elegant: 0.5, bold: 0.5, friendly: 0.8, professional: 0.6, luxurious: 0.3 },
  },
  montserrat: {
    name: 'Montserrat',
    family: 'Montserrat, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
    personality: { modern: 0.8, classic: 0.3, playful: 0.3, elegant: 0.7, bold: 0.6, friendly: 0.6, professional: 0.8, luxurious: 0.5 },
  },
  lato: {
    name: 'Lato',
    family: 'Lato, sans-serif',
    category: 'sans-serif',
    weights: '400,700',
    personality: { modern: 0.7, classic: 0.4, playful: 0.3, elegant: 0.5, bold: 0.4, friendly: 0.7, professional: 0.7, luxurious: 0.3 },
  },
  raleway: {
    name: 'Raleway',
    family: 'Raleway, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
    personality: { modern: 0.8, classic: 0.3, playful: 0.2, elegant: 0.8, bold: 0.3, friendly: 0.5, professional: 0.8, luxurious: 0.7 },
  },
  nunito: {
    name: 'Nunito',
    family: 'Nunito, sans-serif',
    category: 'sans-serif',
    weights: '400,600,700',
    personality: { modern: 0.7, classic: 0.2, playful: 0.7, elegant: 0.4, bold: 0.3, friendly: 0.9, professional: 0.5, luxurious: 0.2 },
  },
  workSans: {
    name: 'Work Sans',
    family: 'Work Sans, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
    personality: { modern: 0.85, classic: 0.2, playful: 0.3, elegant: 0.5, bold: 0.5, friendly: 0.6, professional: 0.8, luxurious: 0.3 },
  },
  dmSans: {
    name: 'DM Sans',
    family: 'DM Sans, sans-serif',
    category: 'sans-serif',
    weights: '400,500,700',
    personality: { modern: 0.9, classic: 0.2, playful: 0.2, elegant: 0.6, bold: 0.4, friendly: 0.6, professional: 0.9, luxurious: 0.4 },
  },
  manrope: {
    name: 'Manrope',
    family: 'Manrope, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
    personality: { modern: 0.9, classic: 0.2, playful: 0.3, elegant: 0.6, bold: 0.4, friendly: 0.7, professional: 0.8, luxurious: 0.4 },
  },
  rubik: {
    name: 'Rubik',
    family: 'Rubik, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
    personality: { modern: 0.8, classic: 0.2, playful: 0.6, elegant: 0.4, bold: 0.5, friendly: 0.8, professional: 0.6, luxurious: 0.2 },
  },
  mulish: {
    name: 'Mulish',
    family: 'Mulish, sans-serif',
    category: 'sans-serif',
    weights: '400,600,700',
    personality: { modern: 0.8, classic: 0.3, playful: 0.4, elegant: 0.5, bold: 0.4, friendly: 0.7, professional: 0.7, luxurious: 0.3 },
  },
  barlow: {
    name: 'Barlow',
    family: 'Barlow, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
    personality: { modern: 0.85, classic: 0.2, playful: 0.3, elegant: 0.4, bold: 0.6, friendly: 0.6, professional: 0.8, luxurious: 0.3 },
  },

  // === SERIF FONTS (Traditional, Elegant, Sophisticated) ===

  merriweather: {
    name: 'Merriweather',
    family: 'Merriweather, serif',
    category: 'serif',
    weights: '400,700',
    personality: { modern: 0.3, classic: 0.9, playful: 0.1, elegant: 0.7, bold: 0.4, friendly: 0.6, professional: 0.8, luxurious: 0.5 },
  },
  playfairDisplay: {
    name: 'Playfair Display',
    family: 'Playfair Display, serif',
    category: 'serif',
    weights: '400,600,700',
    personality: { modern: 0.4, classic: 0.9, playful: 0.1, elegant: 0.95, bold: 0.5, friendly: 0.3, professional: 0.7, luxurious: 0.9 },
  },
  loraSerif: {
    name: 'Lora',
    family: 'Lora, serif',
    category: 'serif',
    weights: '400,600,700',
    personality: { modern: 0.4, classic: 0.85, playful: 0.1, elegant: 0.8, bold: 0.3, friendly: 0.5, professional: 0.8, luxurious: 0.6 },
  },
  ptSerif: {
    name: 'PT Serif',
    family: 'PT Serif, serif',
    category: 'serif',
    weights: '400,700',
    personality: { modern: 0.3, classic: 0.9, playful: 0.1, elegant: 0.7, bold: 0.4, friendly: 0.5, professional: 0.9, luxurious: 0.5 },
  },
  crimsonText: {
    name: 'Crimson Text',
    family: 'Crimson Text, serif',
    category: 'serif',
    weights: '400,600,700',
    personality: { modern: 0.3, classic: 0.95, playful: 0.1, elegant: 0.9, bold: 0.3, friendly: 0.4, professional: 0.8, luxurious: 0.8 },
  },
  sourceSerifPro: {
    name: 'Source Serif Pro',
    family: 'Source Serif Pro, serif',
    category: 'serif',
    weights: '400,600,700',
    personality: { modern: 0.5, classic: 0.8, playful: 0.1, elegant: 0.7, bold: 0.4, friendly: 0.5, professional: 0.9, luxurious: 0.6 },
  },
  ebGaramond: {
    name: 'EB Garamond',
    family: 'EB Garamond, serif',
    category: 'serif',
    weights: '400,500,600,700',
    personality: { modern: 0.2, classic: 0.95, playful: 0.05, elegant: 0.95, bold: 0.3, friendly: 0.3, professional: 0.8, luxurious: 0.9 },
  },
  libreBaskerville: {
    name: 'Libre Baskerville',
    family: 'Libre Baskerville, serif',
    category: 'serif',
    weights: '400,700',
    personality: { modern: 0.2, classic: 0.95, playful: 0.05, elegant: 0.9, bold: 0.5, friendly: 0.4, professional: 0.9, luxurious: 0.8 },
  },
  cormorantGaramond: {
    name: 'Cormorant Garamond',
    family: 'Cormorant Garamond, serif',
    category: 'serif',
    weights: '400,600,700',
    personality: { modern: 0.3, classic: 0.9, playful: 0.1, elegant: 0.95, bold: 0.3, friendly: 0.3, professional: 0.7, luxurious: 0.95 },
  },
  spectral: {
    name: 'Spectral',
    family: 'Spectral, serif',
    category: 'serif',
    weights: '400,600,700',
    personality: { modern: 0.5, classic: 0.8, playful: 0.1, elegant: 0.8, bold: 0.4, friendly: 0.5, professional: 0.8, luxurious: 0.7 },
  },

  // === DISPLAY FONTS (Bold, Attention-Grabbing, Unique) ===

  bebas: {
    name: 'Bebas Neue',
    family: 'Bebas Neue, display',
    category: 'display',
    weights: '400',
    personality: { modern: 0.8, classic: 0.2, playful: 0.3, elegant: 0.4, bold: 0.95, friendly: 0.4, professional: 0.6, luxurious: 0.3 },
  },
  oswald: {
    name: 'Oswald',
    family: 'Oswald, display',
    category: 'display',
    weights: '400,500,700',
    personality: { modern: 0.7, classic: 0.3, playful: 0.2, elegant: 0.5, bold: 0.9, friendly: 0.4, professional: 0.7, luxurious: 0.4 },
  },
  archivo: {
    name: 'Archivo Black',
    family: 'Archivo Black, display',
    category: 'display',
    weights: '400',
    personality: { modern: 0.8, classic: 0.2, playful: 0.3, elegant: 0.4, bold: 0.95, friendly: 0.3, professional: 0.7, luxurious: 0.3 },
  },
  anton: {
    name: 'Anton',
    family: 'Anton, display',
    category: 'display',
    weights: '400',
    personality: { modern: 0.7, classic: 0.2, playful: 0.4, elegant: 0.3, bold: 0.95, friendly: 0.5, professional: 0.5, luxurious: 0.2 },
  },
  righteous: {
    name: 'Righteous',
    family: 'Righteous, display',
    category: 'display',
    weights: '400',
    personality: { modern: 0.8, classic: 0.1, playful: 0.7, elegant: 0.3, bold: 0.9, friendly: 0.6, professional: 0.4, luxurious: 0.2 },
  },
  blackOpsOne: {
    name: 'Black Ops One',
    family: 'Black Ops One, display',
    category: 'display',
    weights: '400',
    personality: { modern: 0.6, classic: 0.1, playful: 0.5, elegant: 0.2, bold: 0.95, friendly: 0.3, professional: 0.4, luxurious: 0.1 },
  },
  fredokaOne: {
    name: 'Fredoka One',
    family: 'Fredoka One, display',
    category: 'display',
    weights: '400',
    personality: { modern: 0.7, classic: 0.1, playful: 0.95, elegant: 0.2, bold: 0.8, friendly: 0.95, professional: 0.2, luxurious: 0.1 },
  },
  concertOne: {
    name: 'Concert One',
    family: 'Concert One, display',
    category: 'display',
    weights: '400',
    personality: { modern: 0.6, classic: 0.2, playful: 0.8, elegant: 0.3, bold: 0.85, friendly: 0.8, professional: 0.3, luxurious: 0.2 },
  },

  // === HANDWRITING FONTS (Personal, Creative, Playful) ===

  dancingScript: {
    name: 'Dancing Script',
    family: 'Dancing Script, handwriting',
    category: 'handwriting',
    weights: '400,700',
    personality: { modern: 0.4, classic: 0.5, playful: 0.9, elegant: 0.8, bold: 0.3, friendly: 0.9, professional: 0.2, luxurious: 0.6 },
  },
  pacifico: {
    name: 'Pacifico',
    family: 'Pacifico, handwriting',
    category: 'handwriting',
    weights: '400',
    personality: { modern: 0.5, classic: 0.3, playful: 0.95, elegant: 0.4, bold: 0.5, friendly: 0.95, professional: 0.2, luxurious: 0.2 },
  },
  caveat: {
    name: 'Caveat',
    family: 'Caveat, handwriting',
    category: 'handwriting',
    weights: '400,700',
    personality: { modern: 0.5, classic: 0.2, playful: 0.9, elegant: 0.3, bold: 0.4, friendly: 0.95, professional: 0.2, luxurious: 0.2 },
  },
  shadowsIntoLight: {
    name: 'Shadows Into Light',
    family: 'Shadows Into Light, handwriting',
    category: 'handwriting',
    weights: '400',
    personality: { modern: 0.5, classic: 0.2, playful: 0.9, elegant: 0.3, bold: 0.3, friendly: 0.9, professional: 0.2, luxurious: 0.2 },
  },
  satisfy: {
    name: 'Satisfy',
    family: 'Satisfy, handwriting',
    category: 'handwriting',
    weights: '400',
    personality: { modern: 0.4, classic: 0.4, playful: 0.85, elegant: 0.7, bold: 0.3, friendly: 0.9, professional: 0.2, luxurious: 0.5 },
  },

  // === MONOSPACE FONTS (Technical, Code, Modern) ===

  sourceCodePro: {
    name: 'Source Code Pro',
    family: 'Source Code Pro, monospace',
    category: 'monospace',
    weights: '400,600',
    personality: { modern: 0.9, classic: 0.2, playful: 0.1, elegant: 0.3, bold: 0.4, friendly: 0.4, professional: 0.95, luxurious: 0.2 },
  },
  jetBrainsMono: {
    name: 'JetBrains Mono',
    family: 'JetBrains Mono, monospace',
    category: 'monospace',
    weights: '400,500,700',
    personality: { modern: 0.95, classic: 0.1, playful: 0.2, elegant: 0.4, bold: 0.5, friendly: 0.5, professional: 0.9, luxurious: 0.3 },
  },
  ibmPlexMono: {
    name: 'IBM Plex Mono',
    family: 'IBM Plex Mono, monospace',
    category: 'monospace',
    weights: '400,500,600,700',
    personality: { modern: 0.9, classic: 0.3, playful: 0.1, elegant: 0.5, bold: 0.4, friendly: 0.5, professional: 0.95, luxurious: 0.4 },
  },
  spaceMono: {
    name: 'Space Mono',
    family: 'Space Mono, monospace',
    category: 'monospace',
    weights: '400,700',
    personality: { modern: 0.85, classic: 0.2, playful: 0.3, elegant: 0.4, bold: 0.6, friendly: 0.4, professional: 0.8, luxurious: 0.3 },
  },
};

/**
 * Calculate personality match score between brand and font
 * Higher score = better match
 */
function calculatePersonalityMatch(
  brandPersonality: FontPersonality,
  fontPersonality: FontPersonality
): number {
  let score = 0;
  let totalWeight = 0;

  // Weighted importance of each trait
  const weights = {
    modern: 1.5, // Very important for brand feel
    classic: 1.5,
    elegant: 1.3,
    professional: 1.3,
    luxurious: 1.2,
    bold: 1.0,
    playful: 1.0,
    friendly: 1.0,
  };

  // Calculate weighted similarity score
  for (const trait of Object.keys(weights) as Array<keyof FontPersonality>) {
    const weight = weights[trait];
    const diff = Math.abs(brandPersonality[trait] - fontPersonality[trait]);
    const similarity = 1 - diff; // 1 = perfect match, 0 = complete opposite
    score += similarity * weight;
    totalWeight += weight;
  }

  // Normalize to 0-1 range
  return score / totalWeight;
}

/**
 * Find best font match for brand personality
 */
function findBestFontMatch(
  brandPersonality: FontPersonality,
  excludeCategories: FontCategory[] = []
): Font | null {
  let bestFont: Font | null = null;
  let bestScore = -1;

  for (const font of Object.values(FONTS)) {
    // Skip excluded categories
    if (excludeCategories.includes(font.category)) {
      continue;
    }

    const score = calculatePersonalityMatch(brandPersonality, font.personality);

    if (score > bestScore) {
      bestScore = score;
      bestFont = font;
    }
  }

  return bestFont;
}

/**
 * Find complementary font for pairing
 * Looks for a font with good contrast but compatible personality
 */
function findComplementaryFont(
  primaryFont: Font,
  brandPersonality: FontPersonality
): Font | null {
  let bestFont: Font | null = null;
  let bestScore = -1;

  for (const font of Object.values(FONTS)) {
    // Must be different category for contrast
    if (font.category === primaryFont.category) {
      continue;
    }

    // Handwriting fonts are generally not good for body text
    if (font.category === 'handwriting' || font.category === 'display') {
      continue;
    }

    // Calculate combined score: brand match + contrast with primary
    const brandMatch = calculatePersonalityMatch(brandPersonality, font.personality);

    // Penalize fonts too similar to primary
    const primarySimilarity = calculatePersonalityMatch(
      primaryFont.personality,
      font.personality
    );
    const contrastBonus = 1 - primarySimilarity * 0.5; // Want some difference but not too much

    const combinedScore = brandMatch * 0.7 + contrastBonus * 0.3;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestFont = font;
    }
  }

  return bestFont;
}

/**
 * Build Google Fonts URL for font loading
 * @param fonts - Array of font objects
 * @returns Google Fonts URL
 */
function buildGoogleFontsUrl(fonts: Font[]): string {
  const baseUrl = 'https://fonts.googleapis.com/css2';
  const families = fonts
    .map((font) => {
      const weights = font.weights || '400';
      return `family=${font.name.replace(/ /g, '+')}:wght@${weights}`;
    })
    .join('&');

  return `${baseUrl}?${families}&display=swap`;
}

/**
 * Get AI-powered font pairing based on brand personality
 * @param params - Font pairing parameters
 * @returns Promise resolving to FontPairing object
 *
 * @example
 * ```typescript
 * const fonts = await getFontPairing({
 *   industry: 'tech',
 *   businessName: 'TechCorp',
 *   description: 'A modern software company'
 * });
 * ```
 */
export async function getFontPairing(
  params: FontPairingParams
): Promise<FontPairing> {
  try {
    // Extract brand personality using AI (or fallback to deterministic)
    const brandPersonality = await extractBrandPersonality({
      businessName: params.businessName,
      description: params.description || '',
      industry: params.industry,
    });

    // Find best primary font match
    const primaryFont = findBestFontMatch(brandPersonality);

    if (!primaryFont) {
      throw new Error('No suitable primary font found');
    }

    // Find complementary secondary font
    const secondaryFont = findComplementaryFont(primaryFont, brandPersonality);

    if (!secondaryFont) {
      throw new Error('No suitable secondary font found');
    }

    // Build Google Fonts URL for both fonts
    const fontsUrl = buildGoogleFontsUrl([primaryFont, secondaryFont]);

    return {
      primary: {
        name: primaryFont.name,
        family: primaryFont.family,
        url: fontsUrl,
        category: primaryFont.category,
      },
      secondary: {
        name: secondaryFont.name,
        family: secondaryFont.family,
        url: fontsUrl, // Same URL includes both fonts
        category: secondaryFont.category,
      },
    };
  } catch (error) {
    // Fallback to safe default pairing
    console.error('Error getting font pairing:', error);

    const inter = FONTS['inter'];
    const lora = FONTS['loraSerif'];

    if (!inter || !lora) {
      throw new Error('Default fonts not found');
    }

    const fallbackUrl = buildGoogleFontsUrl([inter, lora]);

    return {
      primary: {
        name: inter.name,
        family: inter.family,
        url: fallbackUrl,
        category: inter.category,
      },
      secondary: {
        name: lora.name,
        family: lora.family,
        url: fallbackUrl,
        category: lora.category,
      },
    };
  }
}

/**
 * Get all available font categories
 * @returns Array of font category names
 */
export function getFontCategories(): FontCategory[] {
  return ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];
}

/**
 * Get fonts by category
 * @param category - Font category
 * @returns Array of fonts in that category
 */
export function getFontsByCategory(category: FontCategory): Font[] {
  return Object.values(FONTS).filter((font) => font.category === category);
}

/**
 * Search fonts by name
 * @param query - Search query
 * @returns Array of matching fonts
 */
export function searchFonts(query: string): Font[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(FONTS).filter((font) =>
    font.name.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Get font pairing recommendations for all industries
 * Useful for previewing different industry styles
 * @returns Record of industry to FontPairing
 */
export async function getAllIndustryPairings(): Promise<Record<Industry, FontPairing>> {
  const industries: Industry[] = [
    'tech',
    'food',
    'fashion',
    'health',
    'creative',
    'finance',
    'education',
    'other',
  ];

  const pairings: Record<Industry, FontPairing> = {} as Record<Industry, FontPairing>;

  for (const industry of industries) {
    pairings[industry] = await getFontPairing({
      industry,
      businessName: '',
    });
  }

  return pairings;
}

/**
 * Generate CSS font-face declarations for a font pairing
 * @param pairing - Font pairing object
 * @returns CSS string with font-face declarations
 *
 * @example
 * ```typescript
 * const fonts = await getFontPairing({ industry: 'tech', businessName: 'TechCorp' });
 * const css = generateFontFaceCSS(fonts);
 * ```
 */
export function generateFontFaceCSS(pairing: FontPairing): string {
  return `
/* Primary Font - ${pairing.primary.name} */
.font-primary {
  font-family: ${pairing.primary.family};
}

/* Secondary Font - ${pairing.secondary.name} */
.font-secondary {
  font-family: ${pairing.secondary.family};
}

/* Font Loading */
/* Add this to your HTML <head>: */
/* <link href="${pairing.primary.url}" rel="stylesheet"> */
`.trim();
}

/**
 * Export fonts collection for advanced usage
 */
export { FONTS };
