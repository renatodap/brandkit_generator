import { describe, it, expect } from 'vitest';
import { generateColorPalette } from './colors';

describe('Color Palette Generation', () => {
  it('should generate a complete color palette', async () => {
    const palette = await generateColorPalette({
      businessName: 'TechCorp',
      industry: 'tech',
      description: 'An innovative tech company',
    });

    expect(palette).toHaveProperty('primary');
    expect(palette).toHaveProperty('secondary');
    expect(palette).toHaveProperty('accent');
    expect(palette).toHaveProperty('neutral');
    expect(palette).toHaveProperty('background');
  });

  it('should generate valid hex colors', async () => {
    const palette = await generateColorPalette({
      businessName: 'FoodCo',
      industry: 'food',
      description: 'A restaurant',
    });

    const hexPattern = /^#[0-9A-F]{6}$/i;
    expect(palette.primary).toMatch(hexPattern);
    expect(palette.secondary).toMatch(hexPattern);
    expect(palette.accent).toMatch(hexPattern);
    expect(palette.neutral).toMatch(hexPattern);
    expect(palette.background).toMatch(hexPattern);
  });

  it('should generate different palettes for different industries', async () => {
    const techPalette = await generateColorPalette({
      businessName: 'Tech',
      industry: 'tech',
      description: 'Tech company',
    });

    const foodPalette = await generateColorPalette({
      businessName: 'Food',
      industry: 'food',
      description: 'Food company',
    });

    // Palettes should be different (at least primary color)
    expect(techPalette.primary).not.toBe(foodPalette.primary);
  });

  it('should handle errors gracefully with fallback palette', async () => {
    // Even with weird input, should return a valid palette
    const palette = await generateColorPalette({
      businessName: '',
      industry: 'other',
      description: '',
    });

    expect(palette).toHaveProperty('primary');
    expect(palette.primary).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
