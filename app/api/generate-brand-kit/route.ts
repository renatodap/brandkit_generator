import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { enhancedBrandKitInputSchema } from '@/lib/validations';
import { generateColorPalette, getFontPairing, generateTagline } from '@/lib/api';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  generateLogoWithGroq,
  isGroqConfigured,
  GroqLogoError,
} from '@/lib/api/groq-logo';
import {
  extractLogoSymbols,
  extractColorPreferences,
  extractBrandPersonality,
  generateColorJustification,
  generateFontJustification,
} from '@/lib/api/groq';
import { svgToDataURL, normalizeSVG, optimizeSVG } from '@/lib/api/logo-utils';
import { enhancePrompt } from '@/lib/utils/prompt-enhancement';
import { getUser } from '@/lib/supabase/server';
import { createBrandKit } from '@/lib/services/brand-kit-service';
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
    const validationResult = enhancedBrandKitInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      businessId,
      businessName,
      businessDescription,
      industry,
      notes,
      logoOption,
      logoBase64,
      colorOption,
      existingColors,
      fontOption,
      existingFonts,
      advancedOptions,
    } = validationResult.data;

    // Log generation start
    console.log('🎨 Starting brand kit generation for:', businessName);
    console.log('📝 Options:', { logoOption, colorOption, fontOption, hasNotes: !!notes, hasAdvancedOptions: !!advancedOptions });

    // Step 1: Extract brand insights in parallel
    console.log('🧠 Extracting brand insights...');
    const [symbolsResult, colorPrefsResult, personalityResult] = await Promise.allSettled([
      extractLogoSymbols({
        businessName,
        description: businessDescription || '',
        industry,
      }),
      extractColorPreferences({
        businessName,
        description: businessDescription || '',
        industry,
      }),
      extractBrandPersonality({
        businessName,
        description: businessDescription || '',
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

    // Step 2: Handle color palette (use existing or generate)
    console.log('🎨 Processing color palette...');
    const colorPaletteResult = await (async () => {
      if (colorOption === 'existing' && existingColors) {
        console.log('✅ Using existing color palette');
        return existingColors;
      }

      console.log('🎨 Generating color palette...');
      try {
        // Enhance the generation with notes and advanced options
        const enhancedDescription = enhancePrompt(businessDescription || '', notes, advancedOptions);

        return await generateColorPalette({
          businessName,
          description: enhancedDescription,
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
      // Logo generation/upload/skip
      (async () => {
        if (logoOption === 'skip') {
          console.log('⏭️  Skipping logo generation');
          return null;
        }

        if (logoOption === 'upload' && logoBase64) {
          console.log('📤 Using uploaded logo');
          return {
            url: logoBase64,
            svgCode: undefined,
            template: 'user-uploaded',
            quality: { score: 10, feedback: 'User-uploaded logo' },
          };
        }

        // Generate logo
        if (!isGroqConfigured()) {
          throw new GroqLogoError(
            'GROQ_API_KEY not configured. Please add it to your environment variables.',
            500,
            'MISSING_API_KEY'
          );
        }

        console.log('🖼️  Generating SVG logo with Groq (Llama 3.3 + 3.1)...');

        // Enhance description with notes and advanced options
        const enhancedDescription = enhancePrompt(businessDescription || '', notes, advancedOptions);

        const result = await generateLogoWithGroq({
          businessName,
          description: enhancedDescription,
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
      // Font pairing (use existing or generate)
      (async () => {
        if (fontOption === 'existing' && existingFonts) {
          console.log('✅ Using existing fonts');
          return {
            primary: {
              name: existingFonts.primary.name,
              family: `${existingFonts.primary.name}, ${existingFonts.primary.category}`,
              url:
                existingFonts.primary.url ||
                `https://fonts.googleapis.com/css2?family=${existingFonts.primary.name.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`,
              category: existingFonts.primary.category,
            },
            secondary: {
              name: existingFonts.secondary.name,
              family: `${existingFonts.secondary.name}, ${existingFonts.secondary.category}`,
              url:
                existingFonts.secondary.url ||
                `https://fonts.googleapis.com/css2?family=${existingFonts.secondary.name.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`,
              category: existingFonts.secondary.category,
            },
          };
        }

        console.log('🔤 Generating font pairing...');
        const enhancedDescription = enhancePrompt(businessDescription || '', notes, advancedOptions);

        return getFontPairing({
          industry,
          businessName,
          description: enhancedDescription,
        });
      })(),
      // Tagline (always generate with enhancement)
      (async () => {
        console.log('✍️  Generating tagline...');
        const enhancedDescription = enhancePrompt(businessDescription || '', notes, advancedOptions);

        return generateTagline({
          businessName,
          description: enhancedDescription,
          industry,
        });
      })(),
    ]);

    // Handle logo generation result
    let logoUrl: string | null = null;
    let logoSvgCode = '';
    let logoQuality = { score: 0, feedback: '' };

    if (logoResult.status === 'fulfilled') {
      if (logoResult.value === null) {
        // Logo was skipped
        console.log('⏭️  Logo skipped per user request');
      } else {
        logoUrl = logoResult.value.url;
        logoSvgCode = logoResult.value.svgCode || '';
        logoQuality = logoResult.value.quality;
        console.log(`✅ Logo processed successfully (Quality: ${logoQuality.score}/10)`);
      }
    } else if (logoOption === 'generate') {
      // Only return error if logo generation was requested but failed
      console.error('❌ Logo generation failed:', logoResult.reason);
      const errorMessage =
        logoResult.reason instanceof Error ? logoResult.reason.message : 'Logo generation failed';

      return NextResponse.json(
        {
          error: 'Logo generation failed',
          message: errorMessage,
          details: 'Please ensure GROQ_API_KEY is configured in your environment variables.',
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

    // Step 4: Generate justifications in parallel (with enhanced context)
    console.log('📝 Generating justifications...');
    const enhancedDescriptionForJustifications = enhancePrompt(
      businessDescription || '',
      notes,
      advancedOptions
    );

    const [colorJustificationResult, fontJustificationResult] = await Promise.allSettled([
      generateColorJustification({
        businessName,
        description: enhancedDescriptionForJustifications,
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
        description: enhancedDescriptionForJustifications,
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
      logo: logoUrl
        ? {
            url: logoUrl,
            svgCode: logoSvgCode,
          }
        : null,
      colors: colorPalette,
      fonts: fontPairing,
      tagline: brandTagline,
      justifications: {
        colors:
          colorOption === 'existing' && existingColors
            ? 'Using your provided color palette'
            : colorJustification,
        fonts:
          fontOption === 'existing' && existingFonts
            ? 'Using your provided fonts'
            : fontJustification,
        logo: logoOption === 'skip' ? 'Logo generation skipped' : logoQuality.feedback,
      },
      generatedAt: new Date().toISOString(),
    };

    console.log('✅ Brand kit generated successfully for:', businessName);

    // Save to database if user is authenticated
    try {
      const user = await getUser();

      if (user && logoUrl) {
        console.log('💾 Saving brand kit to database for user:', user.id);

        // Convert color palette to array format for database
        const colorsArray = [
          { name: 'Primary', hex: colorPalette.primary, usage: 'primary' },
          { name: 'Secondary', hex: colorPalette.secondary, usage: 'secondary' },
          { name: 'Accent', hex: colorPalette.accent, usage: 'accent' },
          { name: 'Neutral', hex: colorPalette.neutral, usage: 'neutral' },
          { name: 'Background', hex: colorPalette.background, usage: 'background' },
        ];

        const savedBrandKit = await createBrandKit(user.id, {
          businessId,
          businessName,
          businessDescription,
          industry,
          logoUrl,
          logoSvg: logoSvgCode || undefined,
          colors: colorsArray,
          fonts: {
            primary: fontPairing.primary.name,
            secondary: fontPairing.secondary.name,
          },
          tagline: brandTagline,
        });

        console.log('✅ Brand kit saved to database with ID:', savedBrandKit.id);

        // Add database ID to response
        return NextResponse.json(
          { ...brandKit, id: savedBrandKit.id },
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, must-revalidate',
            },
          }
        );
      }
    } catch (error) {
      // Log error but don't fail the request - user still gets their brand kit
      console.log('ℹ️  Brand kit not saved to database (user not authenticated or error):', error);
    }

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
