import { env } from '@/lib/env';
import type { LogoGenerationParams } from '@/types';

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
 * Build a prompt for logo generation
 * @param params - Logo generation parameters
 * @returns Optimized prompt for SDXL model
 */
function buildLogoPrompt(params: LogoGenerationParams): string {
  const { businessName, industry, description } = params;

  // Industry-specific style keywords
  const industryStyles: Record<string, string> = {
    tech: 'modern, minimalist, geometric, sleek, innovative',
    food: 'appetizing, organic, warm, inviting, fresh',
    fashion: 'elegant, sophisticated, stylish, trendy, chic',
    health: 'clean, professional, trustworthy, calming, medical',
    creative: 'artistic, colorful, expressive, unique, imaginative',
    finance: 'professional, trustworthy, stable, premium, corporate',
    education: 'friendly, approachable, knowledgeable, inspiring, academic',
    other: 'professional, clean, modern, versatile',
  };

  const style = industryStyles[industry] || industryStyles['other'];

  return `professional logo design for "${businessName}", ${description}, ${style}, vector art, flat design, simple, iconic, memorable, white background, centered composition, high quality`;
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
    const prompt = buildLogoPrompt(params);

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
            'text, words, letters, watermark, signature, blurry, low quality, distorted, deformed',
          num_inference_steps: 30,
          guidance_scale: 7.5,
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
