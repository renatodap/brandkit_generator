import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateTagline,
  generateMultipleTaglines,
  validateTagline,
  getExampleTaglines,
  industryTaglineStyles,
  fallbackTaglines,
} from '../taglines';
import * as openRouterModule from '@/lib/api/openrouter';
import type { Industry } from '@/types';

// Mock the OpenRouter module
vi.mock('@/lib/api/openrouter', () => ({
  callOpenRouter: vi.fn(),
  OPENROUTER_MODELS: {
    DEEPSEEK_CHAT: 'deepseek/deepseek-chat',
  },
  OpenRouterError: class OpenRouterError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public code?: string
    ) {
      super(message);
      this.name = 'OpenRouterError';
    }
  },
}));

// Mock the logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('taglines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTagline', () => {
    it('should generate a valid tagline from AI response', async () => {
      const mockResponse = 'Innovation at Your Fingertips';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A cutting-edge software company',
      });

      expect(tagline).toBe('Innovation At Your Fingertips');
      expect(openRouterModule.callOpenRouter).toHaveBeenCalledWith(
        openRouterModule.OPENROUTER_MODELS.DEEPSEEK_CHAT,
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        { temperature: 0.8, maxTokens: 50 }
      );
    });

    it('should clean tagline by removing prefixes and quotes', async () => {
      const mockResponse = 'Tagline: "Fresh from Our Kitchen"';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'FoodCo',
        industry: 'food',
        description: 'A restaurant',
      });

      expect(tagline).toBe('Fresh From Our Kitchen');
    });

    it('should remove trailing periods', async () => {
      const mockResponse = 'Taste the Difference.';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'FoodCo',
        industry: 'food',
        description: 'A restaurant',
      });

      expect(tagline).toBe('Taste the Difference');
    });

    it('should capitalize first letter of each major word', async () => {
      const mockResponse = 'innovation for tomorrow';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(tagline).toBe('Innovation for Tomorrow');
    });

    it('should use fallback when AI returns invalid tagline (too short)', async () => {
      const mockResponse = 'Hi';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      // Should be one of the fallback taglines for tech
      expect(fallbackTaglines.tech).toContain(tagline);
    });

    it('should use fallback when AI returns invalid tagline (too long)', async () => {
      const mockResponse = 'This is a very long tagline that exceeds the maximum character limit and should be rejected';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(fallbackTaglines.tech).toContain(tagline);
    });

    it('should use fallback when AI returns tagline with business name', async () => {
      const mockResponse = 'TechCorp is the Best';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(fallbackTaglines.tech).toContain(tagline);
    });

    it('should use fallback when AI returns tagline with filler phrases', async () => {
      const mockResponse = 'Welcome to Innovation';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(fallbackTaglines.tech).toContain(tagline);
    });

    it('should use fallback when OpenRouter throws an error', async () => {
      const mockError = new openRouterModule.OpenRouterError(
        'API Error',
        500,
        'API_ERROR'
      );
      vi.spyOn(openRouterModule, 'callOpenRouter').mockRejectedValue(mockError);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(fallbackTaglines.tech).toContain(tagline);
    });

    it('should handle different industries correctly', async () => {
      const industries: Industry[] = ['tech', 'food', 'fashion', 'health', 'creative', 'finance', 'education', 'other'];

      for (const industry of industries) {
        const mockResponse = 'Quality First Always';
        vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

        const tagline = await generateTagline({
          businessName: 'TestCo',
          industry,
          description: 'A test company',
        });

        expect(tagline).toBeTruthy();
        expect(typeof tagline).toBe('string');
      }
    });

    it('should not capitalize articles, conjunctions, and prepositions (unless first word)', async () => {
      const mockResponse = 'innovation for the future and beyond';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(tagline).toBe('Innovation for the Future and Beyond');
    });
  });

  describe('generateMultipleTaglines', () => {
    it('should generate multiple unique taglines', async () => {
      let callCount = 0;
      vi.spyOn(openRouterModule, 'callOpenRouter').mockImplementation(async () => {
        const taglines = ['Innovation First', 'Future Tech', 'Smart Solutions'];
        return taglines[callCount++ % taglines.length] || 'Default Tagline';
      });

      const taglines = await generateMultipleTaglines(
        {
          businessName: 'TechCorp',
          industry: 'tech',
          description: 'A tech company',
        },
        3
      );

      expect(taglines).toHaveLength(3);
      // All should be unique
      expect(new Set(taglines).size).toBe(3);
    });

    it('should avoid duplicate taglines', async () => {
      let callCount = 0;
      vi.spyOn(openRouterModule, 'callOpenRouter').mockImplementation(async () => {
        // Return same tagline multiple times, then different ones
        const taglines = ['Innovation First', 'Innovation First', 'Innovation First', 'Future Tech', 'Smart Solutions'];
        return taglines[callCount++] || 'Default Tagline';
      });

      const taglines = await generateMultipleTaglines(
        {
          businessName: 'TechCorp',
          industry: 'tech',
          description: 'A tech company',
        },
        3
      );

      expect(taglines).toHaveLength(3);
      expect(new Set(taglines).size).toBe(3);
    });

    it('should fill with fallbacks if AI fails', async () => {
      vi.spyOn(openRouterModule, 'callOpenRouter').mockRejectedValue(
        new Error('API Error')
      );

      const taglines = await generateMultipleTaglines(
        {
          businessName: 'TechCorp',
          industry: 'tech',
          description: 'A tech company',
        },
        3
      );

      expect(taglines).toHaveLength(3);
      taglines.forEach((tagline) => {
        expect(fallbackTaglines.tech).toContain(tagline);
      });
    });

    it('should generate default count of 3 if not specified', async () => {
      let callCount = 0;
      vi.spyOn(openRouterModule, 'callOpenRouter').mockImplementation(async () => {
        const taglines = ['Innovation First', 'Future Tech', 'Smart Solutions'];
        return taglines[callCount++ % taglines.length] || 'Default Tagline';
      });

      const taglines = await generateMultipleTaglines({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(taglines).toHaveLength(3);
    });

    it('should handle custom count parameter', async () => {
      let callCount = 0;
      vi.spyOn(openRouterModule, 'callOpenRouter').mockImplementation(async () => {
        const taglines = ['One', 'Two', 'Three', 'Four', 'Five'];
        return taglines[callCount++ % taglines.length] || 'Default';
      });

      const taglines = await generateMultipleTaglines(
        {
          businessName: 'TechCorp',
          industry: 'tech',
          description: 'A tech company',
        },
        5
      );

      expect(taglines).toHaveLength(5);
    });

    it('should stop adding fallbacks when no more unique ones available', async () => {
      vi.spyOn(openRouterModule, 'callOpenRouter').mockRejectedValue(
        new Error('API Error')
      );

      // Request exactly the number of available fallbacks
      const requestedCount = fallbackTaglines.tech.length;
      const taglines = await generateMultipleTaglines(
        {
          businessName: 'TechCorp',
          industry: 'tech',
          description: 'A tech company',
        },
        requestedCount
      );

      // Should return all available fallbacks
      expect(taglines.length).toBe(fallbackTaglines.tech.length);
      // All should be unique
      expect(new Set(taglines).size).toBe(taglines.length);
      // All should be from fallbacks
      taglines.forEach((tagline) => {
        expect(fallbackTaglines.tech).toContain(tagline);
      });
    });
  });

  describe('validateTagline', () => {
    it('should validate a correct tagline', () => {
      const validation = validateTagline('Innovation at Your Fingertips');

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject tagline that is too short (< 10 characters)', () => {
      const validation = validateTagline('Too Short');

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Tagline is too short (minimum 10 characters)');
    });

    it('should reject tagline that is too long (> 60 characters)', () => {
      const validation = validateTagline(
        'This is a very long tagline that exceeds the maximum character limit'
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Tagline is too long (maximum 60 characters)');
    });

    it('should reject tagline with less than 2 words', () => {
      const validation = validateTagline('Innovation');

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Tagline must have at least 2 words');
    });

    it('should warn about lengthy taglines (> 6 words)', () => {
      const validation = validateTagline('This tagline has more than six words total');

      expect(validation.warnings).toContain(
        'Tagline is lengthy - consider shortening for better impact'
      );
    });

    it('should warn if tagline does not start with capital letter', () => {
      const validation = validateTagline('innovation starts here');

      expect(validation.warnings).toContain('Tagline should start with a capital letter');
    });

    it('should warn about excessive punctuation', () => {
      const validation = validateTagline('Innovation Now!!');

      expect(validation.warnings).toContain('Avoid excessive punctuation');
    });

    it('should handle valid tagline with warnings', () => {
      const validation = validateTagline('This is a very long tagline with warnings');

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should handle edge cases correctly', () => {
      // Exactly 10 characters with 2 words
      const validation1 = validateTagline('Test Valid');
      expect(validation1.valid).toBe(true);

      // Exactly 60 characters
      const validation2 = validateTagline('This tagline is exactly sixty characters in length total');
      expect(validation2.valid).toBe(true);

      // Exactly 6 words (no warning)
      const validation3 = validateTagline('Quality Service for All Our Clients');
      expect(validation3.warnings).not.toContain(
        'Tagline is lengthy - consider shortening for better impact'
      );
    });
  });

  describe('getExampleTaglines', () => {
    it('should return example taglines for tech industry', () => {
      const examples = getExampleTaglines('tech');

      expect(examples).toEqual(industryTaglineStyles.tech.examples);
      expect(examples.length).toBeGreaterThan(0);
      examples.forEach((example) => {
        expect(typeof example).toBe('string');
      });
    });

    it('should return example taglines for food industry', () => {
      const examples = getExampleTaglines('food');

      expect(examples).toEqual(industryTaglineStyles.food.examples);
      expect(examples.length).toBeGreaterThan(0);
    });

    it('should return example taglines for all industries', () => {
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

      industries.forEach((industry) => {
        const examples = getExampleTaglines(industry);
        expect(examples).toEqual(industryTaglineStyles[industry].examples);
        expect(examples.length).toBeGreaterThan(0);
      });
    });

    it('should return other examples for unknown industry', () => {
      const examples = getExampleTaglines('unknown' as Industry);

      expect(examples).toEqual(industryTaglineStyles.other.examples);
    });
  });

  describe('industryTaglineStyles', () => {
    it('should have styles for all industries', () => {
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

      industries.forEach((industry) => {
        expect(industryTaglineStyles[industry]).toBeDefined();
        expect(industryTaglineStyles[industry].keywords).toBeDefined();
        expect(industryTaglineStyles[industry].tone).toBeDefined();
        expect(industryTaglineStyles[industry].examples).toBeDefined();
      });
    });

    it('should have valid structure for each industry style', () => {
      Object.values(industryTaglineStyles).forEach((style) => {
        expect(Array.isArray(style.keywords)).toBe(true);
        expect(style.keywords.length).toBeGreaterThan(0);
        expect(typeof style.tone).toBe('string');
        expect(style.tone.length).toBeGreaterThan(0);
        expect(Array.isArray(style.examples)).toBe(true);
        expect(style.examples.length).toBeGreaterThan(0);
      });
    });
  });

  describe('fallbackTaglines', () => {
    it('should have fallbacks for all industries', () => {
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

      industries.forEach((industry) => {
        expect(fallbackTaglines[industry]).toBeDefined();
        expect(Array.isArray(fallbackTaglines[industry])).toBe(true);
        expect(fallbackTaglines[industry].length).toBeGreaterThan(0);
      });
    });

    it('should have valid taglines as fallbacks', () => {
      Object.values(fallbackTaglines).forEach((taglines) => {
        taglines.forEach((tagline) => {
          const validation = validateTagline(tagline);
          expect(validation.valid).toBe(true);
        });
      });
    });

    it('should have unique fallback taglines per industry', () => {
      Object.entries(fallbackTaglines).forEach(([industry, taglines]) => {
        const uniqueTaglines = new Set(taglines);
        expect(uniqueTaglines.size).toBe(taglines.length);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty business name', async () => {
      const mockResponse = 'Quality Excellence';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: '',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(tagline).toBeTruthy();
      expect(typeof tagline).toBe('string');
    });

    it('should handle empty description', async () => {
      const mockResponse = 'Innovation First';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: '',
      });

      expect(tagline).toBeTruthy();
      expect(typeof tagline).toBe('string');
    });

    it('should handle network errors gracefully', async () => {
      vi.spyOn(openRouterModule, 'callOpenRouter').mockRejectedValue(
        new Error('Network error')
      );

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(fallbackTaglines.tech).toContain(tagline);
    });

    it('should handle malformed AI responses', async () => {
      const mockResponse = '   \n\n   ';
      vi.spyOn(openRouterModule, 'callOpenRouter').mockResolvedValue(mockResponse);

      const tagline = await generateTagline({
        businessName: 'TechCorp',
        industry: 'tech',
        description: 'A tech company',
      });

      expect(fallbackTaglines.tech).toContain(tagline);
    });
  });
});
