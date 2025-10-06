/**
 * Groq API Client for SVG Logo Generation
 * Ultra-fast, cost-effective multi-stage workflow using Llama models
 */

import Groq from 'groq-sdk';

/**
 * Groq model identifiers optimized for logo generation
 */
export const GROQ_LOGO_MODELS = {
  // Stage 1: Template Generation - Best reasoning for complex prompts
  TEMPLATE: 'llama-3.3-70b-versatile',

  // Stage 2 & 3: SVG Generation and Review - Ultra-fast, cost-effective
  CODE: 'llama-3.1-8b-instant',
  REVIEW: 'llama-3.1-8b-instant',
} as const;

/**
 * Error class for Groq API errors
 */
export class GroqLogoError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'GroqLogoError';
  }
}

/**
 * Get Groq API client
 */
function getGroqClient(): Groq {
  const apiKey = process.env['GROQ_API_KEY'];

  if (!apiKey) {
    throw new GroqLogoError('GROQ_API_KEY not configured', 500, 'MISSING_API_KEY');
  }

  return new Groq({ apiKey });
}

/**
 * Check if Groq is configured
 */
export function isGroqConfigured(): boolean {
  return !!process.env['GROQ_API_KEY'];
}

/**
 * Stage 1: Template Generation
 * Expand brief prompt into detailed visual components using three-layer approach
 */
export async function generateLogoTemplate(params: {
  businessName: string;
  description: string;
  industry: string;
  symbols: {
    primary: string;
    secondary: string;
    mood: string;
  };
}): Promise<{
  sceneLevel: string;
  objectLevel: string;
  layoutLevel: string;
}> {
  const { businessName, description, industry, symbols } = params;
  const groq = getGroqClient();

  const systemPrompt = `You are an expert brand designer specializing in minimalist logo design. Your task is to expand a brief logo concept into a detailed three-layer specification for SVG generation.

Follow the Chat2SVG framework:
1. Scene-level: Identify essential visual objects/elements
2. Object-level: Decompose each object into semantic components
3. Layout-level: Define positions, sizes, colors, and spatial relationships

Focus on geometric simplicity and professional branding aesthetics.`;

  const userPrompt = `Create a detailed logo specification for "${businessName}" - ${description}

Industry: ${industry}
Primary Symbol: ${symbols.primary}
Secondary Element: ${symbols.secondary}
Mood: ${symbols.mood}

Expand this into three layers:

SCENE-LEVEL:
List 3-5 essential visual objects that should appear in the logo.

OBJECT-LEVEL:
For each object, describe its semantic components (e.g., "mountain: peak triangle, base trapezoid").

LAYOUT-LEVEL:
Specify exact positioning, relative sizes, color palette (hex codes), and spatial relationships.

Output format:
SCENE: [list objects]
OBJECTS: [component breakdown]
LAYOUT: [detailed specifications]`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: GROQ_LOGO_MODELS.TEMPLATE,
      temperature: 0.8,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Parse response into three layers
    const sceneMatch = response.match(/SCENE:([\s\S]+?)(?=OBJECTS:|$)/);
    const objectMatch = response.match(/OBJECTS:([\s\S]+?)(?=LAYOUT:|$)/);
    const layoutMatch = response.match(/LAYOUT:([\s\S]+?)$/);

    return {
      sceneLevel: sceneMatch?.[1]?.trim() || response,
      objectLevel: objectMatch?.[1]?.trim() || '',
      layoutLevel: layoutMatch?.[1]?.trim() || '',
    };
  } catch (error) {
    throw new GroqLogoError(
      `Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'TEMPLATE_GENERATION_FAILED'
    );
  }
}

/**
 * Stage 2: SVG Code Generation
 * Convert expanded template to constrained SVG code
 */
export async function generateSVGCode(
  template: {
    sceneLevel: string;
    objectLevel: string;
    layoutLevel: string;
  },
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  }
): Promise<string> {
  const groq = getGroqClient();

  const systemPrompt = `You are an expert SVG code generator. Generate clean, semantic SVG code following strict constraints:

ALLOWED PRIMITIVES ONLY:
- rect, circle, ellipse, line, polyline, polygon
- path (maximum 5 commands per path)

REQUIREMENTS:
- 512x512 viewBox="0 0 512 512"
- Semantic IDs for all elements (e.g., id="icon-mountain-peak")
- Comments explaining each major component
- Clean, well-formatted code
- No text elements, no gradients, no filters
- Flat design aesthetic

OUTPUT:
Return ONLY the SVG code, nothing else. Start with <svg and end with </svg>.`;

  const userPrompt = `Generate SVG logo code based on this specification:

SCENE: ${template.sceneLevel}
OBJECTS: ${template.objectLevel}
LAYOUT: ${template.layoutLevel}

COLOR PALETTE:
Primary: ${colorPalette.primary}
Secondary: ${colorPalette.secondary}
Accent: ${colorPalette.accent}

Create a professional, minimalist logo using ONLY basic SVG primitives.
Focus on geometric simplicity and visual balance.
Return ONLY the SVG code.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: GROQ_LOGO_MODELS.CODE,
      temperature: 0.3,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Extract SVG code from response
    const svgMatch = response.match(/<svg[\s\S]*<\/svg>/i);
    if (!svgMatch) {
      throw new GroqLogoError(
        'No valid SVG code generated',
        500,
        'INVALID_SVG_RESPONSE'
      );
    }

    return svgMatch[0];
  } catch (error) {
    if (error instanceof GroqLogoError) {
      throw error;
    }

    throw new GroqLogoError(
      `SVG generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'SVG_GENERATION_FAILED'
    );
  }
}

/**
 * Stage 3: SVG Refinement
 * Analyze and improve SVG code for visual quality
 */
export async function refineSVGCode(
  svgCode: string,
  originalPrompt: string,
  iteration: number = 1
): Promise<string> {
  const groq = getGroqClient();

  const systemPrompt = `You are an expert SVG code reviewer and optimizer. Analyze SVG code for:
1. Visual balance and composition
2. Proper use of viewBox and coordinates
3. Color harmony and contrast
4. Geometric precision
5. Code cleanliness and semantics

Provide improved SVG code with fixes. Use ONLY basic primitives: rect, circle, ellipse, line, polyline, polygon, path (max 5 commands).`;

  const userPrompt = `Review and improve this SVG logo code (iteration ${iteration}/2):

ORIGINAL INTENT: ${originalPrompt}

CURRENT SVG:
${svgCode}

Identify issues and return IMPROVED SVG code:
- Fix visual imbalances
- Improve proportions
- Enhance geometric precision
- Maintain minimalist aesthetic
- Keep semantic structure

Return ONLY the improved SVG code.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: GROQ_LOGO_MODELS.CODE,
      temperature: 0.4,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Extract SVG code from response
    const svgMatch = response.match(/<svg[\s\S]*<\/svg>/i);
    if (!svgMatch || !svgMatch[0]) {
      // If refinement fails, return original
      console.warn(`SVG refinement iteration ${iteration} failed, using previous version`);
      return svgCode;
    }

    return svgMatch[0];
  } catch (error) {
    console.warn(`SVG refinement iteration ${iteration} error, using previous version:`, error);
    return svgCode;
  }
}

/**
 * Stage 4: Quality Review
 * Get quality assessment and feedback
 */
export async function reviewSVGQuality(
  svgCode: string,
  businessName: string
): Promise<{ score: number; feedback: string }> {
  const groq = getGroqClient();

  const systemPrompt = `You are a professional brand design critic. Rate this SVG logo on a scale of 1-10 and provide brief feedback.

CRITERIA:
- Visual balance and composition (1-10)
- Brand appropriateness (1-10)
- Geometric precision (1-10)
- Minimalist aesthetic (1-10)
- Professional quality (1-10)

Output format:
SCORE: [average score]/10
FEEDBACK: [2-3 sentences]`;

  const userPrompt = `Review this SVG logo for "${businessName}":

${svgCode}

Provide your score and feedback.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: GROQ_LOGO_MODELS.REVIEW,
      temperature: 0.5,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Parse score
    const scoreMatch = response.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
    const scoreStr = scoreMatch?.[1];
    const score = scoreStr ? parseFloat(scoreStr) : 7.0;

    const feedbackMatch = response.match(/FEEDBACK:([\s\S]+)$/i);
    const feedback = feedbackMatch?.[1]?.trim() || response;

    return { score, feedback };
  } catch (error) {
    console.warn('Quality review failed:', error);
    return { score: 7.0, feedback: 'Quality review unavailable' };
  }
}

/**
 * Complete multi-stage SVG logo generation workflow
 */
export async function generateLogoWithGroq(params: {
  businessName: string;
  description: string;
  industry: string;
  symbols: {
    primary: string;
    secondary: string;
    mood: string;
  };
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
}): Promise<{
  svgCode: string;
  template: {
    sceneLevel: string;
    objectLevel: string;
    layoutLevel: string;
  };
  quality: {
    score: number;
    feedback: string;
  };
}> {
  const { businessName, description, industry, symbols, colorPalette } = params;

  console.log('🎨 Stage 1: Generating logo template with Llama 3.3 70B...');
  const template = await generateLogoTemplate({
    businessName,
    description,
    industry,
    symbols,
  });

  console.log('💻 Stage 2: Generating SVG code with Llama 3.1 8B...');
  let svgCode = await generateSVGCode(template, colorPalette);

  console.log('🔍 Stage 3: Refining SVG (2 iterations)...');
  const originalPrompt = `${businessName} - ${description} - ${symbols.primary} with ${symbols.secondary}`;

  // Refinement iteration 1
  svgCode = await refineSVGCode(svgCode, originalPrompt, 1);

  // Refinement iteration 2
  svgCode = await refineSVGCode(svgCode, originalPrompt, 2);

  console.log('✅ Stage 4: Quality review...');
  const quality = await reviewSVGQuality(svgCode, businessName);

  console.log(`📊 Quality score: ${quality.score}/10`);

  return {
    svgCode,
    template,
    quality,
  };
}
