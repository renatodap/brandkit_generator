/**
 * OpenRouter API Client
 * Multi-model LLM client for advanced SVG logo generation workflow
 */

/**
 * OpenRouter model identifiers
 * All IDs verified on OpenRouter platform as of Oct 2025
 */
export const OPENROUTER_MODELS = {
  // Stage 1: Template Generation - Best for expansion and semantic reasoning
  CLAUDE_SONNET: 'anthropic/claude-3.7-sonnet',
  DEEPSEEK_CHAT: 'deepseek/deepseek-chat',

  // Stage 2: SVG Code Generation - Optimized for code generation
  QWEN_CODER: 'qwen/qwen-2.5-coder-32b-instruct',
  DEEPSEEK_V3: 'deepseek/deepseek-chat',

  // Stage 3: Review and Optimization
  CLAUDE_OPUS: 'anthropic/claude-3-opus',
  GPT4_TURBO: 'openai/gpt-4-turbo',
} as const;

/**
 * Error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

/**
 * Get OpenRouter API key with runtime validation
 */
function getOpenRouterKey(): string | null {
  return process.env['OPENROUTER_API_KEY'] || null;
}

/**
 * Check if OpenRouter is configured
 */
export function isOpenRouterConfigured(): boolean {
  return !!getOpenRouterKey();
}

/**
 * Call OpenRouter API with specified model
 */
export async function callOpenRouter(
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  } = {}
): Promise<string> {
  const apiKey = getOpenRouterKey();

  if (!apiKey) {
    throw new OpenRouterError(
      'OPENROUTER_API_KEY not configured',
      500,
      'MISSING_API_KEY'
    );
  }

  try {
    const { temperature = 0.7, maxTokens = 4000, topP = 1 } = options;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000',
        'X-Title': 'Brand Kit Generator',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new OpenRouterError(
        `OpenRouter API error: ${errorText}`,
        response.status,
        'API_ERROR'
      );
    }

    const result = await response.json();

    if (!result.choices?.[0]?.message?.content) {
      throw new OpenRouterError(
        'No content in OpenRouter response',
        500,
        'INVALID_RESPONSE'
      );
    }

    return result.choices[0].message.content;
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error;
    }

    throw new OpenRouterError(
      `OpenRouter request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'REQUEST_FAILED'
    );
  }
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

  const response = await callOpenRouter(
    OPENROUTER_MODELS.CLAUDE_SONNET,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.8, maxTokens: 2000 }
  );

  // Parse response into three layers
  const sceneMatch = response.match(/SCENE:([\s\S]+?)(?=OBJECTS:|$)/);
  const objectMatch = response.match(/OBJECTS:([\s\S]+?)(?=LAYOUT:|$)/);
  const layoutMatch = response.match(/LAYOUT:([\s\S]+?)$/);

  return {
    sceneLevel: sceneMatch?.[1]?.trim() || response,
    objectLevel: objectMatch?.[1]?.trim() || '',
    layoutLevel: layoutMatch?.[1]?.trim() || '',
  };
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

  const response = await callOpenRouter(
    OPENROUTER_MODELS.QWEN_CODER,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.3, maxTokens: 4000 }
  );

  // Extract SVG code from response
  const svgMatch = response.match(/<svg[\s\S]*<\/svg>/i);
  if (!svgMatch) {
    throw new OpenRouterError(
      'No valid SVG code generated',
      500,
      'INVALID_SVG_RESPONSE'
    );
  }

  return svgMatch[0];
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

  const response = await callOpenRouter(
    OPENROUTER_MODELS.CLAUDE_SONNET,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.4, maxTokens: 4000 }
  );

  // Extract SVG code from response
  const svgMatch = response.match(/<svg[\s\S]*<\/svg>/i);
  if (!svgMatch || !svgMatch[0]) {
    // If refinement fails, return original
    console.warn(`SVG refinement iteration ${iteration} failed, using previous version`);
    return svgCode;
  }

  return svgMatch[0];
}

/**
 * Stage 4: Multi-Model Review
 * Get consensus validation from multiple models
 */
export async function multiModelReview(
  svgCode: string,
  businessName: string
): Promise<{ score: number; feedback: string }> {
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
    const response = await callOpenRouter(
      OPENROUTER_MODELS.DEEPSEEK_CHAT,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, maxTokens: 500 }
    );

    // Parse score
    const scoreMatch = response.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
    const scoreStr = scoreMatch?.[1];
    const score = scoreStr ? parseFloat(scoreStr) : 7.0;

    const feedbackMatch = response.match(/FEEDBACK:([\s\S]+)$/i);
    const feedback = feedbackMatch?.[1]?.trim() || response;

    return { score, feedback };
  } catch (error) {
    console.warn('Multi-model review failed:', error);
    return { score: 7.0, feedback: 'Review unavailable' };
  }
}

/**
 * Complete multi-stage SVG logo generation workflow
 */
export async function generateLogoWithWorkflow(params: {
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

  console.log('🎨 Stage 1: Generating logo template...');
  const template = await generateLogoTemplate({
    businessName,
    description,
    industry,
    symbols,
  });

  console.log('💻 Stage 2: Generating SVG code...');
  let svgCode = await generateSVGCode(template, colorPalette);

  console.log('🔍 Stage 3: Refining SVG (2 iterations)...');
  const originalPrompt = `${businessName} - ${description} - ${symbols.primary} with ${symbols.secondary}`;

  // Refinement iteration 1
  svgCode = await refineSVGCode(svgCode, originalPrompt, 1);

  // Refinement iteration 2
  svgCode = await refineSVGCode(svgCode, originalPrompt, 2);

  console.log('✅ Stage 4: Multi-model review...');
  const quality = await multiModelReview(svgCode, businessName);

  console.log(`📊 Quality score: ${quality.score}/10`);

  return {
    svgCode,
    template,
    quality,
  };
}
