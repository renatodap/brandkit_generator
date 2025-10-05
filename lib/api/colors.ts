import type { ColorPalette, ColorPaletteParams } from '@/types';
import { extractColorPreferences } from './groq';

/**
 * Color theory utilities
 */
class ColorUtils {
  /**
   * Convert hex color to HSL
   */
  static hexToHSL(hex: string): { h: number; s: number; l: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }

    let r = parseInt(result[1] ?? '0', 16) / 255;
    let g = parseInt(result[2] ?? '0', 16) / 255;
    let b = parseInt(result[3] ?? '0', 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Convert HSL to hex color
   */
  static hslToHex(h: number, s: number, l: number): string {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Generate a complementary color (opposite on color wheel)
   */
  static getComplementary(hex: string): string {
    const hsl = this.hexToHSL(hex);
    const complementaryH = (hsl.h + 180) % 360;
    return this.hslToHex(complementaryH, hsl.s, hsl.l);
  }

  /**
   * Generate analogous colors (adjacent on color wheel)
   */
  static getAnalogous(hex: string, offset: number = 30): string[] {
    const hsl = this.hexToHSL(hex);
    return [
      this.hslToHex((hsl.h + offset) % 360, hsl.s, hsl.l),
      this.hslToHex((hsl.h - offset + 360) % 360, hsl.s, hsl.l),
    ];
  }

  /**
   * Generate triadic colors (120 degrees apart)
   */
  static getTriadic(hex: string): string[] {
    const hsl = this.hexToHSL(hex);
    return [
      this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
    ];
  }

  /**
   * Adjust lightness of a color
   */
  static adjustLightness(hex: string, amount: number): string {
    const hsl = this.hexToHSL(hex);
    const newL = Math.max(0, Math.min(100, hsl.l + amount));
    return this.hslToHex(hsl.h, hsl.s, newL);
  }

  /**
   * Adjust saturation of a color
   */
  static adjustSaturation(hex: string, amount: number): string {
    const hsl = this.hexToHSL(hex);
    const newS = Math.max(0, Math.min(100, hsl.s + amount));
    return this.hslToHex(hsl.h, newS, hsl.l);
  }
}

/**
 * Color Psychology Library - 2025 Enhanced
 * Maps emotional keywords to color palettes with scientific backing
 */
const colorPsychology = {
  // Trust & Professionalism
  trust: ['#0066FF', '#1E40AF', '#3B82F6', '#2563EB'],
  professional: ['#1F2937', '#374151', '#4B5563', '#6B7280'],
  stable: ['#1565C0', '#0D47A1', '#1976D2', '#2196F3'],

  // Energy & Dynamism
  energy: ['#FF6B35', '#F97316', '#EA580C', '#FF5722'],
  dynamic: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
  vibrant: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE047'],

  // Growth & Nature
  growth: ['#10B981', '#059669', '#047857', '#065F46'],
  organic: ['#92400E', '#78350F', '#8B7355', '#A0826D'],
  fresh: ['#22C55E', '#16A34A', '#15803D', '#166534'],

  // Luxury & Elegance
  luxury: ['#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'],
  elegant: ['#EC4899', '#DB2777', '#BE185D', '#9F1239'],
  premium: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],

  // Calm & Trust
  calm: ['#06B6D4', '#0891B2', '#0E7490', '#155E75'],
  wellness: ['#14B8A6', '#0D9488', '#0F766E', '#115E59'],
  peaceful: ['#A5B4FC', '#818CF8', '#6366F1', '#4F46E5'],

  // Creative & Playful
  creative: ['#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8'],
  playful: ['#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'],
  artistic: ['#C026D3', '#D946EF', '#E879F9', '#F0ABFC'],
};

/**
 * 2025 Color Trends - Research-backed modern palettes
 */
const colorTrends2025 = {
  // Earthy/Organic (36% of consumers expect this in 2025)
  earthy: {
    primary: ['#92400E', '#78350F', '#6B4423', '#8B7355'],
    sage: ['#84A98C', '#52796F', '#6A994E', '#A7C957'],
    terracotta: ['#D4A574', '#C08552', '#BC6C25', '#DDA15E'],
  },
  // Futuristic/AI-inspired (metallic, iridescent)
  futuristic: {
    metallic: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8'],
    iridescent: ['#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6'],
    neon: ['#34D399', '#10B981', '#06B6D4', '#3B82F6'],
  },
  // Classic/Timeless
  classic: {
    navy: ['#1E3A8A', '#1E40AF', '#1D4ED8', '#2563EB'],
    burgundy: ['#7C2D12', '#991B1B', '#B91C1C', '#DC2626'],
    forest: ['#14532D', '#166534', '#15803D', '#16A34A'],
  },
  // Vibrant/Bold
  vibrant: {
    sunset: ['#FFA500', '#FF8C00', '#FF6347', '#FF4500'],
    tropical: ['#06B6D4', '#14B8A6', '#10B981', '#84CC16'],
    electric: ['#8B5CF6', '#A855F7', '#C026D3', '#D946EF'],
  },
};

/**
 * Mood-based color selection
 * Maps moods to specific color groups from psychology library
 */
const moodToColors: Record<
  'energetic' | 'calm' | 'professional' | 'playful' | 'luxurious',
  string[]
> = {
  energetic: colorPsychology.energy,
  calm: colorPsychology.calm,
  professional: colorPsychology.professional,
  playful: colorPsychology.playful,
  luxurious: colorPsychology.luxury,
};

/**
 * Trend-based palette modifiers
 */
const trendToBaseColors: Record<'earthy' | 'futuristic' | 'classic' | 'vibrant', string[]> = {
  earthy: colorTrends2025.earthy.sage,
  futuristic: colorTrends2025.futuristic.metallic,
  classic: colorTrends2025.classic.navy,
  vibrant: colorTrends2025.vibrant.tropical,
};

/**
 * Generate an AI-powered, personalized color palette
 * Uses mood and trend analysis to create unique, professional palettes
 *
 * @param params - Color palette generation parameters
 * @returns ColorPalette object with primary, secondary, accent, neutral, and background colors
 *
 * @example
 * ```typescript
 * const palette = await generateColorPalette({
 *   businessName: 'TechCorp',
 *   industry: 'tech',
 *   description: 'A cutting-edge software company'
 * });
 * ```
 */
export async function generateColorPalette(
  params: ColorPaletteParams
): Promise<ColorPalette> {
  try {
    // Extract mood and trend preferences using AI (or fallback to deterministic)
    const preferences = await extractColorPreferences({
      businessName: params.businessName,
      description: params.description,
      industry: params.industry,
    });

    // Get base colors from mood
    const moodColors = moodToColors[preferences.mood];
    const trendColors = trendToBaseColors[preferences.trend];

    // Select primary color - blend mood and trend
    // Use mood color as primary (stronger emotional connection)
    const primaryColor = moodColors[0] ?? '#2196F3';

    // Create harmonious palette using advanced color theory
    let secondaryColor: string;
    let accentColor: string;

    // Strategy based on trend
    switch (preferences.trend) {
      case 'earthy': {
        // Earthy uses analogous colors with warm undertones
        const analogous = ColorUtils.getAnalogous(primaryColor, 25);
        secondaryColor = analogous[0] ?? trendColors[1] ?? primaryColor;
        accentColor = trendColors[2] ?? analogous[1] ?? primaryColor;
        break;
      }
      case 'futuristic': {
        // Futuristic uses complementary with cool tones
        secondaryColor = ColorUtils.getComplementary(primaryColor);
        accentColor = trendColors[2] ?? ColorUtils.adjustLightness(primaryColor, 15);
        break;
      }
      case 'vibrant': {
        // Vibrant uses triadic for maximum color variety
        const triadic = ColorUtils.getTriadic(primaryColor);
        secondaryColor = triadic[0] ?? trendColors[1] ?? primaryColor;
        accentColor = triadic[1] ?? trendColors[2] ?? primaryColor;
        break;
      }
      case 'classic':
      default: {
        // Classic uses analogous for timeless sophistication
        const analogous = ColorUtils.getAnalogous(primaryColor, 30);
        secondaryColor = analogous[0] ?? trendColors[1] ?? primaryColor;
        accentColor = ColorUtils.adjustLightness(primaryColor, -15);
        break;
      }
    }

    // Ensure accent color has good contrast with primary
    accentColor = ensureContrast(primaryColor, accentColor);

    // Generate neutral color based on mood
    const neutralColor =
      preferences.mood === 'luxurious'
        ? '#4B5563' // Darker gray for luxury
        : preferences.mood === 'playful'
          ? '#9CA3AF' // Lighter gray for playful
          : '#6B7280'; // Standard gray for others

    // Background is always white for maximum versatility
    const backgroundColor = '#FFFFFF';

    return {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor,
      neutral: neutralColor,
      background: backgroundColor,
    };
  } catch (error) {
    // Fallback to a safe default palette
    console.error('Error generating color palette:', error);

    return {
      primary: '#2196F3',
      secondary: '#FF9800',
      accent: '#4CAF50',
      neutral: '#6B7280',
      background: '#FFFFFF',
    };
  }
}

/**
 * Ensure accent color has sufficient contrast with primary
 * Adjusts lightness if contrast ratio is too low
 */
function ensureContrast(primaryColor: string, accentColor: string): string {
  try {
    const primaryHSL = ColorUtils.hexToHSL(primaryColor);
    const accentHSL = ColorUtils.hexToHSL(accentColor);

    // If lightness difference is less than 25%, adjust accent
    const lightnessDiff = Math.abs(primaryHSL.l - accentHSL.l);

    if (lightnessDiff < 25) {
      // Darken or lighten accent based on primary lightness
      const adjustment = primaryHSL.l > 50 ? -30 : 30;
      return ColorUtils.adjustLightness(accentColor, adjustment);
    }

    return accentColor;
  } catch {
    return accentColor; // Return original if processing fails
  }
}

/**
 * Validate if a string is a valid hex color
 * @param color - Color string to validate
 * @returns True if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Get a contrasting text color (black or white) for a given background color
 * @param backgroundColor - Hex color of the background
 * @returns '#000000' or '#FFFFFF' based on contrast
 *
 * @example
 * ```typescript
 * const textColor = getContrastingTextColor('#0066FF');
 * // Returns '#FFFFFF' for better readability
 * ```
 */
export function getContrastingTextColor(backgroundColor: string): string {
  try {
    const hsl = ColorUtils.hexToHSL(backgroundColor);
    // If lightness is greater than 50%, use black text, otherwise use white
    return hsl.l > 50 ? '#000000' : '#FFFFFF';
  } catch {
    return '#000000'; // Default to black if parsing fails
  }
}

/**
 * Generate a lighter variant of a color (for hover states, etc.)
 * @param color - Base hex color
 * @param amount - Amount to lighten (0-100)
 * @returns Lightened hex color
 */
export function lightenColor(color: string, amount: number = 10): string {
  try {
    return ColorUtils.adjustLightness(color, amount);
  } catch {
    return color; // Return original if parsing fails
  }
}

/**
 * Generate a darker variant of a color (for active states, etc.)
 * @param color - Base hex color
 * @param amount - Amount to darken (0-100)
 * @returns Darkened hex color
 */
export function darkenColor(color: string, amount: number = 10): string {
  try {
    return ColorUtils.adjustLightness(color, -amount);
  } catch {
    return color; // Return original if parsing fails
  }
}

/**
 * Export ColorUtils for advanced color manipulation
 */
export { ColorUtils };
