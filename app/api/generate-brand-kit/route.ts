import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { brandKitInputSchema } from '@/lib/validations';
import { generateLogo, generateColorPalette, getFontPairing, generateTagline } from '@/lib/api';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
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
    console.error('🎨 Starting brand kit generation for:', businessName);

    // Generate all components in parallel where possible
    const [logoResult, colors, fonts, tagline] = await Promise.allSettled([
      generateLogo({
        businessName,
        description: businessDescription,
        industry,
      }),
      generateColorPalette({
        businessName,
        description: businessDescription,
        industry,
      }),
      getFontPairing({
        industry,
        businessName,
      }),
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
      // Convert blob to base64 data URL for client
      const arrayBuffer = await logoResult.value.blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      logoUrl = `data:image/png;base64,${base64}`;
      logoPrompt = logoResult.value.prompt;
    } else {
      console.error('❌ Logo generation failed:', logoResult.status === 'rejected' ? logoResult.reason : 'Unknown error');
      // Use a placeholder for now
      logoUrl = '/placeholder-logo.png';
      logoPrompt = `${businessName} logo`;
    }

    // Handle color palette result
    const colorPalette =
      colors.status === 'fulfilled'
        ? colors.value
        : {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#10B981',
            neutral: '#6B7280',
            background: '#FFFFFF',
          };

    // Handle font pairing result
    const fontPairing =
      fonts.status === 'fulfilled'
        ? fonts.value
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
      tagline.status === 'fulfilled'
        ? tagline.value
        : `${businessName} - Excellence in ${industry}`;

    // Construct brand kit response
    const brandKit: BrandKit = {
      businessName,
      industry,
      logo: {
        url: logoUrl,
        prompt: logoPrompt,
      },
      colors: colorPalette,
      fonts: fontPairing,
      tagline: brandTagline,
      generatedAt: new Date().toISOString(),
    };

    console.error('✅ Brand kit generated successfully for:', businessName);

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
