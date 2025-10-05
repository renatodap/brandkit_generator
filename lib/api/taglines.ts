import { callOpenRouter, OPENROUTER_MODELS, OpenRouterError } from '@/lib/api/openrouter';
import type { TaglineGenerationParams, Industry } from '@/types';

/**
 * Industry-specific tagline templates and keywords
 */
const industryTaglineStyles: Record<
  Industry,
  {
    keywords: string[];
    tone: string;
    examples: string[];
  }
> = {
  tech: {
    keywords: ['innovate', 'transform', 'future', 'smart', 'digital', 'connect'],
    tone: 'innovative, forward-thinking, precise',
    examples: [
      'Innovation at your fingertips',
      'Building the future, today',
      'Smart solutions for modern challenges',
    ],
  },
  food: {
    keywords: ['fresh', 'delicious', 'authentic', 'savor', 'taste', 'quality'],
    tone: 'warm, inviting, appetizing',
    examples: [
      'Taste the difference',
      'Fresh from our kitchen to yours',
      'Where quality meets flavor',
    ],
  },
  fashion: {
    keywords: ['style', 'elegant', 'unique', 'timeless', 'bold', 'chic'],
    tone: 'sophisticated, aspirational, trendy',
    examples: [
      'Wear your confidence',
      'Timeless style, modern edge',
      'Elegance redefined',
    ],
  },
  health: {
    keywords: ['wellness', 'care', 'healthy', 'vitality', 'trust', 'better'],
    tone: 'reassuring, professional, caring',
    examples: [
      'Your health, our priority',
      'Caring for your wellbeing',
      'Better health starts here',
    ],
  },
  creative: {
    keywords: ['imagine', 'create', 'inspire', 'express', 'original', 'vision'],
    tone: 'imaginative, bold, expressive',
    examples: [
      'Where creativity comes alive',
      'Inspire. Create. Innovate.',
      'Your vision, our passion',
    ],
  },
  finance: {
    keywords: ['secure', 'trust', 'grow', 'smart', 'stable', 'prosper'],
    tone: 'trustworthy, professional, confident',
    examples: [
      'Your financial future, secured',
      'Grow your wealth with confidence',
      'Smart money, smarter choices',
    ],
  },
  education: {
    keywords: ['learn', 'grow', 'discover', 'empower', 'knowledge', 'excel'],
    tone: 'encouraging, accessible, inspiring',
    examples: [
      'Empowering minds, shaping futures',
      'Where learning comes alive',
      'Discover your potential',
    ],
  },
  other: {
    keywords: ['quality', 'excellence', 'trust', 'better', 'smart', 'reliable'],
    tone: 'professional, versatile, trustworthy',
    examples: [
      'Excellence in every detail',
      'Quality you can trust',
      'Making life better',
    ],
  },
};

/**
 * Fallback taglines for each industry
 * Used when AI generation fails or returns poor results
 */
const fallbackTaglines: Record<Industry, string[]> = {
  tech: [
    'Innovation for tomorrow',
    'Technology simplified',
    'Smart solutions, real results',
    'Building the future',
    'Where innovation meets simplicity',
  ],
  food: [
    'Taste the difference',
    'Fresh flavors, made daily',
    'Quality ingredients, authentic taste',
    'Bringing people together',
    'Made with love',
  ],
  fashion: [
    'Style that speaks',
    'Elegance redefined',
    'Wear your story',
    'Timeless, yet modern',
    'Fashion with purpose',
  ],
  health: [
    'Your wellbeing matters',
    'Caring for your health',
    'Better health, better life',
    'Trusted healthcare partner',
    'Wellness starts here',
  ],
  creative: [
    'Creativity unleashed',
    'Your vision, realized',
    'Where ideas come alive',
    'Inspiring imagination',
    'Create without limits',
  ],
  finance: [
    'Your financial partner',
    'Secure your future',
    'Smart financial solutions',
    'Building wealth together',
    'Trust. Grow. Prosper.',
  ],
  education: [
    'Learning reimagined',
    'Empowering tomorrow',
    'Knowledge transforms',
    'Where curiosity thrives',
    'Inspiring excellence',
  ],
  other: [
    'Excellence delivered',
    'Quality first, always',
    'Your trusted partner',
    'Making a difference',
    'Built for you',
  ],
};


/**
 * Clean and validate generated tagline
 * @param rawTagline - Raw tagline from AI
 * @param params - Original generation parameters
 * @returns Cleaned tagline or null if invalid
 */
function cleanTagline(
  rawTagline: string,
  params: TaglineGenerationParams
): string | null {
  // Remove common prefixes and suffixes
  let cleaned = rawTagline
    .replace(/^(tagline:|slogan:|motto:)\s*/i, '')
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\.$/, '') // Remove trailing period
    .trim();

  // Validate tagline quality
  const wordCount = cleaned.split(/\s+/).length;
  const charCount = cleaned.length;

  // Reject if too short or too long
  if (wordCount < 2 || wordCount > 8) {
    return null;
  }

  if (charCount < 10 || charCount > 60) {
    return null;
  }

  // Reject if it contains the business name (usually redundant)
  const businessNameLower = params.businessName.toLowerCase();
  if (cleaned.toLowerCase().includes(businessNameLower)) {
    return null;
  }

  // Reject if it contains common filler phrases
  const fillerPhrases = [
    'i am',
    'we are',
    'this is',
    'it is',
    'welcome to',
    'introducing',
  ];

  for (const phrase of fillerPhrases) {
    if (cleaned.toLowerCase().includes(phrase)) {
      return null;
    }
  }

  // Capitalize first letter of each major word
  cleaned = cleaned
    .split(' ')
    .map((word, index) => {
      // Don't capitalize articles, conjunctions, prepositions (unless first word)
      const dontCapitalize = ['a', 'an', 'the', 'and', 'or', 'but', 'for', 'with'];
      if (index === 0 || !dontCapitalize.includes(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');

  return cleaned;
}

/**
 * Get a random fallback tagline for an industry
 * @param industry - Industry category
 * @returns Fallback tagline
 */
function getFallbackTagline(industry: Industry): string {
  const taglines = fallbackTaglines[industry] || fallbackTaglines.other;
  const randomIndex = Math.floor(Math.random() * taglines.length);
  return taglines[randomIndex] || 'Quality and excellence';
}

/**
 * Generate a compelling tagline using AI
 * @param params - Tagline generation parameters
 * @returns Promise resolving to generated tagline
 * @throws {OpenRouterError} If generation fails completely
 *
 * @example
 * ```typescript
 * const tagline = await generateTagline({
 *   businessName: 'TechCorp',
 *   industry: 'tech',
 *   description: 'A cutting-edge software company'
 * });
 * ```
 */
export async function generateTagline(
  params: TaglineGenerationParams
): Promise<string> {
  try {
    const { businessName, industry, description } = params;
    const style = industryTaglineStyles[industry] || industryTaglineStyles.other;

    const systemPrompt = `You are a professional brand copywriter specializing in memorable taglines. Generate concise, impactful taglines that capture the essence of a brand.`;

    const userPrompt = `Create a compelling tagline for "${businessName}", a ${industry} business.

Description: ${description}

Style: ${style.tone}
Keywords to inspire: ${style.keywords.join(', ')}

Requirements:
- 3-6 words maximum
- No business name in tagline
- ${style.tone} tone
- Memorable and unique
- Action-oriented or aspirational

Examples of good ${industry} taglines:
${style.examples.map((ex) => `- ${ex}`).join('\n')}

Return ONLY the tagline, nothing else.`;

    const response = await callOpenRouter(
      OPENROUTER_MODELS.DEEPSEEK_CHAT,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.8, maxTokens: 50 }
    );

    // Clean and validate the result
    const cleanedTagline = cleanTagline(response, params);

    if (cleanedTagline) {
      return cleanedTagline;
    }

    // If cleaning failed, use fallback
    console.warn('Generated tagline failed validation, using fallback');
    return getFallbackTagline(params.industry);
  } catch (error) {
    // If AI generation fails, use fallback
    console.error('Tagline generation failed:', error);

    if (error instanceof OpenRouterError) {
      console.error(`OpenRouter error: ${error.message} (${error.code})`);
    }

    return getFallbackTagline(params.industry);
  }
}

/**
 * Generate multiple tagline options
 * @param params - Tagline generation parameters
 * @param count - Number of taglines to generate (default: 3)
 * @returns Promise resolving to array of taglines
 *
 * @example
 * ```typescript
 * const taglines = await generateMultipleTaglines({
 *   businessName: 'TechCorp',
 *   industry: 'tech',
 *   description: 'A cutting-edge software company'
 * }, 5);
 * ```
 */
export async function generateMultipleTaglines(
  params: TaglineGenerationParams,
  count: number = 3
): Promise<string[]> {
  const taglines: string[] = [];
  const maxAttempts = count * 2; // Allow some failures

  for (let i = 0; i < maxAttempts && taglines.length < count; i++) {
    try {
      const tagline = await generateTagline(params);

      // Avoid duplicates
      if (!taglines.includes(tagline)) {
        taglines.push(tagline);
      }

      // Add a small delay to avoid rate limiting
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to generate tagline ${i + 1}:`, error);
    }
  }

  // If we couldn't generate enough, add fallbacks
  while (taglines.length < count) {
    const fallback = getFallbackTagline(params.industry);
    if (!taglines.includes(fallback)) {
      taglines.push(fallback);
    } else {
      // If duplicate, get all fallbacks and pick unused ones
      const allFallbacks = fallbackTaglines[params.industry] || fallbackTaglines.other;
      const unusedFallback = allFallbacks.find((fb) => !taglines.includes(fb));
      if (unusedFallback) {
        taglines.push(unusedFallback);
      } else {
        break; // Can't generate more unique taglines
      }
    }
  }

  return taglines;
}

/**
 * Validate a tagline against quality criteria
 * @param tagline - Tagline to validate
 * @returns Object with validation results
 *
 * @example
 * ```typescript
 * const validation = validateTagline('Innovation at your fingertips');
 * if (!validation.valid) {
 *   console.error(validation.errors);
 * }
 * ```
 */
export function validateTagline(tagline: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const wordCount = tagline.split(/\s+/).length;
  const charCount = tagline.length;

  // Errors (make tagline invalid)
  if (charCount < 10) {
    errors.push('Tagline is too short (minimum 10 characters)');
  }

  if (charCount > 60) {
    errors.push('Tagline is too long (maximum 60 characters)');
  }

  if (wordCount < 2) {
    errors.push('Tagline must have at least 2 words');
  }

  // Warnings (suggest improvements)
  if (wordCount > 6) {
    warnings.push('Tagline is lengthy - consider shortening for better impact');
  }

  if (!/^[A-Z]/.test(tagline)) {
    warnings.push('Tagline should start with a capital letter');
  }

  if (/[!?]{2,}/.test(tagline)) {
    warnings.push('Avoid excessive punctuation');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get example taglines for an industry
 * @param industry - Industry category
 * @returns Array of example taglines
 */
export function getExampleTaglines(industry: Industry): string[] {
  const style = industryTaglineStyles[industry] || industryTaglineStyles.other;
  return style.examples;
}

/**
 * Export industry tagline styles for reference
 */
export { industryTaglineStyles, fallbackTaglines };
