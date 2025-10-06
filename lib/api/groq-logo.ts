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

  const systemPrompt = `You are a professional logo designer creating ICONIC, MEMORABLE SVG logos.

DESIGN PRINCIPLES (CRITICAL):
- Create logos that are INSTANTLY RECOGNIZABLE and DISTINCTIVE
- Use STRONG GEOMETRIC SHAPES with CLEAN LINES
- Follow RULE OF THIRDS for balanced composition
- ONE PRIMARY FOCAL POINT - clear visual hierarchy
- Use NEGATIVE SPACE creatively
- SYMMETRY or intentional asymmetry only
- Must be SCALABLE (recognizable at 16px and 512px)

TECHNICAL CONSTRAINTS (STRICT):
- viewBox="0 0 200 200" (consistent sizing)
- ONLY use: <rect>, <circle>, <ellipse>, <polygon>, <path>
- <path>: Maximum 5 commands (M, L, Q, C, Z)
- Group related elements: <g id="...">
- 2-8 shapes total (not too simple, not too complex)
- Round corners (rx/ry) for modern feel
- ⛔ ABSOLUTELY NO <text> OR <tspan> ELEMENTS - SHAPES ONLY!
- ⛔ NO gradients, filters, animations, or external dependencies

CRITICAL: This is a SYMBOL/MARK logo, NOT a wordmark. Do NOT include the company name as text.
The logo should represent the brand through SHAPES and VISUAL SYMBOLS ONLY.

QUALITY STANDARDS:
- Logo must be MEMORABLE - can you draw it from memory?
- Must work in BLACK & WHITE (test monochrome)
- PROFESSIONAL - suitable for Fortune 500
- DISTINCTIVE - doesn't look generic

OUTPUT:
Return ONLY valid SVG code. Start with <svg and end with </svg>.`;

  const userPrompt = `Create an ICONIC, PROFESSIONAL logo based on this spec:

SCENE: ${template.sceneLevel}
OBJECTS: ${template.objectLevel}
LAYOUT: ${template.layoutLevel}

COLORS (use strategically):
Primary: ${colorPalette.primary}
Secondary: ${colorPalette.secondary}
Accent: ${colorPalette.accent}

CRITICAL REQUIREMENTS:
1. Make it INSTANTLY RECOGNIZABLE - could someone sketch this from memory?
2. ONE clear focal point - don't overcomplicate
3. Use NEGATIVE SPACE - what you DON'T draw matters
4. GEOMETRIC and BALANCED - use circles, squares, triangles as base
5. Must look professional in BLACK & WHITE
6. Think: Apple, Nike, Airbnb - SIMPLE but ICONIC
7. ⛔ DO NOT USE <text> or <tspan> - This is a SYMBOL logo using SHAPES ONLY

Return ONLY the SVG code with geometric shapes. NO TEXT ELEMENTS!`;

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

  const systemPrompt = `You are a senior brand designer reviewing logo quality.

EVALUATION CRITERIA:
1. MEMORABILITY - Is it instantly recognizable? Can you draw it from memory?
2. VISUAL BALANCE - Proper use of space, symmetry, rule of thirds?
3. ICONIC QUALITY - Does it have a strong, clear focal point?
4. SIMPLICITY - Is it clean and geometric, or cluttered?
5. PROFESSIONAL - Would this work for a Fortune 500 company?
6. SCALABILITY - Does it work at 16px AND 512px?
7. MONOCHROME TEST - Does it work in pure black & white?

Your job: FIX what's broken and make it ICONIC.

STRICT RULES:
- Use ONLY: rect, circle, ellipse, polygon, path (max 5 commands per path)
- ⛔ NEVER use <text> or <tspan> elements - this is a SYMBOL logo
- Return improved SVG that's MORE memorable, MORE balanced, MORE professional
- If the current SVG has text, REMOVE IT and replace with pure geometric shapes`;

  const userPrompt = `Review this logo and make it MORE ICONIC (iteration ${iteration}/2):

TARGET: ${originalPrompt}

CURRENT SVG:
${svgCode}

IMPROVE IT:
✓ Make it MORE MEMORABLE - simpler, stronger shapes
✓ Add VISUAL IMPACT - one clear focal point
✓ Fix BALANCE - rule of thirds, symmetry
✓ Enhance NEGATIVE SPACE - what you remove matters
✓ Ensure BLACK & WHITE version works perfectly
✓ Think: Apple, Nike, Twitter - SIMPLE but UNFORGETTABLE
✓ ⛔ REMOVE any <text> or <tspan> if present - use SHAPES ONLY

Return ONLY the improved SVG code with geometric shapes. NO TEXT!`;

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

  const systemPrompt = `You are a brutally honest logo design critic. Rate logos like a professional brand agency would.

RATING SCALE (BE STRICT):
10/10 - Iconic (Apple, Nike, Airbnb level) - instantly memorable, perfect execution
9/10 - Excellent - very strong, one minor improvement possible
8/10 - Great - professional, memorable, clean
7/10 - Good - solid, works well, nothing special
6/10 - Acceptable - functional but forgettable
5/10 - Mediocre - generic, lacks personality
4/10 - Below Average - cluttered or unclear
3/10 - Poor - major issues
2/10 - Very Poor - barely functional
1/10 - Terrible - complete failure

CRITICAL QUESTIONS:
✓ Can someone sketch this from memory after one glance?
✓ Does it have ONE clear, strong focal point?
✓ Would it work in black & white?
✓ Is it scalable (16px to 512px)?
✓ Is it DISTINCTIVE or generic?

BE HARSH - most logos should score 6-8. Only give 9-10 to truly exceptional work.

Output format:
SCORE: [number]/10
FEEDBACK: [2-3 sentences explaining the score]`;

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
 * Quality threshold configuration
 */
const QUALITY_THRESHOLD = 8.0; // Minimum acceptable quality score (strict - must be "great" or better)
const MAX_REGENERATION_ATTEMPTS = 5; // Maximum attempts to generate a quality logo

/**
 * Validates SVG code for basic sanity checks
 */
function validateSVGCode(svgCode: string): { valid: boolean; error?: string } {
  // CRITICAL: Check if SVG contains text elements (FORBIDDEN for logos)
  if (svgCode.includes('<text') || svgCode.includes('<tspan')) {
    return { valid: false, error: 'SVG contains text elements (forbidden - use shapes only)' };
  }

  // Check if SVG has viewBox
  if (!svgCode.includes('viewBox')) {
    return { valid: false, error: 'Missing viewBox attribute' };
  }

  // Check if SVG has at least some shapes
  const hasShapes =
    svgCode.includes('<rect') ||
    svgCode.includes('<circle') ||
    svgCode.includes('<ellipse') ||
    svgCode.includes('<path') ||
    svgCode.includes('<polygon') ||
    svgCode.includes('<polyline');

  if (!hasShapes) {
    return { valid: false, error: 'No visual shapes found in SVG' };
  }

  // Check if SVG is not too simple (e.g., just one shape)
  const shapeCount = (svgCode.match(/<(rect|circle|ellipse|path|polygon|polyline)/g) || []).length;
  if (shapeCount < 2) {
    return { valid: false, error: 'SVG too simple (needs at least 2 shapes)' };
  }

  // Check if SVG is too complex (likely garbage)
  if (shapeCount > 50) {
    return { valid: false, error: 'SVG too complex (too many shapes)' };
  }

  return { valid: true };
}

/**
 * Complete multi-stage SVG logo generation workflow with quality control
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

  let attempt = 0;
  let bestResult: {
    svgCode: string;
    template: any;
    quality: { score: number; feedback: string };
  } | null = null;

  while (attempt < MAX_REGENERATION_ATTEMPTS) {
    attempt++;
    console.log(`\n🎯 Logo generation attempt ${attempt}/${MAX_REGENERATION_ATTEMPTS}...`);

    try {
      console.log('🎨 Stage 1: Generating logo template with Llama 3.3 70B...');
      const template = await generateLogoTemplate({
        businessName,
        description,
        industry,
        symbols,
      });

      console.log('💻 Stage 2: Generating SVG code with Llama 3.1 8B...');
      let svgCode = await generateSVGCode(template, colorPalette);

      // Validate basic SVG structure
      const validation = validateSVGCode(svgCode);
      if (!validation.valid) {
        console.warn(`❌ SVG validation failed: ${validation.error}`);
        continue; // Try again
      }

      console.log('🔍 Stage 3: Refining SVG (2 iterations)...');
      const originalPrompt = `${businessName} - ${description} - ${symbols.primary} with ${symbols.secondary}`;

      // Refinement iteration 1
      svgCode = await refineSVGCode(svgCode, originalPrompt, 1);

      // Refinement iteration 2
      svgCode = await refineSVGCode(svgCode, originalPrompt, 2);

      // Re-validate after refinement
      const refinedValidation = validateSVGCode(svgCode);
      if (!refinedValidation.valid) {
        console.warn(`❌ Refined SVG validation failed: ${refinedValidation.error}`);
        continue; // Try again
      }

      console.log('✅ Stage 4: Quality review...');
      const quality = await reviewSVGQuality(svgCode, businessName);

      console.log(`📊 Quality score: ${quality.score}/10`);

      // Store this result if it's the best so far
      if (!bestResult || quality.score > bestResult.quality.score) {
        bestResult = { svgCode, template, quality };
      }

      // If quality is above threshold, we're done!
      if (quality.score >= QUALITY_THRESHOLD) {
        console.log(`✨ Quality threshold met (${quality.score} >= ${QUALITY_THRESHOLD})! Using this logo.`);
        return { svgCode, template, quality };
      }

      console.warn(
        `⚠️  Quality below threshold (${quality.score} < ${QUALITY_THRESHOLD}). ${attempt < MAX_REGENERATION_ATTEMPTS ? 'Regenerating...' : 'Using best result.'}`
      );
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      // Continue to next attempt
    }
  }

  // If we exhausted all attempts, return the best result we got
  if (bestResult) {
    console.log(
      `⚠️  Using best result from ${MAX_REGENERATION_ATTEMPTS} attempts (score: ${bestResult.quality.score}/10)`
    );
    return bestResult;
  }

  // If all attempts failed, throw error
  throw new GroqLogoError(
    'Failed to generate acceptable logo after maximum attempts',
    500,
    'MAX_ATTEMPTS_EXCEEDED'
  );
}
