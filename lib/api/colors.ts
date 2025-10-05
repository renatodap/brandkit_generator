import type { ColorPalette, ColorPaletteParams, Industry } from '@/types';

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
 * Industry-specific base colors
 * These are carefully selected primary colors that work well for each industry
 */
const industryBaseColors: Record<Industry, string> = {
  tech: '#0066FF', // Vibrant blue - innovation, trust
  food: '#FF6B35', // Warm orange - appetite, energy
  fashion: '#E91E63', // Bold pink - style, creativity
  health: '#00A86B', // Medical green - health, growth
  creative: '#9C27B0', // Purple - creativity, imagination
  finance: '#1565C0', // Deep blue - trust, stability
  education: '#FF9800', // Orange - energy, enthusiasm
  other: '#2196F3', // Balanced blue - universal appeal
};

/**
 * Industry-specific color scheme strategies
 */
const industryColorStrategies: Record<Industry, 'complementary' | 'analogous' | 'triadic'> = {
  tech: 'triadic',
  food: 'analogous',
  fashion: 'complementary',
  health: 'analogous',
  creative: 'triadic',
  finance: 'analogous',
  education: 'complementary',
  other: 'analogous',
};

/**
 * Generate a color palette based on industry and business parameters
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
    const { industry } = params;

    // Get base color for the industry
    const primaryColor = industryBaseColors[industry] || industryBaseColors.other;

    // Get color strategy for the industry
    const strategy = industryColorStrategies[industry] || 'analogous';

    let secondaryColor: string;
    let accentColor: string;

    // Generate colors based on strategy
    switch (strategy) {
      case 'complementary': {
        secondaryColor = ColorUtils.getComplementary(primaryColor);
        const analogous = ColorUtils.getAnalogous(primaryColor, 45);
        accentColor = analogous[0] ?? primaryColor;
        break;
      }
      case 'triadic': {
        const triadic = ColorUtils.getTriadic(primaryColor);
        secondaryColor = triadic[0] ?? primaryColor;
        accentColor = triadic[1] ?? primaryColor;
        break;
      }
      case 'analogous':
      default: {
        const analogous = ColorUtils.getAnalogous(primaryColor, 30);
        secondaryColor = analogous[0] ?? primaryColor;
        accentColor = analogous[1] ?? primaryColor;
        break;
      }
    }

    // Generate neutral and background colors
    const neutralColor = '#6B7280'; // Tailwind gray-500
    const backgroundColor = '#FFFFFF'; // White background

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
