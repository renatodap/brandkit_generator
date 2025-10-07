import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractLogoSymbols,
  extractBrandPersonality,
  extractColorPreferences,
  generateColorJustification,
  generateFontJustification,
  isGroqConfigured,
} from '../groq';
import Groq from 'groq-sdk';

// Mock the Groq SDK
vi.mock('groq-sdk', () => {
  const MockGroq = vi.fn();
  MockGroq.prototype.chat = {
    completions: {
      create: vi.fn(),
    },
  };
  return { default: MockGroq };
});

// Mock the logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('groq', () => {
  const originalEnv = process.env;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    process.env['GROQ_API_KEY'] = 'test-api-key';

    // Get the mock create function
    mockCreate = vi.mocked(Groq.prototype.chat.completions.create);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isGroqConfigured', () => {
    it('should return true when GROQ_API_KEY is set', () => {
      process.env['GROQ_API_KEY'] = 'test-key';
      expect(isGroqConfigured()).toBe(true);
    });

    it('should return false when GROQ_API_KEY is not set', () => {
      delete process.env['GROQ_API_KEY'];
      expect(isGroqConfigured()).toBe(false);
    });

    it('should return false when GROQ_API_KEY is empty string', () => {
      process.env['GROQ_API_KEY'] = '';
      expect(isGroqConfigured()).toBe(false);
    });
  });

  describe('extractLogoSymbols', () => {
    const validParams = {
      businessName: 'TechFlow',
      description: 'A modern software development platform',
      industry: 'tech',
    };

    it('should extract symbols successfully from AI response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                primary: 'circuit board',
                secondary: 'flowing lines',
                mood: 'innovative',
              }),
            },
          },
        ],
      });

      const result = await extractLogoSymbols(validParams);

      expect(result).toEqual({
        primary: 'circuit board',
        secondary: 'flowing lines',
        mood: 'innovative',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('professional brand strategist'),
          },
          {
            role: 'user',
            content: expect.stringContaining('TechFlow'),
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      });
    });

    it('should use fallback values when AI returns incomplete data', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                primary: 'circuit board',
                // Missing secondary and mood
              }),
            },
          },
        ],
      });

      const result = await extractLogoSymbols(validParams);

      expect(result).toEqual({
        primary: 'circuit board',
        secondary: 'geometric pattern',
        mood: 'professional',
      });
    });

    it('should use deterministic fallback when Groq is not configured', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractLogoSymbols(validParams);

      expect(result).toBeDefined();
      expect(result.primary).toBeTruthy();
      expect(result.secondary).toBeTruthy();
      expect(result.mood).toBeTruthy();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should use deterministic fallback when AI fails', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await extractLogoSymbols(validParams);

      expect(result).toBeDefined();
      expect(result.primary).toBeTruthy();
      expect(result.secondary).toBeTruthy();
      expect(result.mood).toBeTruthy();
    });

    it('should handle empty AI response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await extractLogoSymbols(validParams);

      expect(result).toBeDefined();
      expect(result.primary).toBeTruthy();
    });

    it('should handle malformed JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'not valid json',
            },
          },
        ],
      });

      const result = await extractLogoSymbols(validParams);

      expect(result).toBeDefined();
      expect(result.primary).toBeTruthy();
    });

    it('should detect eco-friendly keywords and use leaf symbol', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractLogoSymbols({
        businessName: 'EcoGreen',
        description: 'An eco-friendly sustainable business',
        industry: 'other',
      });

      expect(result.primary).toBe('leaf');
      expect(result.secondary).toBe('natural texture');
      expect(result.mood).toBe('organic');
    });

    it('should detect speed keywords and use lightning bolt', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractLogoSymbols({
        businessName: 'FastDelivery',
        description: 'Quick and fast delivery service',
        industry: 'other',
      });

      expect(result.primary).toBe('lightning bolt');
      expect(result.secondary).toBe('motion lines');
      expect(result.mood).toBe('dynamic');
    });

    it('should detect luxury keywords and use crown symbol', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractLogoSymbols({
        businessName: 'LuxuryBrand',
        description: 'Premium luxury products',
        industry: 'fashion',
      });

      expect(result.primary).toBe('crown');
      expect(result.secondary).toBe('elegant curves');
      expect(result.mood).toBe('luxurious');
    });

    it('should return industry-specific symbols for tech', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractLogoSymbols({
        businessName: 'TechCorp',
        description: 'Software company',
        industry: 'tech',
      });

      expect(result.primary).toBe('circuit pattern');
      expect(result.secondary).toBe('geometric grid');
      expect(result.mood).toBe('innovative');
    });

    it('should return industry-specific symbols for food', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractLogoSymbols({
        businessName: 'Tasty Restaurant',
        description: 'Fine dining',
        industry: 'food',
      });

      expect(result.primary).toBe('chef hat');
      expect(result.secondary).toBe('organic shapes');
      expect(result.mood).toBe('appetizing');
    });
  });

  describe('extractBrandPersonality', () => {
    const validParams = {
      businessName: 'LuxuryBrand',
      description: 'A luxury fashion brand for modern professionals',
      industry: 'fashion',
    };

    it('should extract personality scores successfully', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                modern: 0.9,
                classic: 0.3,
                playful: 0.2,
                elegant: 0.95,
                bold: 0.6,
                friendly: 0.4,
                professional: 0.8,
                luxurious: 0.9,
              }),
            },
          },
        ],
      });

      const result = await extractBrandPersonality(validParams);

      expect(result).toEqual({
        modern: 0.9,
        classic: 0.3,
        playful: 0.2,
        elegant: 0.95,
        bold: 0.6,
        friendly: 0.4,
        professional: 0.8,
        luxurious: 0.9,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'llama-3.1-8b-instant',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });
    });

    it('should clamp values outside 0-1 range', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                modern: 1.5,
                classic: -0.3,
                playful: 0.5,
                elegant: 2.0,
                bold: 0.8,
                friendly: -1.0,
                professional: 0.7,
                luxurious: 0.6,
              }),
            },
          },
        ],
      });

      const result = await extractBrandPersonality(validParams);

      expect(result.modern).toBe(1.0);
      expect(result.classic).toBe(0.0);
      expect(result.elegant).toBe(1.0);
      expect(result.friendly).toBe(0.0);
    });

    it('should use deterministic fallback when Groq not configured', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractBrandPersonality(validParams);

      expect(result).toBeDefined();
      expect(typeof result.modern).toBe('number');
      expect(result.modern).toBeGreaterThanOrEqual(0);
      expect(result.modern).toBeLessThanOrEqual(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should detect modern keywords in deterministic mode', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractBrandPersonality({
        businessName: 'ModernTech',
        description: 'A modern, cutting-edge innovative company',
        industry: 'tech',
      });

      expect(result.modern).toBe(0.9);
    });

    it('should detect classic keywords in deterministic mode', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractBrandPersonality({
        businessName: 'ClassicBank',
        description: 'A traditional, timeless financial institution',
        industry: 'finance',
      });

      expect(result.classic).toBe(0.9);
    });

    it('should detect playful keywords', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractBrandPersonality({
        businessName: 'FunGames',
        description: 'A fun, playful, creative gaming company',
        industry: 'creative',
      });

      expect(result.playful).toBe(0.8);
    });

    it('should use industry-based defaults for tech', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractBrandPersonality({
        businessName: 'TechCorp',
        description: 'Software company',
        industry: 'tech',
      });

      expect(result.modern).toBeGreaterThanOrEqual(0.5);
      expect(result.professional).toBeGreaterThanOrEqual(0.6);
    });

    it('should handle AI failure gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('Network error'));

      const result = await extractBrandPersonality(validParams);

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(8);
    });
  });

  describe('extractColorPreferences', () => {
    const validParams = {
      businessName: 'EcoStart',
      description: 'An eco-friendly startup focused on sustainability',
      industry: 'other',
    };

    it('should extract color preferences successfully', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                mood: 'calm',
                trend: 'earthy',
                keywords: ['nature', 'growth', 'trust'],
              }),
            },
          },
        ],
      });

      const result = await extractColorPreferences(validParams);

      expect(result).toEqual({
        mood: 'calm',
        trend: 'earthy',
        keywords: ['nature', 'growth', 'trust'],
      });
    });

    it('should validate mood values and use default for invalid', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                mood: 'invalid-mood',
                trend: 'earthy',
                keywords: ['test'],
              }),
            },
          },
        ],
      });

      const result = await extractColorPreferences(validParams);

      expect(result.mood).toBe('professional');
    });

    it('should validate trend values and use default for invalid', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                mood: 'calm',
                trend: 'invalid-trend',
                keywords: ['test'],
              }),
            },
          },
        ],
      });

      const result = await extractColorPreferences(validParams);

      expect(result.trend).toBe('classic');
    });

    it('should limit keywords to 5 items', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                mood: 'calm',
                trend: 'earthy',
                keywords: ['one', 'two', 'three', 'four', 'five', 'six', 'seven'],
              }),
            },
          },
        ],
      });

      const result = await extractColorPreferences(validParams);

      expect(result.keywords).toHaveLength(5);
    });

    it('should handle non-array keywords', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                mood: 'calm',
                trend: 'earthy',
                keywords: 'not-an-array',
              }),
            },
          },
        ],
      });

      const result = await extractColorPreferences(validParams);

      expect(result.keywords).toEqual([]);
    });

    it('should use deterministic fallback when Groq not configured', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences(validParams);

      expect(['energetic', 'calm', 'professional', 'playful', 'luxurious']).toContain(result.mood);
      expect(['earthy', 'futuristic', 'classic', 'vibrant']).toContain(result.trend);
      expect(Array.isArray(result.keywords)).toBe(true);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should detect energetic mood from keywords', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences({
        businessName: 'EnergyDrink',
        description: 'Energetic and dynamic vibrant brand',
        industry: 'food',
      });

      expect(result.mood).toBe('energetic');
    });

    it('should detect calm mood from keywords', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences({
        businessName: 'WellnessSpa',
        description: 'A calm, peaceful wellness center',
        industry: 'health',
      });

      expect(result.mood).toBe('calm');
    });

    it('should detect playful mood', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences({
        businessName: 'FunToys',
        description: 'Fun and playful creative toys',
        industry: 'creative',
      });

      expect(result.mood).toBe('playful');
    });

    it('should detect luxury mood', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences({
        businessName: 'LuxBrand',
        description: 'Premium luxury exclusive products',
        industry: 'fashion',
      });

      expect(result.mood).toBe('luxurious');
    });

    it('should detect earthy trend', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences({
        businessName: 'NatureCo',
        description: 'Natural organic eco-friendly sustainable',
        industry: 'other',
      });

      expect(result.trend).toBe('earthy');
    });

    it('should detect futuristic trend', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences({
        businessName: 'AITech',
        description: 'Futuristic AI innovation technology',
        industry: 'tech',
      });

      expect(result.trend).toBe('futuristic');
    });

    it('should detect vibrant trend', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences({
        businessName: 'ColorBrand',
        description: 'Vibrant bold colorful bright designs',
        industry: 'creative',
      });

      expect(result.trend).toBe('vibrant');
    });

    it('should return industry defaults for tech', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await extractColorPreferences({
        businessName: 'TechCorp',
        description: 'Software',
        industry: 'tech',
      });

      expect(result.mood).toBe('professional');
      expect(result.trend).toBe('futuristic');
      expect(result.keywords).toContain('innovation');
    });
  });

  describe('generateColorJustification', () => {
    const validParams = {
      businessName: 'TechFlow',
      description: 'Software platform',
      industry: 'tech',
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
      },
      mood: 'professional',
      trend: 'futuristic',
    };

    it('should generate justification successfully', async () => {
      const mockJustification = 'The blue primary color conveys trust and professionalism. The purple secondary adds innovation. The green accent provides visual emphasis.';

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockJustification,
            },
          },
        ],
      });

      const result = await generateColorJustification(validParams);

      expect(result).toBe(mockJustification);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'llama-3.1-8b-instant',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('TechFlow'),
          }),
        ]),
        temperature: 0.7,
        max_tokens: 200,
      });
    });

    it('should return fallback when Groq not configured', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await generateColorJustification(validParams);

      expect(result).toContain('professional');
      expect(result).toContain('tech');
      expect(result).toContain('futuristic');
      expect(result).toContain('#3B82F6');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should return fallback when AI fails', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await generateColorJustification(validParams);

      expect(result).toBeTruthy();
      expect(result).toContain('professional');
    });

    it('should return fallback when response is empty', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await generateColorJustification(validParams);

      expect(result).toBeTruthy();
    });

    it('should trim whitespace from response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: '  \n  Color justification text  \n  ',
            },
          },
        ],
      });

      const result = await generateColorJustification(validParams);

      expect(result).toBe('Color justification text');
    });
  });

  describe('generateFontJustification', () => {
    const validParams = {
      businessName: 'TechFlow',
      description: 'Software platform',
      industry: 'tech',
      fonts: {
        primary: { name: 'Poppins', category: 'sans-serif' },
        secondary: { name: 'Inter', category: 'sans-serif' },
      },
      personality: {
        modern: 0.9,
        classic: 0.2,
        playful: 0.3,
        elegant: 0.6,
        bold: 0.7,
        friendly: 0.5,
        professional: 0.8,
        luxurious: 0.3,
      },
    };

    it('should generate font justification successfully', async () => {
      const mockJustification = 'Poppins provides a modern, bold appearance for headlines. Inter offers excellent readability for body text. Together they create a professional yet friendly brand identity.';

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockJustification,
            },
          },
        ],
      });

      const result = await generateFontJustification(validParams);

      expect(result).toBe(mockJustification);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'llama-3.1-8b-instant',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Poppins'),
          }),
        ]),
        temperature: 0.7,
        max_tokens: 200,
      });
    });

    it('should include top 3 personality traits in prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Font justification',
            },
          },
        ],
      });

      await generateFontJustification(validParams);

      const userMessage = mockCreate.mock.calls[0]?.[0]?.messages?.[1]?.content;
      expect(userMessage).toContain('modern');
      expect(userMessage).toContain('professional');
      expect(userMessage).toContain('bold');
    });

    it('should return fallback when Groq not configured', async () => {
      delete process.env['GROQ_API_KEY'];

      const result = await generateFontJustification(validParams);

      expect(result).toContain('Poppins');
      expect(result).toContain('Inter');
      expect(result).toContain('sans-serif');
      expect(result).toContain('tech');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should return fallback when AI fails', async () => {
      mockCreate.mockRejectedValue(new Error('Network error'));

      const result = await generateFontJustification(validParams);

      expect(result).toBeTruthy();
      expect(result).toContain('Poppins');
    });

    it('should return fallback when response is empty', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await generateFontJustification(validParams);

      expect(result).toBeTruthy();
    });

    it('should trim whitespace from response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: '  \n  Font justification text  \n  ',
            },
          },
        ],
      });

      const result = await generateFontJustification(validParams);

      expect(result).toBe('Font justification text');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle rate limit errors', async () => {
      mockCreate.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
      });

      const result = await extractLogoSymbols({
        businessName: 'Test',
        description: 'Test',
        industry: 'tech',
      });

      expect(result).toBeDefined();
      expect(result.primary).toBeTruthy();
    });

    it('should handle API key errors', async () => {
      mockCreate.mockRejectedValue({
        status: 401,
        message: 'Invalid API key',
      });

      const result = await extractLogoSymbols({
        businessName: 'Test',
        description: 'Test',
        industry: 'tech',
      });

      expect(result).toBeDefined();
    });

    it('should handle network timeout', async () => {
      mockCreate.mockRejectedValue(new Error('ETIMEDOUT'));

      const result = await extractBrandPersonality({
        businessName: 'Test',
        description: 'Test',
        industry: 'tech',
      });

      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(8);
    });

    it('should handle empty response choices array', async () => {
      mockCreate.mockResolvedValue({
        choices: [],
      });

      const result = await extractColorPreferences({
        businessName: 'Test',
        description: 'Test',
        industry: 'tech',
      });

      expect(result).toBeDefined();
    });
  });
});
