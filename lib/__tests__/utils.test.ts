import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  generateRandomColor,
  hexToRgb,
  getLuminance,
  getContrastRatio,
  getTextColor,
  formatFileName,
  delay,
  isValidHexColor,
} from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', false && 'class2', true && 'class3')).toBe('class1 class3');
    });

    it('should merge Tailwind classes with proper precedence', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle objects with boolean values', () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null, undefined)).toBe('');
    });
  });

  describe('generateRandomColor', () => {
    it('should generate a valid hex color', () => {
      const color = generateRandomColor();
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should generate different colors on multiple calls', () => {
      const color1 = generateRandomColor();
      const color2 = generateRandomColor();
      const color3 = generateRandomColor();

      // Very low probability all three are the same
      expect(
        color1 === color2 && color2 === color3
      ).toBe(false);
    });

    it('should always return 6-digit hex codes', () => {
      // Test multiple times to ensure padding works
      for (let i = 0; i < 50; i++) {
        const color = generateRandomColor();
        expect(color).toHaveLength(7); // # + 6 digits
      }
    });

    it('should handle edge case of very small random numbers', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.000001);
      const color = generateRandomColor();
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color).toHaveLength(7);
      vi.restoreAllMocks();
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to RGB with hash', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should convert hex to RGB without hash', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle lowercase hex values', () => {
      expect(hexToRgb('#ff00ff')).toEqual({ r: 255, g: 0, b: 255 });
      expect(hexToRgb('abc123')).toEqual({ r: 171, g: 193, b: 35 });
    });

    it('should handle mixed case hex values', () => {
      expect(hexToRgb('#FfAaBb')).toEqual({ r: 255, g: 170, b: 187 });
    });

    it('should return null for invalid hex colors', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#GGG')).toBeNull();
      expect(hexToRgb('123')).toBeNull();
      expect(hexToRgb('#12345')).toBeNull();
      expect(hexToRgb('#1234567')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });

    it('should handle edge case colors', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#7F7F7F')).toEqual({ r: 127, g: 127, b: 127 });
    });
  });

  describe('getLuminance', () => {
    it('should calculate luminance for pure black', () => {
      expect(getLuminance(0, 0, 0)).toBe(0);
    });

    it('should calculate luminance for pure white', () => {
      const luminance = getLuminance(255, 255, 255);
      expect(luminance).toBeCloseTo(1, 2);
    });

    it('should calculate luminance for pure red', () => {
      const luminance = getLuminance(255, 0, 0);
      expect(luminance).toBeCloseTo(0.2126, 4);
    });

    it('should calculate luminance for pure green', () => {
      const luminance = getLuminance(0, 255, 0);
      expect(luminance).toBeCloseTo(0.7152, 4);
    });

    it('should calculate luminance for pure blue', () => {
      const luminance = getLuminance(0, 0, 255);
      expect(luminance).toBeCloseTo(0.0722, 4);
    });

    it('should calculate luminance for gray', () => {
      const luminance = getLuminance(128, 128, 128);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });

    it('should handle low values correctly (sRGB gamma correction)', () => {
      // Low values use linear transformation: v / 12.92
      const luminance = getLuminance(5, 5, 5);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(0.01);
    });

    it('should handle high values correctly (sRGB gamma correction)', () => {
      // High values use power transformation
      const luminance = getLuminance(200, 200, 200);
      expect(luminance).toBeGreaterThan(0.5);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21 for black and white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should return 1 for identical colors', () => {
      expect(getContrastRatio('#FF0000', '#FF0000')).toBe(1);
      expect(getContrastRatio('#00FF00', '#00FF00')).toBe(1);
    });

    it('should be symmetric (same ratio regardless of order)', () => {
      const ratio1 = getContrastRatio('#FF0000', '#0000FF');
      const ratio2 = getContrastRatio('#0000FF', '#FF0000');
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });

    it('should return 1 for invalid hex colors', () => {
      expect(getContrastRatio('invalid', '#FFFFFF')).toBe(1);
      expect(getContrastRatio('#000000', 'invalid')).toBe(1);
      expect(getContrastRatio('invalid', 'invalid')).toBe(1);
    });

    it('should calculate correct ratio for common color pairs', () => {
      // White and light gray
      const ratio = getContrastRatio('#FFFFFF', '#E0E0E0');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(2);
    });

    it('should handle colors with hash and without hash', () => {
      const ratio1 = getContrastRatio('#FF0000', '#00FF00');
      const ratio2 = getContrastRatio('FF0000', '00FF00');
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });

    it('should calculate WCAG AA compliant ratios', () => {
      // Dark blue on white should have good contrast
      const ratio = getContrastRatio('#0000AA', '#FFFFFF');
      expect(ratio).toBeGreaterThan(4.5); // WCAG AA minimum for normal text
    });
  });

  describe('getTextColor', () => {
    it('should return light text for dark backgrounds', () => {
      expect(getTextColor('#000000')).toBe('light');
      expect(getTextColor('#1a1a1a')).toBe('light');
      expect(getTextColor('#003366')).toBe('light');
    });

    it('should return dark text for light backgrounds', () => {
      expect(getTextColor('#FFFFFF')).toBe('dark');
      expect(getTextColor('#F0F0F0')).toBe('dark');
      expect(getTextColor('#FFFF99')).toBe('dark');
    });

    it('should handle medium brightness colors', () => {
      // Gray around the middle should return consistent result
      const result = getTextColor('#808080');
      expect(['light', 'dark']).toContain(result);
    });

    it('should handle bright saturated colors correctly', () => {
      // Red has low luminance, so dark text would have better contrast
      expect(getTextColor('#FF0000')).toBe('dark');
      // Green is very bright, so dark text is better
      expect(getTextColor('#00FF00')).toBe('dark');
      // Blue has low luminance, so light text is better
      expect(getTextColor('#0000FF')).toBe('light');
    });

    it('should handle colors without hash', () => {
      expect(getTextColor('000000')).toBe('light');
      expect(getTextColor('FFFFFF')).toBe('dark');
    });

    it('should be consistent for similar colors', () => {
      expect(getTextColor('#FEFEFE')).toBe(getTextColor('#FFFFFF'));
      expect(getTextColor('#010101')).toBe(getTextColor('#000000'));
    });
  });

  describe('formatFileName', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent timestamps
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format simple business names', () => {
      const fileName = formatFileName('Acme Corp', 'pdf');
      expect(fileName).toBe('acme-corp-brandkit-1735689600000.pdf');
    });

    it('should remove special characters', () => {
      const fileName = formatFileName('Acme & Co.!', 'zip');
      // Special characters are replaced with dashes (may result in consecutive dashes)
      expect(fileName).toBe('acme-co--brandkit-1735689600000.zip');
    });

    it('should handle multiple spaces', () => {
      const fileName = formatFileName('My   Business   Name', 'png');
      expect(fileName).toBe('my-business-name-brandkit-1735689600000.png');
    });

    it('should convert to lowercase', () => {
      const fileName = formatFileName('UPPERCASE BUSINESS', 'svg');
      expect(fileName).toBe('uppercase-business-brandkit-1735689600000.svg');
    });

    it('should handle numbers', () => {
      const fileName = formatFileName('Company 123', 'pdf');
      expect(fileName).toBe('company-123-brandkit-1735689600000.pdf');
    });

    it('should handle leading and trailing spaces', () => {
      const fileName = formatFileName('  Business Name  ', 'zip');
      // Leading/trailing spaces become dashes
      expect(fileName).toBe('-business-name--brandkit-1735689600000.zip');
    });

    it('should handle special characters and symbols', () => {
      const fileName = formatFileName('Café & Résumé™', 'pdf');
      // Special characters result in consecutive dashes
      expect(fileName).toBe('caf-r-sum--brandkit-1735689600000.pdf');
    });

    it('should handle empty string', () => {
      const fileName = formatFileName('', 'pdf');
      // Empty string results in a leading dash
      expect(fileName).toBe('-brandkit-1735689600000.pdf');
    });

    it('should handle only special characters', () => {
      const fileName = formatFileName('!@#$%^&*()', 'png');
      // All special characters become dashes
      expect(fileName).toBe('--brandkit-1735689600000.png');
    });

    it('should handle consecutive dashes from input', () => {
      const fileName = formatFileName('Business---Name', 'svg');
      // Consecutive dashes in input become a single dash replacement per match
      expect(fileName).toBe('business-name-brandkit-1735689600000.svg');
    });

    it('should include timestamp for uniqueness', () => {
      const fileName1 = formatFileName('Business', 'pdf');

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      const fileName2 = formatFileName('Business', 'pdf');
      expect(fileName1).not.toBe(fileName2);
    });

    it('should handle different file extensions', () => {
      expect(formatFileName('Business', 'pdf')).toContain('.pdf');
      expect(formatFileName('Business', 'zip')).toContain('.zip');
      expect(formatFileName('Business', 'svg')).toContain('.svg');
      expect(formatFileName('Business', 'png')).toContain('.png');
    });
  });

  describe('delay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay execution by specified milliseconds', async () => {
      const promise = delay(1000);

      // Should not be resolved yet
      let resolved = false;
      promise.then(() => { resolved = true; });

      expect(resolved).toBe(false);

      // Fast-forward time
      vi.advanceTimersByTime(1000);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should resolve with undefined', async () => {
      const promise = delay(100);
      vi.advanceTimersByTime(100);
      const result = await promise;
      expect(result).toBeUndefined();
    });

    it('should handle zero delay', async () => {
      const promise = delay(0);
      vi.advanceTimersByTime(0);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should handle multiple concurrent delays', async () => {
      const results: number[] = [];

      delay(100).then(() => results.push(1));
      delay(200).then(() => results.push(2));
      delay(300).then(() => results.push(3));

      vi.advanceTimersByTime(100);
      await Promise.resolve(); // Flush promises
      expect(results).toEqual([1]);

      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(results).toEqual([1, 2]);

      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(results).toEqual([1, 2, 3]);
    });

    it('should work with async/await', async () => {
      const delayPromise = delay(500);
      vi.advanceTimersByTime(500);
      const result = await delayPromise;
      // Delay should complete successfully and return undefined
      expect(result).toBeUndefined();
    });
  });

  describe('isValidHexColor', () => {
    it('should validate 6-digit hex colors with hash', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#00FF00')).toBe(true);
      expect(isValidHexColor('#0000FF')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
    });

    it('should validate 6-digit hex colors without hash', () => {
      expect(isValidHexColor('FF0000')).toBe(true);
      expect(isValidHexColor('ABCDEF')).toBe(true);
      expect(isValidHexColor('123456')).toBe(true);
    });

    it('should validate 3-digit shorthand hex colors', () => {
      expect(isValidHexColor('#FFF')).toBe(true);
      expect(isValidHexColor('#000')).toBe(true);
      expect(isValidHexColor('#F0F')).toBe(true);
      expect(isValidHexColor('ABC')).toBe(true);
    });

    it('should handle lowercase hex values', () => {
      expect(isValidHexColor('#ff00ff')).toBe(true);
      expect(isValidHexColor('abcdef')).toBe(true);
      expect(isValidHexColor('#abc')).toBe(true);
    });

    it('should handle mixed case hex values', () => {
      expect(isValidHexColor('#FfAaBb')).toBe(true);
      expect(isValidHexColor('FfAaBb')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('invalid')).toBe(false);
      expect(isValidHexColor('#GGG')).toBe(false);
      expect(isValidHexColor('GGGGGG')).toBe(false);
      expect(isValidHexColor('#12')).toBe(false);
      expect(isValidHexColor('#1234')).toBe(false);
      expect(isValidHexColor('#12345')).toBe(false);
      expect(isValidHexColor('#1234567')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidHexColor('')).toBe(false);
    });

    it('should reject colors with invalid characters', () => {
      expect(isValidHexColor('#GGGGGG')).toBe(false);
      expect(isValidHexColor('#12345G')).toBe(false);
      expect(isValidHexColor('XYZ')).toBe(false);
    });

    it('should reject colors with spaces', () => {
      expect(isValidHexColor('#FF FF FF')).toBe(false);
      expect(isValidHexColor('FF FF FF')).toBe(false);
    });

    it('should validate edge cases', () => {
      expect(isValidHexColor('#000')).toBe(true);
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('000000')).toBe(true);
      expect(isValidHexColor('FFFFFF')).toBe(true);
    });
  });
});
