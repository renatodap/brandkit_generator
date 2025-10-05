import { describe, it, expect } from 'vitest';
import {
  brandKitInputSchema,
  colorPaletteSchema,
  fontPairingSchema,
  hexColorSchema,
} from './validations';

describe('Validation Schemas', () => {
  describe('brandKitInputSchema', () => {
    it('should validate correct input', () => {
      const validInput = {
        businessName: 'TechCorp',
        businessDescription: 'An innovative tech company building the future',
        industry: 'tech' as const,
      };

      const result = brandKitInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject business name that is too short', () => {
      const invalidInput = {
        businessName: '',
        businessDescription: 'A great company doing great things',
        industry: 'tech' as const,
      };

      const result = brandKitInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject business name with invalid characters', () => {
      const invalidInput = {
        businessName: 'Tech<script>alert(1)</script>',
        businessDescription: 'A great company',
        industry: 'tech' as const,
      };

      const result = brandKitInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject description that is too short', () => {
      const invalidInput = {
        businessName: 'TechCorp',
        businessDescription: 'Short',
        industry: 'tech' as const,
      };

      const result = brandKitInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid industry', () => {
      const invalidInput = {
        businessName: 'TechCorp',
        businessDescription: 'An innovative tech company',
        industry: 'invalid' as const,
      };

      const result = brandKitInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('hexColorSchema', () => {
    it('should validate correct hex colors', () => {
      expect(hexColorSchema.safeParse('#FF5733').success).toBe(true);
      expect(hexColorSchema.safeParse('#000').success).toBe(true);
      expect(hexColorSchema.safeParse('#FFFFFF').success).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(hexColorSchema.safeParse('FF5733').success).toBe(false);
      expect(hexColorSchema.safeParse('#GG5733').success).toBe(false);
      expect(hexColorSchema.safeParse('red').success).toBe(false);
    });
  });

  describe('colorPaletteSchema', () => {
    it('should validate complete color palette', () => {
      const validPalette = {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
        neutral: '#6B7280',
        background: '#FFFFFF',
      };

      const result = colorPaletteSchema.safeParse(validPalette);
      expect(result.success).toBe(true);
    });

    it('should reject palette with missing colors', () => {
      const invalidPalette = {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
      };

      const result = colorPaletteSchema.safeParse(invalidPalette);
      expect(result.success).toBe(false);
    });
  });

  describe('fontPairingSchema', () => {
    it('should validate correct font pairing', () => {
      const validFonts = {
        primary: {
          name: 'Inter',
          family: 'Inter, sans-serif',
          url: 'https://fonts.googleapis.com/css2?family=Inter',
          category: 'sans-serif' as const,
        },
        secondary: {
          name: 'Lora',
          family: 'Lora, serif',
          url: 'https://fonts.googleapis.com/css2?family=Lora',
          category: 'serif' as const,
        },
      };

      const result = fontPairingSchema.safeParse(validFonts);
      expect(result.success).toBe(true);
    });

    it('should reject invalid font URL', () => {
      const invalidFonts = {
        primary: {
          name: 'Inter',
          family: 'Inter, sans-serif',
          url: 'not-a-url',
          category: 'sans-serif' as const,
        },
        secondary: {
          name: 'Lora',
          family: 'Lora, serif',
          url: 'https://fonts.googleapis.com/css2?family=Lora',
          category: 'serif' as const,
        },
      };

      const result = fontPairingSchema.safeParse(invalidFonts);
      expect(result.success).toBe(false);
    });
  });
});
