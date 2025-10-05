import { env } from '@/lib/env-runtime';
import type { LogoGenerationParams } from '@/types';
import { extractLogoSymbols } from './groq';

/**
 * Hugging Face API configuration
 */
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
const LOGO_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';
const TEXT_MODEL = 'google/flan-t5-base';

/**
 * Error class for Hugging Face API errors
 */
export class HuggingFaceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'HuggingFaceError';
  }
}

/**
 * Build an enhanced prompt for logo generation using AI-extracted symbols
 * @param params - Logo generation parameters
 * @param symbols - Extracted symbolic elements and mood
 * @returns Optimized prompt for SDXL model
 */
function buildEnhancedLogoPrompt(
  params: LogoGenerationParams,
  symbols: { primary: string; secondary: string; mood: string }
): string {
  const { businessName, industry } = params;

  // Industry-specific aesthetic keywords (enhanced from research)
  const industryAesthetics: Record<string, string> = {
    tech: 'sleek, geometric precision, futuristic, digital gradient, sharp angles',
    food: 'organic curves, appetizing, warm tones, natural elements, inviting',
    fashion: 'elegant lines, sophisticated, stylish minimalism, trendy, haute couture',
    health: 'clean lines, medical precision, trustworthy, calming symmetry, professional',
    creative: 'artistic flair, expressive, unique composition, imaginative, vibrant',
    finance: 'corporate elegance, stable geometry, premium finish, authoritative, refined',
    education: 'approachable, academic, inspiring, knowledgeable, progressive',
    other: 'versatile, balanced, professional clarity, timeless',
  };

  const aesthetic = industryAesthetics[industry] || industryAesthetics['other'];

  // Build comprehensive prompt with symbolic elements
  return `professional logo design for "${businessName}", featuring a stylized ${symbols.primary} with ${symbols.secondary}, ${symbols.mood} mood, ${aesthetic}, minimalist icon, memorable brand symbol, clean lines, balanced composition, centered on white background, high contrast, corporate branding, ${industry} industry aesthetic, digital art, vector-style illustration, 8k quality, professional brand identity`;
}

/**
 * Generate a logo using Hugging Face SDXL model
 * @param params - Logo generation parameters
 * @returns Promise resolving to object with logo blob and prompt
 * @throws {HuggingFaceError} If API request fails
 *
 * @example
 * ```typescript
 * const { blob, prompt } = await generateLogo({
 *   businessName: 'TechCorp',
 *   industry: 'tech',
 *   description: 'A cutting-edge software company'
 * });
 * ```
 */
export async function generateLogo(
  params: LogoGenerationParams
): Promise<{ blob: Blob; prompt: string }> {
  try {
    // Extract symbolic elements using AI (or fallback to deterministic)
    const symbols = await extractLogoSymbols({
      businessName: params.businessName,
      description: params.description,
      industry: params.industry,
    });

    // Build enhanced prompt with extracted symbols
    const prompt = buildEnhancedLogoPrompt(params, symbols);

    const response = await fetch(`${HUGGINGFACE_API_URL}/${LOGO_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.huggingFaceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt:
            'text, words, letters, watermark, signature, realistic photo, photograph, blur, noise, gradient background, complex details, cluttered, busy, multiple objects, 3d render, shadows, heavy texture, photorealistic',
          num_inference_steps: 40, // Increased from 30 for better quality
          guidance_scale: 8.5, // Increased from 7.5 for stronger adherence to prompt
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to generate logo';

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new HuggingFaceError(errorMessage, response.status, 'LOGO_GENERATION_FAILED');
    }

    const blob = await response.blob();

    // Validate that we received an image
    if (!blob.type.startsWith('image/')) {
      throw new HuggingFaceError(
        'Received invalid image format from API',
        500,
        'INVALID_IMAGE_FORMAT'
      );
    }

    return { blob, prompt };
  } catch (error) {
    if (error instanceof HuggingFaceError) {
      throw error;
    }

    throw new HuggingFaceError(
      `Logo generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'LOGO_GENERATION_ERROR'
    );
  }
}

/**
 * Generate text using Hugging Face text generation model
 * @param prompt - Text generation prompt
 * @param maxLength - Maximum length of generated text
 * @returns Promise resolving to generated text
 * @throws {HuggingFaceError} If API request fails
 *
 * @example
 * ```typescript
 * const tagline = await generateText(
 *   'Generate a tagline for TechCorp, a software company: ',
 *   50
 * );
 * ```
 */
export async function generateText(
  prompt: string,
  maxLength: number = 50
): Promise<string> {
  try {
    const response = await fetch(`${HUGGINGFACE_API_URL}/${TEXT_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.huggingFaceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: maxLength,
          temperature: 0.8,
          top_p: 0.9,
          do_sample: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to generate text';

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new HuggingFaceError(errorMessage, response.status, 'TEXT_GENERATION_FAILED');
    }

    const result = await response.json();

    // Handle different response formats
    let generatedText = '';

    if (Array.isArray(result) && result.length > 0) {
      generatedText = result[0]?.generated_text || result[0]?.summary_text || '';
    } else if (typeof result === 'object' && result !== null) {
      generatedText =
        result.generated_text || result.summary_text || result[0]?.generated_text || '';
    }

    if (!generatedText) {
      throw new HuggingFaceError(
        'No text generated from API',
        500,
        'EMPTY_GENERATION'
      );
    }

    return generatedText.trim();
  } catch (error) {
    if (error instanceof HuggingFaceError) {
      throw error;
    }

    throw new HuggingFaceError(
      `Text generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'TEXT_GENERATION_ERROR'
    );
  }
}

/**
 * Check if Hugging Face API is available and model is loaded
 * @param modelId - Model ID to check
 * @returns Promise resolving to true if available
 */
export async function checkModelAvailability(
  modelId: string = LOGO_MODEL
): Promise<boolean> {
  try {
    const response = await fetch(`${HUGGINGFACE_API_URL}/${modelId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.huggingFaceApiKey}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
