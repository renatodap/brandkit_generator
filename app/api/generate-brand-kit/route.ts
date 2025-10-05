import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { brandKitInputSchema } from '@/lib/validations';
import { generateColorPalette, getFontPairing, generateTagline } from '@/lib/api';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  generateLogoWithPostProcessing,
  isDeepAIConfigured,
  DeepAIError,
} from '@/lib/api/deepai';
import {
  extractLogoSymbols,
  extractColorPreferences,
  extractBrandPersonality,
  generateColorJustification,
  generateFontJustification,
} from '@/lib/api/groq';
import { buildEnhancedLogoPrompt } from '@/lib/api/logo-utils';
import type { BrandKit } from '@/types';

/**
 * POST /api/generate-brand-kit
 * Generates a complete brand kit based on input parameters
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = brandKitInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { businessName, businessDescription, industry } = validationResult.data;

    // Log generation start
    console.log('🎨 Starting brand kit generation for:', businessName);

    // Step 1: Extract brand insights in parallel
    console.log('🧠 Extracting brand insights...');
    const [symbolsResult, colorPrefsResult, personalityResult] = await Promise.allSettled([
      extractLogoSymbols({
        businessName,
        description: businessDescription,
        industry,
      }),
      extractColorPreferences({
        businessName,
        description: businessDescription,
        industry,
      }),
      extractBrandPersonality({
        businessName,
        description: businessDescription,
        industry,
      }),
    ]);

    const symbols =
      symbolsResult.status === 'fulfilled'
        ? symbolsResult.value
        : { primary: 'abstract symbol', secondary: 'geometric pattern', mood: 'professional' };

    const colorPrefs =
      colorPrefsResult.status === 'fulfilled'
        ? colorPrefsResult.value
        : { mood: 'professional' as const, trend: 'classic' as const, keywords: [] };

    const personality =
      personalityResult.status === 'fulfilled'
        ? personalityResult.value
        : {
            modern: 0.5,
            classic: 0.4,
            playful: 0.3,
            elegant: 0.4,
            bold: 0.4,
            friendly: 0.5,
            professional: 0.6,
            luxurious: 0.3,
          };

    // Step 2: Generate core brand assets in parallel
    console.log('🎨 Generating brand assets...');
    const [logoResult, colorPaletteResult, fontPairingResult, taglineResult] =
      await Promise.allSettled([
        // Logo generation with DeepAI
        (async () => {
          if (!isDeepAIConfigured()) {
            throw new DeepAIError(
              'DEEPAI_API_KEY not configured. Please add it to your environment variables.',
              500,
              'MISSING_API_KEY'
            );
          }

          const logoPrompt = buildEnhancedLogoPrompt(
            {
              businessName,
              description: businessDescription,
              industry,
            },
            symbols
          );

          console.log('🖼️  Generating logo with DeepAI Genius mode...');
          return await generateLogoWithPostProcessing(logoPrompt, {
            width: 1024,
            height: 1024,
            negativePrompt:
              'text, words, letters, watermark, signature, realistic photo, photograph, blur, noise, gradient background, complex details, cluttered, busy, multiple objects, 3d render, shadows, heavy texture, photorealistic, people, faces',
            skipBackgroundRemoval: false,
            skipUpscaling: false,
          });
        })(),
        // Color palette
        generateColorPalette({
          businessName,
          description: businessDescription,
          industry,
        }),
        // Font pairing with personality
        getFontPairing({
          industry,
          businessName,
          description: businessDescription,
        }),
        // Tagline
        generateTagline({
          businessName,
          description: businessDescription,
          industry,
        }),
      ]);

    // Handle logo generation result
    let logoUrl = '';
    let logoPrompt = '';

    if (logoResult.status === 'fulfilled' && logoResult.value) {
      logoUrl = logoResult.value.finalUrl;
      logoPrompt = logoResult.value.prompt;
      console.log('✅ Logo generated successfully');
    } else {
      console.error(
        '❌ Logo generation failed:',
        logoResult.status === 'rejected' ? logoResult.reason : 'Unknown error'
      );
      // Return error if DeepAI fails
      const errorMessage =
        logoResult.status === 'rejected' && logoResult.reason instanceof Error
          ? logoResult.reason.message
          : 'Logo generation failed';

      return NextResponse.json(
        {
          error: 'Logo generation failed',
          message: errorMessage,
          details:
            'Please ensure DEEPAI_API_KEY is configured in your environment variables.',
        },
        { status: 500 }
      );
    }

    // Handle color palette result
    const colorPalette =
      colorPaletteResult.status === 'fulfilled'
        ? colorPaletteResult.value
        : {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#10B981',
            neutral: '#6B7280',
            background: '#FFFFFF',
          };

    // Handle font pairing result
    const fontPairing =
      fontPairingResult.status === 'fulfilled'
        ? fontPairingResult.value
        : {
            primary: {
              name: 'Inter',
              family: 'Inter, sans-serif',
              url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
              category: 'sans-serif' as const,
            },
            secondary: {
              name: 'Lora',
              family: 'Lora, serif',
              url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
              category: 'serif' as const,
            },
          };

    // Handle tagline result
    const brandTagline =
      taglineResult.status === 'fulfilled'
        ? taglineResult.value
        : `${businessName} - Excellence in ${industry}`;

    // Step 3: Generate justifications in parallel
    console.log('📝 Generating justifications...');
    const [colorJustificationResult, fontJustificationResult] = await Promise.allSettled([
      generateColorJustification({
        businessName,
        description: businessDescription,
        industry,
        colors: {
          primary: colorPalette.primary,
          secondary: colorPalette.secondary,
          accent: colorPalette.accent,
        },
        mood: colorPrefs.mood,
        trend: colorPrefs.trend,
      }),
      generateFontJustification({
        businessName,
        description: businessDescription,
        industry,
        fonts: {
          primary: {
            name: fontPairing.primary.name,
            category: fontPairing.primary.category,
          },
          secondary: {
            name: fontPairing.secondary.name,
            category: fontPairing.secondary.category,
          },
        },
        personality,
      }),
    ]);

    const colorJustification =
      colorJustificationResult.status === 'fulfilled'
        ? colorJustificationResult.value
        : 'These colors were carefully selected to match your brand personality and industry.';

    const fontJustification =
      fontJustificationResult.status === 'fulfilled'
        ? fontJustificationResult.value
        : 'These fonts create a professional, readable brand identity.';

    // Construct brand kit response
    const brandKit: BrandKit = {
      businessName,
      businessDescription,
      industry,
      logo: {
        url: logoUrl,
        prompt: logoPrompt,
      },
      colors: colorPalette,
      fonts: fontPairing,
      tagline: brandTagline,
      justifications: {
        colors: colorJustification,
        fonts: fontJustification,
      },
      generatedAt: new Date().toISOString(),
    };

    console.log('✅ Brand kit generated successfully for:', businessName);

    return NextResponse.json(brandKit, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ Error in generate-brand-kit API:', error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        api_route: 'generate-brand-kit',
      },
      extra: {
        ip: getClientIp(request),
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to generate brand kit',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-brand-kit
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      message: 'Brand Kit Generator API is running',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
