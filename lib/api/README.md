# API Services

This directory contains all API service clients for the Brand Kit Generator. These services integrate with free AI APIs and provide algorithmic solutions for generating brand assets.

## Services Overview

### 1. Hugging Face API (`huggingface.ts`)

Integrates with Hugging Face's free inference API for AI-powered logo and text generation.

**Functions:**

- `generateLogo(params: LogoGenerationParams): Promise<Blob>`
  - Generates a logo using Stable Diffusion XL
  - Uses industry-specific prompts for optimal results
  - Returns logo as a Blob (image data)
  - Handles model loading and errors gracefully

- `generateText(prompt: string, maxLength?: number): Promise<string>`
  - Generates text using FLAN-T5 model
  - Used internally by tagline generation
  - Supports customizable max length and temperature

- `checkModelAvailability(modelId?: string): Promise<boolean>`
  - Checks if a Hugging Face model is available
  - Useful for health checks and graceful degradation

**Models Used:**
- Logo Generation: `stabilityai/stable-diffusion-xl-base-1.0`
- Text Generation: `google/flan-t5-base`

**Example:**
```typescript
import { generateLogo } from '@/lib/api';

const logoBlob = await generateLogo({
  businessName: 'TechCorp',
  industry: 'tech',
  description: 'A cutting-edge software company'
});
```

### 2. Color Palette Generation (`colors.ts`)

Algorithmic color palette generation based on color theory and industry best practices.

**Functions:**

- `generateColorPalette(params: ColorPaletteParams): Promise<ColorPalette>`
  - Generates a complete 5-color palette
  - Uses industry-specific base colors
  - Applies color theory (complementary, analogous, triadic)
  - Returns primary, secondary, accent, neutral, and background colors

- `getContrastingTextColor(backgroundColor: string): string`
  - Returns black or white for optimal text contrast
  - Based on WCAG accessibility guidelines

- `lightenColor(color: string, amount?: number): string`
  - Creates lighter variants for hover states

- `darkenColor(color: string, amount?: number): string`
  - Creates darker variants for active states

**Color Strategies by Industry:**
- **Tech**: Triadic (innovative, dynamic)
- **Food**: Analogous (warm, harmonious)
- **Fashion**: Complementary (bold, striking)
- **Health**: Analogous (calming, professional)
- **Creative**: Triadic (vibrant, expressive)
- **Finance**: Analogous (stable, trustworthy)
- **Education**: Complementary (energetic, engaging)

**Example:**
```typescript
import { generateColorPalette, getContrastingTextColor } from '@/lib/api';

const palette = await generateColorPalette({
  businessName: 'TechCorp',
  industry: 'tech',
  description: 'A cutting-edge software company'
});

console.log(palette);
// {
//   primary: '#0066FF',
//   secondary: '#FF0066',
//   accent: '#66FF00',
//   neutral: '#6B7280',
//   background: '#FFFFFF'
// }

const textColor = getContrastingTextColor(palette.primary);
// Returns '#FFFFFF' for good contrast
```

### 3. Google Fonts Pairing (`fonts.ts`)

Curated font pairings from Google Fonts, selected by industry and design principles.

**Functions:**

- `getFontPairing(params: FontPairingParams): Promise<FontPairing>`
  - Returns a primary and secondary font pairing
  - Optimized for each industry
  - Includes Google Fonts URLs for easy loading

- `getAllIndustryPairings(): Promise<Record<Industry, FontPairing>>`
  - Get all industry font pairings at once
  - Useful for showcasing different styles

- `generateFontFaceCSS(pairing: FontPairing): string`
  - Generates CSS for font loading
  - Includes Tailwind CSS classes

- `searchFonts(query: string): Font[]`
  - Search available fonts by name

**Font Pairings by Industry:**
- **Tech**: Inter + Source Code Pro (modern, technical)
- **Food**: Poppins + Lora (friendly, elegant)
- **Fashion**: Playfair Display + Montserrat (sophisticated, stylish)
- **Health**: Roboto + Merriweather (professional, trustworthy)
- **Creative**: Oswald + Open Sans (bold, expressive)
- **Finance**: Montserrat + PT Serif (stable, premium)
- **Education**: Poppins + Merriweather (approachable, readable)

**Example:**
```typescript
import { getFontPairing, generateFontFaceCSS } from '@/lib/api';

const fonts = await getFontPairing({
  industry: 'tech',
  businessName: 'TechCorp'
});

console.log(fonts);
// {
//   primary: {
//     name: 'Inter',
//     family: 'Inter, sans-serif',
//     url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400,500,600,700&family=Source+Code+Pro:wght@400,600&display=swap',
//     category: 'sans-serif'
//   },
//   secondary: { ... }
// }

const css = generateFontFaceCSS(fonts);
```

### 4. Tagline Generation (`taglines.ts`)

AI-powered tagline generation with intelligent fallbacks and validation.

**Functions:**

- `generateTagline(params: TaglineGenerationParams): Promise<string>`
  - Generates a compelling tagline using AI
  - Falls back to curated taglines if AI fails
  - Validates and cleans output
  - Returns concise, memorable taglines (2-6 words)

- `generateMultipleTaglines(params, count?: number): Promise<string[]>`
  - Generate multiple tagline options
  - Removes duplicates
  - Useful for giving users choices

- `validateTagline(tagline: string): { valid, errors, warnings }`
  - Validates tagline quality
  - Checks length, format, and content

- `getExampleTaglines(industry: Industry): string[]`
  - Get example taglines for inspiration

**Tagline Characteristics by Industry:**
- **Tech**: Innovative, forward-thinking, precise
- **Food**: Warm, inviting, appetizing
- **Fashion**: Sophisticated, aspirational, trendy
- **Health**: Reassuring, professional, caring
- **Creative**: Imaginative, bold, expressive
- **Finance**: Trustworthy, professional, confident
- **Education**: Encouraging, accessible, inspiring

**Example:**
```typescript
import { generateTagline, validateTagline } from '@/lib/api';

const tagline = await generateTagline({
  businessName: 'TechCorp',
  industry: 'tech',
  description: 'A cutting-edge software company'
});

console.log(tagline);
// "Innovation at Your Fingertips"

const validation = validateTagline(tagline);
if (validation.valid) {
  console.log('Tagline is valid!');
}
```

## Error Handling

All API functions include comprehensive error handling:

### HuggingFaceError

Custom error class for Hugging Face API errors:
```typescript
try {
  const logo = await generateLogo(params);
} catch (error) {
  if (error instanceof HuggingFaceError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status: ${error.statusCode}`);
    console.error(`Code: ${error.code}`);
  }
}
```

### Graceful Degradation

All services have fallback mechanisms:
- **Logo Generation**: Returns error with clear message for retry
- **Color Palette**: Falls back to safe default palette
- **Font Pairing**: Falls back to Inter + Lora
- **Tagline**: Uses curated fallback taglines per industry

## Environment Variables

Required environment variables (add to `.env.local`):

```bash
# Required
HUGGINGFACE_API_KEY=your_api_key_here

# Optional (for better tagline generation)
OPENAI_API_KEY=your_openai_key_here
```

Get your Hugging Face API key: https://huggingface.co/settings/tokens

## Type Safety

All services are fully typed with TypeScript:

```typescript
import type {
  LogoGenerationParams,
  ColorPaletteParams,
  FontPairingParams,
  TaglineGenerationParams,
  ColorPalette,
  FontPairing,
} from '@/types';
```

## Usage in API Routes

Example Next.js API route using these services:

```typescript
// app/api/generate-brand-kit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  generateLogo,
  generateColorPalette,
  getFontPairing,
  generateTagline,
} from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, industry, description } = body;

    // Generate all brand assets in parallel
    const [logo, colors, fonts, tagline] = await Promise.all([
      generateLogo({ businessName, industry, description }),
      generateColorPalette({ businessName, industry, description }),
      getFontPairing({ industry, businessName }),
      generateTagline({ businessName, industry, description }),
    ]);

    // Convert logo blob to base64 or upload to storage
    // ...

    return NextResponse.json({
      success: true,
      data: { logo, colors, fonts, tagline },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate brand kit' },
      { status: 500 }
    );
  }
}
```

## Testing

All services can be tested without external dependencies:

```typescript
import { generateColorPalette, getFontPairing } from '@/lib/api';

// These work offline (no API calls)
const colors = await generateColorPalette({
  businessName: 'Test',
  industry: 'tech',
  description: 'Test description'
});

const fonts = await getFontPairing({
  industry: 'tech',
  businessName: 'Test'
});
```

## Performance Considerations

1. **Parallel Execution**: Use `Promise.all()` for concurrent generation
2. **Caching**: Consider caching generated assets
3. **Rate Limiting**: Implement rate limiting for API routes
4. **Fallbacks**: All services have instant fallbacks for offline/error scenarios

## Free Tier Limits

**Hugging Face Inference API:**
- Free tier: ~30,000 requests/month
- Rate limit: ~100 requests/minute
- Model cold start: 10-30 seconds (first request)
- Warm model: 2-5 seconds

**Google Fonts:**
- No API key required
- Unlimited requests
- CDN cached globally

## Next Steps

1. Implement API routes in `app/api/`
2. Add caching layer for generated assets
3. Implement rate limiting with Upstash Redis
4. Add error monitoring with Sentry
5. Create integration tests

## Contributing

When adding new services:
1. Follow TypeScript best practices
2. Include JSDoc comments
3. Add error handling
4. Provide fallback mechanisms
5. Update this README
