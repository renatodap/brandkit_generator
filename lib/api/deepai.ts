/**
 * DeepAI API Client
 * Provides high-quality image generation, background removal, and upscaling
 */

/**
 * DeepAI API configuration
 */
const DEEPAI_API_BASE = 'https://api.deepai.org/api';

/**
 * Error class for DeepAI API errors
 */
export class DeepAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'DeepAIError';
  }
}

/**
 * Get DeepAI API key with runtime validation
 */
function getDeepAIKey(): string | null {
  return process.env['DEEPAI_API_KEY'] || null;
}

/**
 * Generate image using DeepAI Text2Image API
 * Uses "genius" mode for highest quality logo generation
 *
 * @param prompt - Image generation prompt
 * @param options - Generation options
 * @returns Promise resolving to image URL
 */
export async function generateImage(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    mode?: 'standard' | 'hd' | 'genius';
    geniusPreference?: 'anime' | 'photography' | 'graphic' | 'cinematic';
    negativePrompt?: string;
  } = {}
): Promise<{ imageUrl: string; prompt: string }> {
  const apiKey = getDeepAIKey();

  if (!apiKey) {
    throw new DeepAIError('DEEPAI_API_KEY not configured', 500, 'MISSING_API_KEY');
  }

  try {
    const {
      width = 1024,
      height = 1024,
      mode = 'genius',
      geniusPreference = 'graphic',
      negativePrompt,
    } = options;

    const formData = new URLSearchParams();
    formData.append('text', prompt);
    formData.append('width', width.toString());
    formData.append('height', height.toString());
    formData.append('image_generator_version', mode);

    if (mode === 'genius' && geniusPreference) {
      formData.append('genius_preference', geniusPreference);
    }

    if (negativePrompt) {
      formData.append('negative_prompt', negativePrompt);
    }

    const response = await fetch(`${DEEPAI_API_BASE}/text2img`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DeepAIError(
        `DeepAI API error: ${errorText}`,
        response.status,
        'API_ERROR'
      );
    }

    const result = await response.json();

    if (!result.output_url) {
      throw new DeepAIError('No image URL in DeepAI response', 500, 'INVALID_RESPONSE');
    }

    return {
      imageUrl: result.output_url,
      prompt,
    };
  } catch (error) {
    if (error instanceof DeepAIError) {
      throw error;
    }

    throw new DeepAIError(
      `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'GENERATION_FAILED'
    );
  }
}

/**
 * Remove background from image using DeepAI Background Remover
 *
 * @param imageUrl - URL of the image to process
 * @returns Promise resolving to processed image URL
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  const apiKey = getDeepAIKey();

  if (!apiKey) {
    throw new DeepAIError('DEEPAI_API_KEY not configured', 500, 'MISSING_API_KEY');
  }

  try {
    const formData = new URLSearchParams();
    formData.append('image', imageUrl);

    const response = await fetch(`${DEEPAI_API_BASE}/background-remover`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DeepAIError(
        `Background removal failed: ${errorText}`,
        response.status,
        'REMOVAL_FAILED'
      );
    }

    const result = await response.json();

    if (!result.output_url) {
      throw new DeepAIError('No output URL in response', 500, 'INVALID_RESPONSE');
    }

    return result.output_url;
  } catch (error) {
    if (error instanceof DeepAIError) {
      throw error;
    }

    throw new DeepAIError(
      `Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'REMOVAL_ERROR'
    );
  }
}

/**
 * Upscale image using DeepAI Super Resolution
 *
 * @param imageUrl - URL of the image to upscale
 * @returns Promise resolving to upscaled image URL
 */
export async function upscaleImage(imageUrl: string): Promise<string> {
  const apiKey = getDeepAIKey();

  if (!apiKey) {
    throw new DeepAIError('DEEPAI_API_KEY not configured', 500, 'MISSING_API_KEY');
  }

  try {
    const formData = new URLSearchParams();
    formData.append('image', imageUrl);

    const response = await fetch(`${DEEPAI_API_BASE}/torch-srgan`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DeepAIError(
        `Upscaling failed: ${errorText}`,
        response.status,
        'UPSCALE_FAILED'
      );
    }

    const result = await response.json();

    if (!result.output_url) {
      throw new DeepAIError('No output URL in response', 500, 'INVALID_RESPONSE');
    }

    return result.output_url;
  } catch (error) {
    if (error instanceof DeepAIError) {
      throw error;
    }

    throw new DeepAIError(
      `Upscaling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'UPSCALE_ERROR'
    );
  }
}

/**
 * Full logo generation pipeline with post-processing
 * 1. Generate logo with DeepAI Genius mode
 * 2. Remove background
 * 3. Upscale to high resolution
 *
 * @param prompt - Logo generation prompt
 * @param options - Generation options
 * @returns Promise resolving to final processed logo URL
 */
export async function generateLogoWithPostProcessing(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    negativePrompt?: string;
    skipBackgroundRemoval?: boolean;
    skipUpscaling?: boolean;
  } = {}
): Promise<{ finalUrl: string; originalUrl: string; prompt: string }> {
  try {
    // Step 1: Generate logo with Genius mode
    const { imageUrl: originalUrl, prompt: usedPrompt } = await generateImage(prompt, {
      width: options.width || 1024,
      height: options.height || 1024,
      mode: 'genius',
      geniusPreference: 'graphic',
      negativePrompt: options.negativePrompt,
    });

    let processedUrl = originalUrl;

    // Step 2: Remove background (optional)
    if (!options.skipBackgroundRemoval) {
      try {
        processedUrl = await removeBackground(processedUrl);
      } catch (error) {
        console.warn('Background removal failed, using original:', error);
        // Continue with original if background removal fails
      }
    }

    // Step 3: Upscale (optional)
    if (!options.skipUpscaling) {
      try {
        processedUrl = await upscaleImage(processedUrl);
      } catch (error) {
        console.warn('Upscaling failed, using current version:', error);
        // Continue with current version if upscaling fails
      }
    }

    return {
      finalUrl: processedUrl,
      originalUrl,
      prompt: usedPrompt,
    };
  } catch (error) {
    if (error instanceof DeepAIError) {
      throw error;
    }

    throw new DeepAIError(
      `Logo generation pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'PIPELINE_FAILED'
    );
  }
}

/**
 * Check if DeepAI is configured
 */
export function isDeepAIConfigured(): boolean {
  return !!getDeepAIKey();
}
