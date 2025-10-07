import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateLogoTemplate,
  generateSVGCode,
  refineSVGCode,
  reviewSVGQuality,
  generateLogoWithGroq,
  isGroqConfigured,
  GroqLogoError,
  GROQ_LOGO_MODELS,
} from '../groq-logo';
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

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('groq-logo', () => {
  const originalEnv = process.env;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env['GROQ_API_KEY'] = 'test-api-key';
    mockCreate = vi.mocked(Groq.prototype.chat.completions.create);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GROQ_LOGO_MODELS', () => {
    it('should have correct model identifiers', () => {
      expect(GROQ_LOGO_MODELS.TEMPLATE).toBe('llama-3.3-70b-versatile');
      expect(GROQ_LOGO_MODELS.CODE).toBe('llama-3.1-8b-instant');
      expect(GROQ_LOGO_MODELS.REVIEW).toBe('llama-3.1-8b-instant');
    });
  });

  describe('GroqLogoError', () => {
    it('should create error with message', () => {
      const error = new GroqLogoError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('GroqLogoError');
    });

    it('should create error with status code', () => {
      const error = new GroqLogoError('Test error', 500);
      expect(error.statusCode).toBe(500);
    });

    it('should create error with code', () => {
      const error = new GroqLogoError('Test error', 500, 'TEST_CODE');
      expect(error.code).toBe('TEST_CODE');
    });

    it('should be instanceof Error', () => {
      const error = new GroqLogoError('Test error');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('isGroqConfigured', () => {
    it('should return true when API key is set', () => {
      process.env['GROQ_API_KEY'] = 'test-key';
      expect(isGroqConfigured()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env['GROQ_API_KEY'];
      expect(isGroqConfigured()).toBe(false);
    });

    it('should return false for empty string', () => {
      process.env['GROQ_API_KEY'] = '';
      expect(isGroqConfigured()).toBe(false);
    });
  });

  describe('generateLogoTemplate', () => {
    const validParams = {
      businessName: 'TechFlow',
      description: 'Modern software platform',
      industry: 'tech',
      symbols: {
        primary: 'circuit board',
        secondary: 'flowing lines',
        mood: 'innovative',
      },
    };

    it('should generate template successfully', async () => {
      const mockResponse = `
SCENE: circuit board, flowing data stream, geometric frame
OBJECTS: circuit: interconnected nodes and lines; stream: curved flowing paths; frame: rounded rectangle border
LAYOUT: Circuit centered at (100, 80), stream flowing from (60, 100) to (140, 100), frame at viewBox edges with 10px padding, colors: primary #3B82F6 for circuit, secondary #8B5CF6 for stream, accent #10B981 for frame
      `;

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockResponse,
            },
          },
        ],
      });

      const result = await generateLogoTemplate(validParams);

      expect(result.sceneLevel).toContain('circuit board');
      expect(result.objectLevel).toContain('circuit');
      expect(result.layoutLevel).toContain('Circuit centered');

      expect(mockCreate).toHaveBeenCalledWith({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        model: GROQ_LOGO_MODELS.TEMPLATE,
        temperature: 0.8,
        max_tokens: 2000,
      });
    });

    it('should handle response without proper sections', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Just some random text without sections',
            },
          },
        ],
      });

      const result = await generateLogoTemplate(validParams);

      expect(result.sceneLevel).toBeTruthy();
      expect(result.objectLevel).toBe('');
      expect(result.layoutLevel).toBe('');
    });

    it('should throw GroqLogoError when API key missing', async () => {
      delete process.env['GROQ_API_KEY'];

      await expect(generateLogoTemplate(validParams)).rejects.toThrow(GroqLogoError);
      await expect(generateLogoTemplate(validParams)).rejects.toThrow('GROQ_API_KEY not configured');
    });

    it('should throw GroqLogoError on API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(generateLogoTemplate(validParams)).rejects.toThrow(GroqLogoError);
      await expect(generateLogoTemplate(validParams)).rejects.toThrow('Template generation failed');
    });

    it('should include business details in prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }],
      });

      await generateLogoTemplate(validParams);

      const userMessage = mockCreate.mock.calls[0]?.[0]?.messages?.[1]?.content;
      expect(userMessage).toContain('TechFlow');
      expect(userMessage).toContain('Modern software platform');
      expect(userMessage).toContain('circuit board');
    });
  });

  describe('generateSVGCode', () => {
    const validTemplate = {
      sceneLevel: 'circuit board, geometric shapes',
      objectLevel: 'circuit: nodes and connections',
      layoutLevel: 'centered composition with balanced spacing',
    };

    const validPalette = {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
    };

    it('should generate valid SVG code', async () => {
      const mockSVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" fill="#3B82F6"/>
  <rect x="75" y="75" width="50" height="50" fill="#8B5CF6"/>
</svg>`;

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockSVG,
            },
          },
        ],
      });

      const result = await generateSVGCode(validTemplate, validPalette);

      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
      expect(result).toContain('viewBox');

      expect(mockCreate).toHaveBeenCalledWith({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        model: GROQ_LOGO_MODELS.CODE,
        temperature: 0.3,
        max_tokens: 4000,
      });
    });

    it('should extract SVG from markdown code blocks', async () => {
      const mockResponse = `Here's your logo:

\`\`\`svg
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" fill="#3B82F6"/>
</svg>
\`\`\`

Hope you like it!`;

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockResponse,
            },
          },
        ],
      });

      const result = await generateSVGCode(validTemplate, validPalette);

      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
      expect(result).not.toContain('```');
    });

    it('should throw error if no SVG found in response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'No SVG code here',
            },
          },
        ],
      });

      await expect(generateSVGCode(validTemplate, validPalette)).rejects.toThrow(GroqLogoError);
      await expect(generateSVGCode(validTemplate, validPalette)).rejects.toThrow('No valid SVG code generated');
    });

    it('should throw error when API key missing', async () => {
      delete process.env['GROQ_API_KEY'];

      await expect(generateSVGCode(validTemplate, validPalette)).rejects.toThrow(GroqLogoError);
      await expect(generateSVGCode(validTemplate, validPalette)).rejects.toThrow('GROQ_API_KEY not configured');
    });

    it('should include color palette in prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="50"/></svg>',
            },
          },
        ],
      });

      await generateSVGCode(validTemplate, validPalette);

      const userMessage = mockCreate.mock.calls[0]?.[0]?.messages?.[1]?.content;
      expect(userMessage).toContain('#3B82F6');
      expect(userMessage).toContain('#8B5CF6');
      expect(userMessage).toContain('#10B981');
    });

    it('should handle API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API timeout'));

      await expect(generateSVGCode(validTemplate, validPalette)).rejects.toThrow(GroqLogoError);
      await expect(generateSVGCode(validTemplate, validPalette)).rejects.toThrow('SVG generation failed');
    });
  });

  describe('refineSVGCode', () => {
    const validSVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" fill="#3B82F6"/>
</svg>`;
    const originalPrompt = 'TechFlow - Modern software - circuit board';

    it('should refine SVG code successfully', async () => {
      const refinedSVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="60" fill="#3B82F6"/>
  <rect x="70" y="70" width="60" height="60" fill="#8B5CF6"/>
</svg>`;

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: refinedSVG,
            },
          },
        ],
      });

      const result = await refineSVGCode(validSVG, originalPrompt, 1);

      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
    });

    it('should return original SVG if refinement fails', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'No SVG here',
            },
          },
        ],
      });

      const result = await refineSVGCode(validSVG, originalPrompt, 1);

      expect(result).toBe(validSVG);
    });

    it('should return original SVG on API error', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await refineSVGCode(validSVG, originalPrompt, 1);

      expect(result).toBe(validSVG);
    });

    it('should include iteration number in prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: validSVG } }],
      });

      await refineSVGCode(validSVG, originalPrompt, 2);

      const userMessage = mockCreate.mock.calls[0]?.[0]?.messages?.[1]?.content;
      expect(userMessage).toContain('iteration 2/2');
    });

    it('should include original prompt in refinement', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: validSVG } }],
      });

      await refineSVGCode(validSVG, originalPrompt, 1);

      const userMessage = mockCreate.mock.calls[0]?.[0]?.messages?.[1]?.content;
      expect(userMessage).toContain('TechFlow');
    });

    it('should handle empty response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await refineSVGCode(validSVG, originalPrompt, 1);

      expect(result).toBe(validSVG);
    });
  });

  describe('reviewSVGQuality', () => {
    const validSVG = `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="50" fill="#3B82F6"/></svg>`;
    const businessName = 'TechFlow';

    it('should return quality score and feedback', async () => {
      const mockResponse = `SCORE: 8.5/10
FEEDBACK: Strong geometric design with good use of negative space. The circular element is memorable and scales well. Could benefit from additional visual interest.`;

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockResponse,
            },
          },
        ],
      });

      const result = await reviewSVGQuality(validSVG, businessName);

      expect(result.score).toBe(8.5);
      expect(result.feedback).toContain('Strong geometric design');
    });

    it('should parse integer scores', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'SCORE: 9/10\nFEEDBACK: Excellent logo',
            },
          },
        ],
      });

      const result = await reviewSVGQuality(validSVG, businessName);

      expect(result.score).toBe(9);
    });

    it('should default to 7.0 if score not found', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'This is feedback without a score',
            },
          },
        ],
      });

      const result = await reviewSVGQuality(validSVG, businessName);

      expect(result.score).toBe(7.0);
    });

    it('should extract feedback even without FEEDBACK label', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'SCORE: 8/10\nThis is the feedback text',
            },
          },
        ],
      });

      const result = await reviewSVGQuality(validSVG, businessName);

      expect(result.feedback).toContain('This is the feedback text');
    });

    it('should return default values on API error', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await reviewSVGQuality(validSVG, businessName);

      expect(result.score).toBe(7.0);
      expect(result.feedback).toBe('Quality review unavailable');
    });

    it('should include business name in prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'SCORE: 8/10\nFEEDBACK: Good' } }],
      });

      await reviewSVGQuality(validSVG, businessName);

      const userMessage = mockCreate.mock.calls[0]?.[0]?.messages?.[1]?.content;
      expect(userMessage).toContain('TechFlow');
    });
  });

  describe('generateLogoWithGroq', () => {
    const validParams = {
      businessName: 'TechFlow',
      description: 'Modern software platform',
      industry: 'tech',
      symbols: {
        primary: 'circuit board',
        secondary: 'flowing lines',
        mood: 'innovative',
      },
      colorPalette: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
      },
    };

    const validSVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="50" fill="#3B82F6"/>
  <rect x="75" y="75" width="50" height="50" fill="#8B5CF6"/>
</svg>`;

    const validTemplate = {
      sceneLevel: 'circuit board',
      objectLevel: 'nodes and connections',
      layoutLevel: 'centered layout',
    };

    it('should generate complete logo successfully on first attempt', async () => {
      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // Template generation
          return {
            choices: [
              {
                message: {
                  content: 'SCENE: circuit\nOBJECTS: nodes\nLAYOUT: centered',
                },
              },
            ],
          };
        } else if (callCount === 2) {
          // SVG generation
          return {
            choices: [{ message: { content: validSVG } }],
          };
        } else if (callCount <= 4) {
          // Refinements (2 iterations)
          return {
            choices: [{ message: { content: validSVG } }],
          };
        } else {
          // Quality review
          return {
            choices: [{ message: { content: 'SCORE: 9/10\nFEEDBACK: Excellent logo' } }],
          };
        }
      });

      const result = await generateLogoWithGroq(validParams);

      expect(result.svgCode).toContain('<svg');
      expect(result.template).toBeDefined();
      expect(result.quality.score).toBeGreaterThanOrEqual(8);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should retry if quality score is below threshold', async () => {
      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        const attemptNumber = Math.floor((callCount - 1) / 5) + 1;

        if (callCount % 5 === 1) {
          // Template
          return { choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }] };
        } else if (callCount % 5 === 2) {
          // SVG generation
          return { choices: [{ message: { content: validSVG } }] };
        } else if (callCount % 5 === 3 || callCount % 5 === 4) {
          // Refinements
          return { choices: [{ message: { content: validSVG } }] };
        } else {
          // Quality review - first attempt low, second attempt high
          const score = attemptNumber === 1 ? 6.0 : 9.0;
          return {
            choices: [{ message: { content: `SCORE: ${score}/10\nFEEDBACK: Test feedback` } }],
          };
        }
      });

      const result = await generateLogoWithGroq(validParams);

      expect(result.quality.score).toBeGreaterThanOrEqual(8);
    });

    it('should reject SVG with text elements', async () => {
      const svgWithText = `<svg viewBox="0 0 200 200">
  <text x="100" y="100">Logo</text>
</svg>`;

      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        if (callCount === 1 || callCount === 6) {
          // Templates
          return { choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }] };
        } else if (callCount === 2) {
          // First SVG with text (invalid)
          return { choices: [{ message: { content: svgWithText } }] };
        } else if (callCount === 7) {
          // Second SVG without text (valid)
          return { choices: [{ message: { content: validSVG } }] };
        } else if (callCount === 8 || callCount === 9) {
          // Refinements
          return { choices: [{ message: { content: validSVG } }] };
        } else {
          // Quality review
          return { choices: [{ message: { content: 'SCORE: 9/10\nFEEDBACK: Good' } }] };
        }
      });

      const result = await generateLogoWithGroq(validParams);

      expect(result.svgCode).not.toContain('<text');
      expect(result.svgCode).toContain('<circle');
    });

    it('should reject SVG with too few shapes', async () => {
      const simpleSVG = '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="50"/></svg>';

      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        if (callCount === 1 || callCount === 6) {
          return { choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }] };
        } else if (callCount === 2) {
          // Too simple
          return { choices: [{ message: { content: simpleSVG } }] };
        } else if (callCount === 7) {
          // Valid SVG
          return { choices: [{ message: { content: validSVG } }] };
        } else if (callCount === 8 || callCount === 9) {
          return { choices: [{ message: { content: validSVG } }] };
        } else {
          return { choices: [{ message: { content: 'SCORE: 9/10\nFEEDBACK: Good' } }] };
        }
      });

      const result = await generateLogoWithGroq(validParams);

      // Should have multiple shapes
      const shapeCount = (result.svgCode.match(/<(rect|circle|ellipse|path|polygon)/g) || []).length;
      expect(shapeCount).toBeGreaterThanOrEqual(2);
    });

    it('should reject SVG with too many shapes', async () => {
      const complexSVG =
        '<svg viewBox="0 0 200 200">' +
        Array(60)
          .fill('<circle cx="10" cy="10" r="5"/>')
          .join('') +
        '</svg>';

      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        if (callCount === 1 || callCount === 6) {
          return { choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }] };
        } else if (callCount === 2) {
          return { choices: [{ message: { content: complexSVG } }] };
        } else if (callCount === 7) {
          return { choices: [{ message: { content: validSVG } }] };
        } else if (callCount === 8 || callCount === 9) {
          return { choices: [{ message: { content: validSVG } }] };
        } else {
          return { choices: [{ message: { content: 'SCORE: 9/10\nFEEDBACK: Good' } }] };
        }
      });

      const result = await generateLogoWithGroq(validParams);

      const shapeCount = (result.svgCode.match(/<(rect|circle|ellipse|path|polygon)/g) || []).length;
      expect(shapeCount).toBeLessThan(50);
    });

    it('should reject SVG without viewBox', async () => {
      const noViewBoxSVG = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="50"/><rect x="75" y="75" width="50" height="50"/></svg>';

      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        if (callCount === 1 || callCount === 6) {
          return { choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }] };
        } else if (callCount === 2) {
          return { choices: [{ message: { content: noViewBoxSVG } }] };
        } else if (callCount === 7) {
          return { choices: [{ message: { content: validSVG } }] };
        } else if (callCount === 8 || callCount === 9) {
          return { choices: [{ message: { content: validSVG } }] };
        } else {
          return { choices: [{ message: { content: 'SCORE: 9/10\nFEEDBACK: Good' } }] };
        }
      });

      const result = await generateLogoWithGroq(validParams);

      expect(result.svgCode).toContain('viewBox');
    });

    it('should throw error if all attempts fail', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(generateLogoWithGroq(validParams)).rejects.toThrow(GroqLogoError);
      await expect(generateLogoWithGroq(validParams)).rejects.toThrow('Failed to generate acceptable logo');
    });

    it('should return best result if max attempts reached', async () => {
      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        const attemptNumber = Math.floor((callCount - 1) / 5) + 1;

        if (callCount % 5 === 1) {
          return { choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }] };
        } else if (callCount % 5 === 2) {
          return { choices: [{ message: { content: validSVG } }] };
        } else if (callCount % 5 === 3 || callCount % 5 === 4) {
          return { choices: [{ message: { content: validSVG } }] };
        } else {
          // All attempts below threshold, but varying scores
          const score = attemptNumber === 3 ? 7.5 : 6.5;
          return {
            choices: [{ message: { content: `SCORE: ${score}/10\nFEEDBACK: Below threshold` } }],
          };
        }
      });

      const result = await generateLogoWithGroq(validParams);

      // Should return best result (7.5 from attempt 3)
      expect(result.quality.score).toBe(7.5);
    });

    it('should handle refinement failures gracefully', async () => {
      let callCount = 0;
      mockCreate.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return { choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }] };
        } else if (callCount === 2) {
          return { choices: [{ message: { content: validSVG } }] };
        } else if (callCount === 3 || callCount === 4) {
          // Refinements fail - no SVG in response
          return { choices: [{ message: { content: 'No SVG here' } }] };
        } else {
          return { choices: [{ message: { content: 'SCORE: 9/10\nFEEDBACK: Good' } }] };
        }
      });

      const result = await generateLogoWithGroq(validParams);

      // Should still succeed with original SVG
      expect(result.svgCode).toContain('<svg');
    });

    it('should perform 2 refinement iterations', async () => {
      let callCount = 0;
      let refinementCount = 0;

      mockCreate.mockImplementation(async (params) => {
        callCount++;
        const systemMessage = params.messages?.[0]?.content;

        if (systemMessage?.includes('senior brand designer reviewing')) {
          refinementCount++;
        }

        if (callCount === 1) {
          // Template generation
          return { choices: [{ message: { content: 'SCENE: test\nOBJECTS: test\nLAYOUT: test' } }] };
        } else if (callCount === 2) {
          // Initial SVG generation
          return { choices: [{ message: { content: validSVG } }] };
        } else if (callCount === 3 || callCount === 4) {
          // Refinements (should be called twice)
          return { choices: [{ message: { content: validSVG } }] };
        } else {
          // Quality review
          return { choices: [{ message: { content: 'SCORE: 9/10\nFEEDBACK: Excellent' } }] };
        }
      });

      await generateLogoWithGroq(validParams);

      expect(refinementCount).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle API rate limiting', async () => {
      mockCreate.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
      });

      await expect(
        generateLogoTemplate({
          businessName: 'Test',
          description: 'Test',
          industry: 'tech',
          symbols: { primary: 'test', secondary: 'test', mood: 'test' },
        })
      ).rejects.toThrow(GroqLogoError);
    });

    it('should handle network timeouts', async () => {
      mockCreate.mockRejectedValue(new Error('ETIMEDOUT'));

      await expect(
        generateSVGCode(
          { sceneLevel: 'test', objectLevel: 'test', layoutLevel: 'test' },
          { primary: '#000', secondary: '#111', accent: '#222' }
        )
      ).rejects.toThrow(GroqLogoError);
    });

    it('should handle empty template response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      });

      const result = await generateLogoTemplate({
        businessName: 'Test',
        description: 'Test',
        industry: 'tech',
        symbols: { primary: 'test', secondary: 'test', mood: 'test' },
      });

      expect(result.sceneLevel).toBe('');
    });
  });
});
