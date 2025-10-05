import type { Industry } from '@/types';

/**
 * Build an enhanced prompt for logo generation using AI-extracted symbols
 * Optimized for DeepAI Genius mode
 */
export function buildEnhancedLogoPrompt(
  params: {
    businessName: string;
    description: string;
    industry: Industry;
  },
  symbols: {
    primary: string;
    secondary: string;
    mood: string;
  }
): string {
  const { businessName, industry } = params;

  // Industry-specific aesthetic keywords (enhanced for DeepAI)
  const industryAesthetics: Record<string, string> = {
    tech: 'sleek, geometric precision, futuristic, digital gradient, sharp angles, modern tech aesthetic',
    food: 'organic curves, appetizing, warm tones, natural elements, inviting, culinary design',
    fashion: 'elegant lines, sophisticated, stylish minimalism, trendy, haute couture, luxury branding',
    health: 'clean lines, medical precision, trustworthy, calming symmetry, professional healthcare',
    creative: 'artistic flair, expressive, unique composition, imaginative, vibrant creative energy',
    finance: 'corporate elegance, stable geometry, premium finish, authoritative, refined financial',
    education: 'approachable, academic excellence, inspiring, knowledgeable, progressive learning',
    other: 'versatile, balanced, professional clarity, timeless design, universal appeal',
  };

  const aesthetic = industryAesthetics[industry] || industryAesthetics['other'];

  // Build comprehensive prompt optimized for DeepAI Genius mode
  return `professional minimalist logo design for "${businessName}", featuring a stylized ${symbols.primary} with ${symbols.secondary}, ${symbols.mood} and ${aesthetic}, flat design vector illustration, simple iconic symbol, clean geometric shapes, memorable brand mark, perfect symmetry, centered composition, solid white background, high contrast, modern corporate branding identity, ${industry} industry, minimalist graphic design, professional quality, sharp clean edges, 8k resolution`;
}
