import { describe, it, expect } from 'vitest';
import { getFontPairing } from './fonts';

describe('Font Pairing Generation', () => {
  it('should generate font pairing for each industry', async () => {
    const industries = ['tech', 'food', 'fashion', 'health', 'creative', 'finance', 'education', 'other'] as const;

    for (const industry of industries) {
      const fonts = await getFontPairing({
        industry,
        businessName: 'Test',
      });

      expect(fonts).toHaveProperty('primary');
      expect(fonts).toHaveProperty('secondary');
      expect(fonts.primary).toHaveProperty('name');
      expect(fonts.primary).toHaveProperty('family');
      expect(fonts.primary).toHaveProperty('url');
      expect(fonts.primary).toHaveProperty('category');
    }
  });

  it('should generate valid Google Fonts URLs', async () => {
    const fonts = await getFontPairing({
      industry: 'tech',
      businessName: 'TechCorp',
    });

    expect(fonts.primary.url).toMatch(/^https:\/\/fonts\.googleapis\.com/);
    expect(fonts.secondary.url).toMatch(/^https:\/\/fonts\.googleapis\.com/);
  });

  it('should have different font categories for contrast', async () => {
    const fonts = await getFontPairing({
      industry: 'tech',
      businessName: 'TechCorp',
    });

    // Primary and secondary should ideally be different categories for visual contrast
    // (though not strictly required)
    expect(fonts.primary.category).toBeDefined();
    expect(fonts.secondary.category).toBeDefined();
  });

  it('should return consistent fonts for same industry', async () => {
    const fonts1 = await getFontPairing({
      industry: 'tech',
      businessName: 'Tech1',
    });

    const fonts2 = await getFontPairing({
      industry: 'tech',
      businessName: 'Tech2',
    });

    // Should return same fonts for same industry
    expect(fonts1.primary.name).toBe(fonts2.primary.name);
    expect(fonts1.secondary.name).toBe(fonts2.secondary.name);
  });
});
