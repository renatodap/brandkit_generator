/**
 * Tests for /api/regenerate endpoint
 *
 * Tests:
 * - POST: Regenerate specific brand kit components
 * - Logo regeneration
 * - Color palette regeneration
 * - Font pairing regeneration
 * - Tagline regeneration
 * - Input validation
 * - Error handling
 * - AI API failures
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../regenerate/route';
import { NextRequest } from 'next/server';

// Mock all external dependencies BEFORE imports
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  generateColorPalette: vi.fn(),
  getFontPairing: vi.fn(),
  generateTagline: vi.fn(),
}));

vi.mock('@/lib/api/groq-logo', () => ({
  generateLogoWithGroq: vi.fn(),
  isGroqConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/api/groq', () => ({
  extractLogoSymbols: vi.fn(),
}));

// Import test utilities AFTER mocks
import {
  extractJson,
  expectStatus,
  mockColorPalette,
  mockFontPairing,
  mockTagline,
  mockLogoSymbols,
  mockGroqLogoResult,
  validBrandKitInput,
} from './test-utils';

describe('POST /api/regenerate', () => {
  const baseBrandKit = {
    businessName: 'Test Business',
    businessDescription: 'A test business for unit testing',
    industry: 'tech',
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      neutral: '#6B7280',
      background: '#FFFFFF',
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set up default mock return values
    const { generateColorPalette, getFontPairing, generateTagline } = await import('@/lib/api');
    const { generateLogoWithGroq } = await import('@/lib/api/groq-logo');
    const { extractLogoSymbols } = await import('@/lib/api/groq');

    vi.mocked(generateColorPalette).mockResolvedValue(mockColorPalette);
    vi.mocked(getFontPairing).mockResolvedValue(mockFontPairing);
    vi.mocked(generateTagline).mockResolvedValue(mockTagline);
    vi.mocked(generateLogoWithGroq).mockResolvedValue(mockGroqLogoResult);
    vi.mocked(extractLogoSymbols).mockResolvedValue(mockLogoSymbols);
  });

  describe('Logo regeneration', () => {
    it('should regenerate logo successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('logo');
      expect(data.logo).toHaveProperty('url');
      expect(data.logo).toHaveProperty('svgCode');
      expect(data.logo?.url).toContain('data:image/svg+xml;base64,');
      expect(data).toHaveProperty('justifications');
      expect(data.justifications).toHaveProperty('logo');
    });

    it('should call extractLogoSymbols before generating logo', async () => {
      const { extractLogoSymbols } = await import('@/lib/api/groq');

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
          brandKit: baseBrandKit,
        }),
      });

      await POST(request);

      expect(extractLogoSymbols).toHaveBeenCalledWith({
        businessName: baseBrandKit.businessName,
        description: baseBrandKit.businessDescription,
        industry: baseBrandKit.industry,
      });
    });

    it('should use brand kit colors in logo generation', async () => {
      const { generateLogoWithGroq } = await import('@/lib/api/groq-logo');

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
          brandKit: baseBrandKit,
        }),
      });

      await POST(request);

      expect(generateLogoWithGroq).toHaveBeenCalledWith({
        businessName: baseBrandKit.businessName,
        description: baseBrandKit.businessDescription,
        industry: baseBrandKit.industry,
        symbols: mockLogoSymbols,
        colorPalette: {
          primary: baseBrandKit.colors.primary,
          secondary: baseBrandKit.colors.secondary,
          accent: baseBrandKit.colors.accent,
        },
      });
    });

    it('should return 503 when Groq is not configured', async () => {
      const { isGroqConfigured } = await import('@/lib/api/groq-logo');
      vi.mocked(isGroqConfigured).mockReturnValueOnce(false);

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 503);
      expect(data).toHaveProperty('error', 'Logo generation is currently unavailable');
    });

    it('should return 500 when logo generation fails', async () => {
      const { generateLogoWithGroq } = await import('@/lib/api/groq-logo');
      vi.mocked(generateLogoWithGroq).mockRejectedValueOnce(new Error('Logo generation failed'));

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 500);
      expect(data).toHaveProperty('error', 'Logo generation failed. Please try again.');
    });
  });

  describe('Color palette regeneration', () => {
    it('should regenerate color palette successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'colors',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('colors');
      expect(data.colors).toHaveProperty('primary');
      expect(data.colors).toHaveProperty('secondary');
      expect(data.colors).toHaveProperty('accent');
      expect(data.colors).toHaveProperty('neutral');
      expect(data.colors).toHaveProperty('background');
    });

    it('should call generateColorPalette with correct parameters', async () => {
      const { generateColorPalette } = await import('@/lib/api');

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'colors',
          brandKit: baseBrandKit,
        }),
      });

      await POST(request);

      expect(generateColorPalette).toHaveBeenCalledWith({
        businessName: baseBrandKit.businessName,
        description: baseBrandKit.businessDescription,
        industry: baseBrandKit.industry,
      });
    });

    it('should return 500 when color generation fails', async () => {
      const { generateColorPalette } = await import('@/lib/api');
      vi.mocked(generateColorPalette).mockRejectedValueOnce(new Error('Color generation failed'));

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'colors',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 500);
      expect(data).toHaveProperty('error', 'Color generation failed. Please try again.');
    });
  });

  describe('Font pairing regeneration', () => {
    it('should regenerate fonts successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'fonts',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('fonts');
      expect(data.fonts).toHaveProperty('primary');
      expect(data.fonts).toHaveProperty('secondary');
      expect(data.fonts.primary).toHaveProperty('name');
      expect(data.fonts.primary).toHaveProperty('family');
      expect(data.fonts.primary).toHaveProperty('url');
      expect(data.fonts.primary).toHaveProperty('category');
    });

    it('should call getFontPairing with industry', async () => {
      const { getFontPairing } = await import('@/lib/api');

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'fonts',
          brandKit: baseBrandKit,
        }),
      });

      await POST(request);

      expect(getFontPairing).toHaveBeenCalledWith(baseBrandKit.industry);
    });

    it('should return 500 when font generation fails', async () => {
      const { getFontPairing } = await import('@/lib/api');
      vi.mocked(getFontPairing).mockRejectedValueOnce(new Error('Font generation failed'));

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'fonts',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 500);
      expect(data).toHaveProperty('error', 'Font generation failed. Please try again.');
    });
  });

  describe('Tagline regeneration', () => {
    it('should regenerate tagline successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'tagline',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('tagline');
      expect(typeof data.tagline).toBe('string');
      expect(data.tagline.length).toBeGreaterThan(0);
    });

    it('should call generateTagline with correct parameters', async () => {
      const { generateTagline } = await import('@/lib/api');

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'tagline',
          brandKit: baseBrandKit,
        }),
      });

      await POST(request);

      expect(generateTagline).toHaveBeenCalledWith({
        businessName: baseBrandKit.businessName,
        description: baseBrandKit.businessDescription,
        industry: baseBrandKit.industry,
      });
    });

    it('should return 500 when tagline generation fails', async () => {
      const { generateTagline } = await import('@/lib/api');
      vi.mocked(generateTagline).mockRejectedValueOnce(new Error('Tagline generation failed'));

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'tagline',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 500);
      expect(data).toHaveProperty('error', 'Tagline generation failed. Please try again.');
    });
  });

  describe('Input validation', () => {
    it('should return 400 for invalid component type', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'invalid-component',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 400);
      expect(data).toHaveProperty('error', 'Invalid request data');
      expect(data).toHaveProperty('details');
    });

    it('should return 400 for missing brandKit', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 400);
      expect(data).toHaveProperty('error', 'Invalid request data');
    });

    it('should return 400 for missing required brandKit fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
          brandKit: {
            businessName: 'Test',
            // Missing other required fields
          },
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 400);
      expect(data).toHaveProperty('error', 'Invalid request data');
    });

    it('should validate color palette structure for logo regeneration', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
          brandKit: {
            ...baseBrandKit,
            colors: {
              primary: '#3B82F6',
              // Missing other colors
            },
          },
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 400);
      expect(data).toHaveProperty('error', 'Invalid request data');
    });
  });

  describe('Advanced options and notes', () => {
    it('should handle regeneration with notes', async () => {
      const brandKitWithNotes = {
        ...baseBrandKit,
        notes: 'Make it more playful',
      };

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'tagline',
          brandKit: brandKitWithNotes,
        }),
      });

      const response = await POST(request);

      expectStatus(response, 200);
    });

    it('should handle regeneration with advanced options', async () => {
      const brandKitWithAdvancedOptions = {
        ...baseBrandKit,
        advancedOptions: {
          styles: ['modern', 'minimalist'],
          colorMood: 'vibrant',
          targetAudience: 'millennial',
          brandTones: ['friendly', 'professional'],
        },
      };

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'colors',
          brandKit: brandKitWithAdvancedOptions,
        }),
      });

      const response = await POST(request);

      expectStatus(response, 200);
    });
  });

  describe('Error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      const { generateTagline } = await import('@/lib/api');
      vi.mocked(generateTagline).mockRejectedValueOnce(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'tagline',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 500);
      expect(data).toHaveProperty('error');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);

      expectStatus(response, 500);
    });

    it('should log errors with business context', async () => {
      const { logger } = await import('@/lib/logger');
      const { generateTagline } = await import('@/lib/api');
      vi.mocked(generateTagline).mockRejectedValueOnce(new Error('Test error'));

      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'tagline',
          brandKit: baseBrandKit,
        }),
      });

      await POST(request);

      expect(logger.error).toHaveBeenCalledWith(
        'Tagline generation failed',
        expect.any(Error),
        { businessName: baseBrandKit.businessName }
      );
    });
  });

  describe('Response format', () => {
    it('should return only the regenerated component', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'tagline',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('tagline');
      expect(data).not.toHaveProperty('logo');
      expect(data).not.toHaveProperty('colors');
      expect(data).not.toHaveProperty('fonts');
    });

    it('should include justifications for logo regeneration', async () => {
      const request = new NextRequest('http://localhost:3000/api/regenerate', {
        method: 'POST',
        body: JSON.stringify({
          component: 'logo',
          brandKit: baseBrandKit,
        }),
      });

      const response = await POST(request);
      const data = await extractJson(response);

      expectStatus(response, 200);
      expect(data).toHaveProperty('justifications');
      expect(data.justifications).toHaveProperty('logo');
    });
  });
});
