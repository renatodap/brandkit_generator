import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateColorPalette, getFontPairing, generateTagline } from '@/lib/api';
import { generateLogoWithGroq, isGroqConfigured } from '@/lib/api/groq-logo';
import { extractLogoSymbols } from '@/lib/api/groq';
import type { BrandKit } from '@/types';

/**
 * Regeneration request schema
 */
const regenerateSchema = z.object({
  component: z.enum(['logo', 'colors', 'fonts', 'tagline']),
  brandKit: z.object({
    businessName: z.string(),
    businessDescription: z.string(),
    industry: z.string(),
    notes: z.string().optional(),
    advancedOptions: z
      .object({
        styles: z.array(z.string()).optional(),
        colorMood: z.string().optional(),
        targetAudience: z.string().optional(),
        brandTones: z.array(z.string()).optional(),
      })
      .optional(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      neutral: z.string(),
      background: z.string(),
    }),
  }),
});

/**
 * POST /api/regenerate
 * Regenerate a specific component of the brand kit
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { component, brandKit } = regenerateSchema.parse(body);

    const { businessName, businessDescription, industry, colors } = brandKit;

    let result: Partial<BrandKit> = {};

    switch (component) {
      case 'logo': {
        console.log('🎨 Regenerating logo...');

        if (!isGroqConfigured()) {
          return NextResponse.json(
            { error: 'Logo generation not available - Groq API not configured' },
            { status: 503 }
          );
        }

        try {
          // Extract symbols for logo
          const symbols = await extractLogoSymbols({
            businessName,
            description: businessDescription,
            industry,
          });

          // Generate logo with Groq
          const logoResult = await generateLogoWithGroq({
            businessName,
            description: businessDescription,
            industry,
            symbols,
            colorPalette: {
              primary: colors.primary,
              secondary: colors.secondary,
              accent: colors.accent,
            },
          });

          const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoResult.svgCode).toString('base64')}`;

          result = {
            logo: {
              url: logoDataUrl,
              svgCode: logoResult.svgCode,
            },
            justifications: {
              logo: logoResult.quality.feedback,
            },
          };
        } catch (error) {
          console.error('Logo generation failed:', error);
          return NextResponse.json(
            { error: 'Logo generation failed. Please try again.' },
            { status: 500 }
          );
        }
        break;
      }

      case 'colors': {
        console.log('🎨 Regenerating colors...');

        try {
          const colorPalette = await generateColorPalette({
            businessName,
            description: businessDescription,
            industry: industry as any,
          });

          result = {
            colors: colorPalette,
          };
        } catch (error) {
          console.error('Color generation failed:', error);
          return NextResponse.json(
            { error: 'Color generation failed. Please try again.' },
            { status: 500 }
          );
        }
        break;
      }

      case 'fonts': {
        console.log('🔤 Regenerating fonts...');

        try {
          const fontPairing = await getFontPairing(industry as any);

          result = {
            fonts: fontPairing,
          };
        } catch (error) {
          console.error('Font generation failed:', error);
          return NextResponse.json(
            { error: 'Font generation failed. Please try again.' },
            { status: 500 }
          );
        }
        break;
      }

      case 'tagline': {
        console.log('💬 Regenerating tagline...');

        try {
          const tagline = await generateTagline({
            businessName,
            description: businessDescription,
            industry: industry as any,
          });

          result = {
            tagline,
          };
        } catch (error) {
          console.error('Tagline generation failed:', error);
          return NextResponse.json(
            { error: 'Tagline generation failed. Please try again.' },
            { status: 500 }
          );
        }
        break;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Regeneration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during regeneration' },
      { status: 500 }
    );
  }
}
