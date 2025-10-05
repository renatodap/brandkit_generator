import type { FontPairing, FontPairingParams, Industry } from '@/types';

/**
 * Font category type from Google Fonts
 */
type FontCategory = 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';

/**
 * Font definition
 */
interface Font {
  name: string;
  family: string;
  category: FontCategory;
  weights?: string;
}

/**
 * Curated Google Fonts collection
 * These are free, popular, and professionally vetted fonts
 */
const FONTS: Record<string, Font> = {
  // Sans-serif fonts (modern, clean)
  inter: {
    name: 'Inter',
    family: 'Inter, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
  },
  roboto: {
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    category: 'sans-serif',
    weights: '400,500,700',
  },
  openSans: {
    name: 'Open Sans',
    family: 'Open Sans, sans-serif',
    category: 'sans-serif',
    weights: '400,600,700',
  },
  poppins: {
    name: 'Poppins',
    family: 'Poppins, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
  },
  montserrat: {
    name: 'Montserrat',
    family: 'Montserrat, sans-serif',
    category: 'sans-serif',
    weights: '400,500,600,700',
  },
  lato: {
    name: 'Lato',
    family: 'Lato, sans-serif',
    category: 'sans-serif',
    weights: '400,700',
  },

  // Serif fonts (traditional, elegant)
  merriweather: {
    name: 'Merriweather',
    family: 'Merriweather, serif',
    category: 'serif',
    weights: '400,700',
  },
  playfairDisplay: {
    name: 'Playfair Display',
    family: 'Playfair Display, serif',
    category: 'serif',
    weights: '400,600,700',
  },
  loraSerif: {
    name: 'Lora',
    family: 'Lora, serif',
    category: 'serif',
    weights: '400,600,700',
  },
  ptSerif: {
    name: 'PT Serif',
    family: 'PT Serif, serif',
    category: 'serif',
    weights: '400,700',
  },

  // Display fonts (attention-grabbing, unique)
  bebas: {
    name: 'Bebas Neue',
    family: 'Bebas Neue, display',
    category: 'display',
    weights: '400',
  },
  oswald: {
    name: 'Oswald',
    family: 'Oswald, display',
    category: 'display',
    weights: '400,500,700',
  },
  archivo: {
    name: 'Archivo Black',
    family: 'Archivo Black, display',
    category: 'display',
    weights: '400',
  },

  // Handwriting fonts (personal, creative)
  dancingScript: {
    name: 'Dancing Script',
    family: 'Dancing Script, handwriting',
    category: 'handwriting',
    weights: '400,700',
  },
  pacifico: {
    name: 'Pacifico',
    family: 'Pacifico, handwriting',
    category: 'handwriting',
    weights: '400',
  },

  // Monospace fonts (technical, code-like)
  sourceCodePro: {
    name: 'Source Code Pro',
    family: 'Source Code Pro, monospace',
    category: 'monospace',
    weights: '400,600',
  },
};

/**
 * Industry-specific font pairings
 * Each industry has carefully selected font combinations that work well together
 */
const industryFontPairings: Record<Industry, { primary: string; secondary: string }> = {
  tech: {
    primary: 'inter', // Clean, modern sans-serif
    secondary: 'sourceCodePro', // Technical monospace
  },
  food: {
    primary: 'poppins', // Friendly, approachable
    secondary: 'loraSerif', // Elegant serif for description
  },
  fashion: {
    primary: 'playfairDisplay', // Elegant, sophisticated serif
    secondary: 'montserrat', // Modern sans-serif for body
  },
  health: {
    primary: 'roboto', // Professional, clean
    secondary: 'merriweather', // Trustworthy serif
  },
  creative: {
    primary: 'oswald', // Bold display font
    secondary: 'openSans', // Readable sans-serif
  },
  finance: {
    primary: 'montserrat', // Professional, stable
    secondary: 'ptSerif', // Traditional serif
  },
  education: {
    primary: 'poppins', // Friendly, approachable
    secondary: 'merriweather', // Readable serif for content
  },
  other: {
    primary: 'inter', // Versatile, modern
    secondary: 'loraSerif', // Elegant serif
  },
};

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
 * Get font pairing recommendation for a given industry
 * @param params - Font pairing parameters
 * @returns Promise resolving to FontPairing object
 *
 * @example
 * ```typescript
 * const fonts = await getFontPairing({
 *   industry: 'tech',
 *   businessName: 'TechCorp'
 * });
 * ```
 */
export async function getFontPairing(
  params: FontPairingParams
): Promise<FontPairing> {
  try {
    const { industry } = params;

    // Get the recommended pairing for this industry
    const pairing = industryFontPairings[industry] || industryFontPairings.other;

    const primaryFontKey = pairing.primary;
    const secondaryFontKey = pairing.secondary;

    const primaryFont = FONTS[primaryFontKey];
    const secondaryFont = FONTS[secondaryFontKey];

    if (!primaryFont || !secondaryFont) {
      throw new Error('Font pairing configuration error');
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
