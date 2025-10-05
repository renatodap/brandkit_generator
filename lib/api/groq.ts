import Groq from 'groq-sdk';

/**
 * Groq API client for fast, cost-effective LLM calls
 * Uses llama-3.1-8b-instant for ultra-fast inference at $0.05/1M tokens
 */

let groqClient: Groq | null = null;

/**
 * Get or create Groq client instance
 * Lazy initialization to avoid build-time errors
 */
function getGroqClient(): Groq | null {
  // Return null if API key not configured (graceful degradation)
  if (!process.env['GROQ_API_KEY']) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env['GROQ_API_KEY'],
    });
  }

  return groqClient;
}

/**
 * Default model for fast, cost-effective inference
 */
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

/**
 * Extract symbolic elements from business name and description
 * Returns 2-3 visual symbols that represent the brand
 *
 * @example
 * Input: "TechFlow", "A modern software development platform"
 * Output: { primary: "circuit board pattern", secondary: "flowing data stream", mood: "innovative" }
 */
export async function extractLogoSymbols(params: {
  businessName: string;
  description: string;
  industry: string;
}): Promise<{
  primary: string;
  secondary: string;
  mood: string;
}> {
  const client = getGroqClient();

  // Fallback to deterministic extraction if Groq not configured
  if (!client) {
    return extractLogoSymbolsDeterministic(params);
  }

  try {
    const prompt = `Analyze this business and extract visual symbols for a professional logo design.

Business Name: ${params.businessName}
Description: ${params.description}
Industry: ${params.industry}

Extract:
1. Primary Symbol: A single iconic visual element that represents the core business (e.g., "gear", "leaf", "mountain", "circuit")
2. Secondary Symbol: A complementary visual element (e.g., "flowing lines", "geometric pattern", "abstract shape")
3. Mood: One word describing the brand feeling (e.g., "innovative", "trustworthy", "energetic", "elegant")

Respond in this exact JSON format:
{
  "primary": "single iconic symbol",
  "secondary": "complementary element",
  "mood": "one word mood"
}`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional brand strategist. Extract visual symbols for logo design. Always respond with valid JSON only, no explanations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    const result = JSON.parse(content);
    return {
      primary: result.primary || 'abstract symbol',
      secondary: result.secondary || 'geometric pattern',
      mood: result.mood || 'professional',
    };
  } catch (error) {
    console.error('Groq symbol extraction failed, using fallback:', error);
    return extractLogoSymbolsDeterministic(params);
  }
}

/**
 * Extract brand personality traits from business description
 * Returns personality scores for font pairing
 *
 * @example
 * Input: "A luxury fashion brand for modern professionals"
 * Output: { elegant: 0.9, professional: 0.8, modern: 0.9, friendly: 0.3 }
 */
export async function extractBrandPersonality(params: {
  businessName: string;
  description: string;
  industry: string;
}): Promise<{
  modern: number;
  classic: number;
  playful: number;
  elegant: number;
  bold: number;
  friendly: number;
  professional: number;
  luxurious: number;
}> {
  const client = getGroqClient();

  // Fallback to deterministic extraction if Groq not configured
  if (!client) {
    return extractBrandPersonalityDeterministic(params);
  }

  try {
    const prompt = `Analyze this business and rate its brand personality traits on a scale of 0.0 to 1.0.

Business Name: ${params.businessName}
Description: ${params.description}
Industry: ${params.industry}

Rate these personality traits (0.0 = not at all, 1.0 = extremely):
- modern: How contemporary/cutting-edge is the brand?
- classic: How traditional/timeless is the brand?
- playful: How fun/whimsical is the brand?
- elegant: How sophisticated/refined is the brand?
- bold: How strong/assertive is the brand?
- friendly: How approachable/warm is the brand?
- professional: How serious/corporate is the brand?
- luxurious: How premium/high-end is the brand?

Respond in this exact JSON format with scores 0.0-1.0:
{
  "modern": 0.0,
  "classic": 0.0,
  "playful": 0.0,
  "elegant": 0.0,
  "bold": 0.0,
  "friendly": 0.0,
  "professional": 0.0,
  "luxurious": 0.0
}`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional brand strategist. Rate brand personality traits objectively. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    const result = JSON.parse(content);

    // Validate and clamp scores to 0-1 range
    return {
      modern: clamp(result.modern, 0, 1),
      classic: clamp(result.classic, 0, 1),
      playful: clamp(result.playful, 0, 1),
      elegant: clamp(result.elegant, 0, 1),
      bold: clamp(result.bold, 0, 1),
      friendly: clamp(result.friendly, 0, 1),
      professional: clamp(result.professional, 0, 1),
      luxurious: clamp(result.luxurious, 0, 1),
    };
  } catch (error) {
    console.error('Groq personality extraction failed, using fallback:', error);
    return extractBrandPersonalityDeterministic(params);
  }
}

/**
 * Extract color mood and preferences from business description
 * Returns mood and trend preferences for color palette generation
 *
 * @example
 * Input: "An eco-friendly startup focused on sustainability"
 * Output: { mood: "calm", trend: "earthy", keywords: ["nature", "growth", "trust"] }
 */
export async function extractColorPreferences(params: {
  businessName: string;
  description: string;
  industry: string;
}): Promise<{
  mood: 'energetic' | 'calm' | 'professional' | 'playful' | 'luxurious';
  trend: 'earthy' | 'futuristic' | 'classic' | 'vibrant';
  keywords: string[];
}> {
  const client = getGroqClient();

  // Fallback to deterministic extraction if Groq not configured
  if (!client) {
    return extractColorPreferencesDeterministic(params);
  }

  try {
    const prompt = `Analyze this business and determine color preferences for brand identity.

Business Name: ${params.businessName}
Description: ${params.description}
Industry: ${params.industry}

Determine:
1. Mood: The emotional feeling (energetic, calm, professional, playful, or luxurious)
2. Trend: The visual aesthetic (earthy, futuristic, classic, or vibrant)
3. Keywords: 3-5 words describing color associations (e.g., "nature", "trust", "innovation")

Respond in this exact JSON format:
{
  "mood": "one of: energetic, calm, professional, playful, luxurious",
  "trend": "one of: earthy, futuristic, classic, vibrant",
  "keywords": ["word1", "word2", "word3"]
}`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional brand color strategist. Analyze brand descriptions and recommend color moods. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    const result = JSON.parse(content);

    // Validate mood and trend values
    const validMoods = ['energetic', 'calm', 'professional', 'playful', 'luxurious'];
    const validTrends = ['earthy', 'futuristic', 'classic', 'vibrant'];

    return {
      mood: validMoods.includes(result.mood) ? result.mood : 'professional',
      trend: validTrends.includes(result.trend) ? result.trend : 'classic',
      keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 5) : [],
    };
  } catch (error) {
    console.error('Groq color preference extraction failed, using fallback:', error);
    return extractColorPreferencesDeterministic(params);
  }
}

// ============================================================================
// Deterministic Fallback Functions
// ============================================================================

/**
 * Deterministic symbol extraction based on keywords
 */
function extractLogoSymbolsDeterministic(params: {
  businessName: string;
  description: string;
  industry: string;
}): { primary: string; secondary: string; mood: string } {
  const { businessName, description, industry } = params;
  const combined = `${businessName} ${description}`.toLowerCase();

  // Industry-specific symbols
  const industrySymbols: Record<
    string,
    { primary: string; secondary: string; mood: string }
  > = {
    tech: { primary: 'circuit pattern', secondary: 'geometric grid', mood: 'innovative' },
    food: { primary: 'chef hat', secondary: 'organic shapes', mood: 'appetizing' },
    fashion: { primary: 'elegant silhouette', secondary: 'flowing lines', mood: 'stylish' },
    health: { primary: 'medical cross', secondary: 'heartbeat line', mood: 'trustworthy' },
    creative: { primary: 'paint brush', secondary: 'colorful splash', mood: 'artistic' },
    finance: { primary: 'shield', secondary: 'ascending graph', mood: 'stable' },
    education: { primary: 'book', secondary: 'graduation cap', mood: 'inspiring' },
    other: { primary: 'abstract symbol', secondary: 'geometric pattern', mood: 'professional' },
  };

  // Keyword-based overrides
  if (combined.includes('eco') || combined.includes('green') || combined.includes('sustain')) {
    return { primary: 'leaf', secondary: 'natural texture', mood: 'organic' };
  }
  if (combined.includes('speed') || combined.includes('fast') || combined.includes('quick')) {
    return { primary: 'lightning bolt', secondary: 'motion lines', mood: 'dynamic' };
  }
  if (combined.includes('luxury') || combined.includes('premium') || combined.includes('elite')) {
    return { primary: 'crown', secondary: 'elegant curves', mood: 'luxurious' };
  }

  return industrySymbols[industry] ?? industrySymbols['other']!;
}

/**
 * Deterministic personality extraction based on keywords
 */
function extractBrandPersonalityDeterministic(params: {
  businessName: string;
  description: string;
  industry: string;
}): {
  modern: number;
  classic: number;
  playful: number;
  elegant: number;
  bold: number;
  friendly: number;
  professional: number;
  luxurious: number;
} {
  const { description, industry } = params;
  const text = description.toLowerCase();

  // Base scores from industry
  const industryScores: Record<string, Partial<ReturnType<typeof extractBrandPersonalityDeterministic>>> = {
    tech: { modern: 0.9, professional: 0.8, bold: 0.6, classic: 0.2 },
    food: { friendly: 0.8, playful: 0.6, modern: 0.5, elegant: 0.4 },
    fashion: { elegant: 0.9, modern: 0.7, luxurious: 0.6, bold: 0.5 },
    health: { professional: 0.9, friendly: 0.7, classic: 0.6, modern: 0.5 },
    creative: { playful: 0.8, bold: 0.8, modern: 0.7, friendly: 0.6 },
    finance: { professional: 0.9, classic: 0.7, elegant: 0.6, modern: 0.4 },
    education: { friendly: 0.8, professional: 0.7, modern: 0.5, playful: 0.4 },
  };

  const base = industryScores[industry] || {
    modern: 0.5,
    professional: 0.6,
    friendly: 0.5,
    classic: 0.4,
  };

  // Keyword modifiers
  const scores = { ...base };
  if (text.includes('modern') || text.includes('cutting-edge') || text.includes('innovative'))
    scores.modern = 0.9;
  if (text.includes('classic') || text.includes('traditional') || text.includes('timeless'))
    scores.classic = 0.9;
  if (text.includes('fun') || text.includes('playful') || text.includes('creative'))
    scores.playful = 0.8;
  if (text.includes('elegant') || text.includes('sophisticated') || text.includes('refined'))
    scores.elegant = 0.9;
  if (text.includes('bold') || text.includes('strong') || text.includes('powerful'))
    scores.bold = 0.9;
  if (text.includes('friendly') || text.includes('warm') || text.includes('approachable'))
    scores.friendly = 0.9;
  if (text.includes('professional') || text.includes('corporate') || text.includes('business'))
    scores.professional = 0.9;
  if (text.includes('luxury') || text.includes('premium') || text.includes('exclusive'))
    scores.luxurious = 0.9;

  return {
    modern: scores.modern || 0.5,
    classic: scores.classic || 0.4,
    playful: scores.playful || 0.3,
    elegant: scores.elegant || 0.4,
    bold: scores.bold || 0.4,
    friendly: scores.friendly || 0.5,
    professional: scores.professional || 0.6,
    luxurious: scores.luxurious || 0.3,
  };
}

/**
 * Deterministic color preference extraction based on keywords
 */
function extractColorPreferencesDeterministic(params: {
  businessName: string;
  description: string;
  industry: string;
}): {
  mood: 'energetic' | 'calm' | 'professional' | 'playful' | 'luxurious';
  trend: 'earthy' | 'futuristic' | 'classic' | 'vibrant';
  keywords: string[];
} {
  const { description, industry } = params;
  const text = description.toLowerCase();

  // Industry defaults
  const industryDefaults: Record<
    string,
    {
      mood: 'energetic' | 'calm' | 'professional' | 'playful' | 'luxurious';
      trend: 'earthy' | 'futuristic' | 'classic' | 'vibrant';
      keywords: string[];
    }
  > = {
    tech: { mood: 'professional', trend: 'futuristic', keywords: ['innovation', 'trust', 'tech'] },
    food: { mood: 'energetic', trend: 'earthy', keywords: ['appetite', 'fresh', 'organic'] },
    fashion: { mood: 'luxurious', trend: 'classic', keywords: ['style', 'elegance', 'trend'] },
    health: { mood: 'calm', trend: 'classic', keywords: ['trust', 'health', 'care'] },
    creative: { mood: 'playful', trend: 'vibrant', keywords: ['creativity', 'art', 'expression'] },
    finance: {
      mood: 'professional',
      trend: 'classic',
      keywords: ['trust', 'stability', 'growth'],
    },
    education: { mood: 'energetic', trend: 'vibrant', keywords: ['learning', 'growth', 'future'] },
    other: { mood: 'professional', trend: 'classic', keywords: ['professional', 'quality', 'service'] },
  };

  const defaults = industryDefaults[industry] || industryDefaults['other']!;

  // Keyword-based mood detection
  let mood = defaults.mood;
  if (
    text.includes('energy') ||
    text.includes('dynamic') ||
    text.includes('vibrant') ||
    text.includes('active')
  ) {
    mood = 'energetic';
  } else if (
    text.includes('calm') ||
    text.includes('peaceful') ||
    text.includes('serene') ||
    text.includes('wellness')
  ) {
    mood = 'calm';
  } else if (
    text.includes('fun') ||
    text.includes('playful') ||
    text.includes('creative') ||
    text.includes('joy')
  ) {
    mood = 'playful';
  } else if (
    text.includes('luxury') ||
    text.includes('premium') ||
    text.includes('exclusive') ||
    text.includes('elite')
  ) {
    mood = 'luxurious';
  }

  // Keyword-based trend detection
  let trend = defaults.trend;
  if (
    text.includes('eco') ||
    text.includes('natural') ||
    text.includes('organic') ||
    text.includes('sustain')
  ) {
    trend = 'earthy';
  } else if (
    text.includes('tech') ||
    text.includes('ai') ||
    text.includes('future') ||
    text.includes('innovation')
  ) {
    trend = 'futuristic';
  } else if (
    text.includes('vibrant') ||
    text.includes('bold') ||
    text.includes('colorful') ||
    text.includes('bright')
  ) {
    trend = 'vibrant';
  }

  return { mood, trend, keywords: defaults.keywords };
}

/**
 * Utility: Clamp number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate justification for color palette choices
 * Explains why these specific colors were chosen
 */
export async function generateColorJustification(params: {
  businessName: string;
  description: string;
  industry: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  mood: string;
  trend: string;
}): Promise<string> {
  const client = getGroqClient();

  // Fallback if Groq not configured
  if (!client) {
    return `The ${params.mood} color palette reflects your ${params.industry} industry with ${params.trend} aesthetics. The primary color (${params.colors.primary}) conveys trust and professionalism, while the secondary (${params.colors.secondary}) adds visual interest. The accent color (${params.colors.accent}) provides emphasis for calls-to-action.`;
  }

  try {
    const prompt = `Explain why this color palette was chosen for a brand.

Business: ${params.businessName}
Description: ${params.description}
Industry: ${params.industry}

Colors Selected:
- Primary: ${params.colors.primary}
- Secondary: ${params.colors.secondary}
- Accent: ${params.colors.accent}

Mood: ${params.mood}
Trend: ${params.trend}

Write a concise 2-3 sentence explanation of why these specific colors work well for this brand. Focus on color psychology, the mood they convey, and how they align with the industry and brand personality. Be specific about what each color represents.`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional brand strategist specializing in color psychology. Provide concise, insightful explanations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    return content.trim();
  } catch (error) {
    console.error('Groq color justification failed:', error);
    return `The ${params.mood} color palette reflects your ${params.industry} industry with ${params.trend} aesthetics. The primary color (${params.colors.primary}) conveys trust and professionalism, while the secondary (${params.colors.secondary}) adds visual interest. The accent color (${params.colors.accent}) provides emphasis for calls-to-action.`;
  }
}

/**
 * Generate justification for font pairing choices
 * Explains why these specific fonts were selected
 */
export async function generateFontJustification(params: {
  businessName: string;
  description: string;
  industry: string;
  fonts: {
    primary: { name: string; category: string };
    secondary: { name: string; category: string };
  };
  personality: {
    modern: number;
    classic: number;
    playful: number;
    elegant: number;
    bold: number;
    friendly: number;
    professional: number;
    luxurious: number;
  };
}): Promise<string> {
  const client = getGroqClient();

  // Fallback if Groq not configured
  if (!client) {
    return `${params.fonts.primary.name} (${params.fonts.primary.category}) pairs perfectly with ${params.fonts.secondary.name} (${params.fonts.secondary.category}) to create a ${params.industry} brand identity that is both professional and approachable. The combination ensures readability while conveying your brand's personality.`;
  }

  try {
    // Get top personality traits
    const traits = Object.entries(params.personality)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => trait);

    const prompt = `Explain why this font pairing was chosen for a brand.

Business: ${params.businessName}
Description: ${params.description}
Industry: ${params.industry}

Fonts Selected:
- Primary (headlines): ${params.fonts.primary.name} (${params.fonts.primary.category})
- Secondary (body text): ${params.fonts.secondary.name} (${params.fonts.secondary.category})

Brand Personality: ${traits.join(', ')}

Write a concise 2-3 sentence explanation of why these specific fonts work well together for this brand. Focus on how each font's characteristics match the brand personality, and why the pairing creates good visual hierarchy and readability.`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional typography expert. Provide concise, insightful explanations about font pairings.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    return content.trim();
  } catch (error) {
    console.error('Groq font justification failed:', error);
    return `${params.fonts.primary.name} (${params.fonts.primary.category}) pairs perfectly with ${params.fonts.secondary.name} (${params.fonts.secondary.category}) to create a ${params.industry} brand identity that is both professional and approachable. The combination ensures readability while conveying your brand's personality.`;
  }
}

/**
 * Check if Groq API is configured
 */
export function isGroqConfigured(): boolean {
  return !!process.env['GROQ_API_KEY'];
}
