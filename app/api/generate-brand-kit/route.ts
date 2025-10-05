import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { brandKitInputSchema } from '@/lib/validations';
import { generateColorPalette, getFontPairing, generateTagline } from '@/lib/api';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  generateLogoWithWorkflow,
  isOpenRouterConfigured,
  OpenRouterError,
} from '@/lib/api/openrouter';
import {
  extractLogoSymbols,
  extractColorPreferences,
  extractBrandPersonality,
  generateColorJustification,
  generateFontJustification,
} from '@/lib/api/groq';
import { svgToDataURL, normalizeSVG, optimizeSVG } from '@/lib/api/logo-utils';
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

    // Step 2: Generate color palette first (needed for logo generation)
    console.log('🎨 Generating color palette...');
    const colorPaletteResult = await (async () => {
      try {
        return await generateColorPalette({
          businessName,
          description: businessDescription,
          industry,
        });
      } catch (error) {
        console.error('Color palette generation failed:', error);
        return {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          neutral: '#6B7280',
          background: '#FFFFFF',
        };
      }
    })();

    // Step 3: Generate core brand assets in parallel
    console.log('🎨 Generating brand assets...');
    const [logoResult, fontPairingResult, taglineResult] = await Promise.allSettled([
      // Logo generation with OpenRouter multi-model workflow
      (async () => {
        if (!isOpenRouterConfigured()) {
          throw new OpenRouterError(
            'OPENROUTER_API_KEY not configured. Please add it to your environment variables.',
            500,
            'MISSING_API_KEY'
          );
        }

        console.log('🖼️  Generating SVG logo with multi-model workflow...');
        const result = await generateLogoWithWorkflow({
          businessName,
          description: businessDescription,
          industry,
          symbols,
          colorPalette: {
            primary: colorPaletteResult.primary,
            secondary: colorPaletteResult.secondary,
            accent: colorPaletteResult.accent,
          },
        });

        // Normalize and optimize SVG
        const normalizedSvg = normalizeSVG(result.svgCode);
        const optimizedSvg = optimizeSVG(normalizedSvg);

        // Convert to data URL
        const dataUrl = svgToDataURL(optimizedSvg);

        return {
          url: dataUrl,
          svgCode: optimizedSvg,
          template: result.template,
          quality: result.quality,
        };
      })(),
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
    let logoSvgCode = '';
    let logoQuality = { score: 0, feedback: '' };

    if (logoResult.status === 'fulfilled' && logoResult.value) {
      logoUrl = logoResult.value.url;
      logoSvgCode = logoResult.value.svgCode;
      logoQuality = logoResult.value.quality;
      console.log(`✅ Logo generated successfully (Quality: ${logoQuality.score}/10)`);
    } else {
      console.error(
        '❌ Logo generation failed:',
        logoResult.status === 'rejected' ? logoResult.reason : 'Unknown error'
      );
      // Return error if OpenRouter fails
      const errorMessage =
        logoResult.status === 'rejected' && logoResult.reason instanceof Error
          ? logoResult.reason.message
          : 'Logo generation failed';

      return NextResponse.json(
        {
          error: 'Logo generation failed',
          message: errorMessage,
          details:
            'Please ensure OPENROUTER_API_KEY is configured in your environment variables.',
        },
        { status: 500 }
      );
    }

    // Color palette already generated earlier
    const colorPalette = colorPaletteResult;

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

    // Step 4: Generate justifications in parallel
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
        svgCode: logoSvgCode,
      },
      colors: colorPalette,
      fonts: fontPairing,
      tagline: brandTagline,
      justifications: {
        colors: colorJustification,
        fonts: fontJustification,
        logo: logoQuality.feedback,
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
