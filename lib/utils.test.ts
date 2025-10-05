import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  getTextColor,
  isValidHexColor,
  formatFileName,
} from './utils';

describe('Color Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB correctly', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#FF5733')).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('should handle hex without # prefix', () => {
      expect(hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#GGG')).toBeNull();
    });
  });

  describe('getLuminance', () => {
    it('should calculate luminance correctly', () => {
      // White should have high luminance
      const whiteLum = getLuminance(255, 255, 255);
      expect(whiteLum).toBeCloseTo(1, 1);

      // Black should have low luminance
      const blackLum = getLuminance(0, 0, 0);
      expect(blackLum).toBe(0);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio correctly', () => {
      // White vs Black should have 21:1 ratio
      const ratio = getContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return same ratio regardless of order', () => {
      const ratio1 = getContrastRatio('#FFFFFF', '#000000');
      const ratio2 = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio1).toBe(ratio2);
    });

    it('should return 1 for same colors', () => {
      const ratio = getContrastRatio('#FF5733', '#FF5733');
      expect(ratio).toBe(1);
    });
  });

  describe('getTextColor', () => {
    it('should return light text for dark backgrounds', () => {
      expect(getTextColor('#000000')).toBe('light');
      expect(getTextColor('#1a1a1a')).toBe('light');
    });

    it('should return dark text for light backgrounds', () => {
      expect(getTextColor('#FFFFFF')).toBe('dark');
      expect(getTextColor('#F0F0F0')).toBe('dark');
    });
  });

  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#000')).toBe(true);
      expect(isValidHexColor('FF5733')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('invalid')).toBe(false);
      expect(isValidHexColor('#GGG')).toBe(false);
      expect(isValidHexColor('#12')).toBe(false);
    });
  });
});

describe('File Utilities', () => {
  describe('formatFileName', () => {
    it('should format file name correctly', () => {
      const fileName = formatFileName('TechCorp Solutions', 'zip');
      expect(fileName).toMatch(/^techcorp-solutions-brandkit-\d+\.zip$/);
    });

    it('should handle special characters', () => {
      const fileName = formatFileName('Tech & Co.!', 'zip');
      // Multiple hyphens may appear when special chars are removed
      expect(fileName).toMatch(/^tech-co-+brandkit-\d+\.zip$/);
    });

    it('should convert to lowercase', () => {
      const fileName = formatFileName('UPPERCASE', 'zip');
      expect(fileName).toMatch(/^uppercase-brandkit-\d+\.zip$/);
    });
  });
});
