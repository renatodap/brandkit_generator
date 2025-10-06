# Enhanced User Input Feature Design

## Overview
Transform the brand kit generator from a simple "generate everything" model to a flexible system where users can:
- Choose what to generate vs. provide
- Upload existing assets (logo)
- Input existing brand elements (colors, typography)
- Provide contextual notes for AI guidance
- Configure advanced generation parameters

## User Stories

### US-1: Logo Control
**As a** business owner with an existing logo
**I want to** upload my logo instead of generating one
**So that** I can maintain brand consistency while getting other assets

**Acceptance Criteria:**
- Toggle between "Generate Logo" and "Upload Logo"
- File upload supports PNG, JPG, SVG formats
- Upload validates file size (<5MB)
- Preview uploaded logo before submission
- If uploaded, API skips logo generation

### US-2: Logo Generation Choice
**As a** new business owner
**I want to** choose whether to include a logo in generation
**So that** I can get just colors/fonts if I already have a logo elsewhere

**Acceptance Criteria:**
- Checkbox: "Generate Logo"
- If unchecked, logo generation is skipped
- Form remains valid without logo

### US-3: Color Palette Input
**As a** brand manager with established colors
**I want to** input my existing palette
**So that** fonts and other assets match my brand colors

**Acceptance Criteria:**
- Toggle: "Generate Palette" vs "Use Existing Palette"
- Color pickers for: Primary, Secondary, Accent, Neutral, Background
- Real-time preview of color combinations
- Validation for valid hex colors
- If provided, API uses these colors instead of generating

### US-4: Typography Input
**As a** designer with preferred fonts
**I want to** specify my existing typography
**So that** I don't need to regenerate fonts I already use

**Acceptance Criteria:**
- Toggle: "Generate Fonts" vs "Use Existing Fonts"
- Inputs for Primary Font (name, category, Google Fonts URL)
- Inputs for Secondary Font (name, category, Google Fonts URL)
- Font category dropdown (serif, sans-serif, display, etc.)
- If provided, API uses these fonts

### US-5: Contextual Notes
**As a** user with specific brand vision
**I want to** provide additional context/notes
**So that** AI generates assets aligned with my vision

**Acceptance Criteria:**
- "Notes" textarea (500 char max)
- Placeholder examples: "Use ocean imagery", "Avoid red colors", "Target Gen Z audience"
- Notes incorporated into ALL AI prompts (logo, colors, fonts, tagline)
- Optional field

### US-6: Advanced Options
**As a** power user wanting fine control
**I want to** specify advanced generation parameters
**So that** I get more precise, tailored results

**Acceptance Criteria:**
- Collapsible "Advanced Options" section (collapsed by default)
- Style preference: Multi-select (Modern, Classic, Minimalist, Bold, Playful, Elegant, Vintage, Futuristic)
- Color mood: Select (Vibrant, Muted, Warm, Cool, Monochrome, Pastel, Earth Tones, Neon)
- Target audience: Select (B2B, B2C, Gen Z, Millennials, Gen X, Boomers, Luxury, Budget-Conscious)
- Brand tone: Multi-select (Professional, Playful, Serious, Friendly, Authoritative, Approachable, Innovative, Traditional)
- All options incorporated into AI prompts

## Technical Approach

### Architecture Changes

#### 1. Type System Extensions
```typescript
// Enhanced input type
interface BrandKitInputEnhanced {
  // Existing fields
  businessName: string;
  businessDescription: string;
  industry: Industry;

  // New: Optional notes
  notes?: string;

  // New: Logo options
  logoOption: 'generate' | 'upload' | 'skip';
  logoFile?: File; // If logoOption === 'upload'

  // New: Color palette options
  colorOption: 'generate' | 'existing';
  existingColors?: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    background: string;
  };

  // New: Typography options
  fontOption: 'generate' | 'existing';
  existingFonts?: {
    primary: {
      name: string;
      category: FontCategory;
      url?: string;
    };
    secondary: {
      name: string;
      category: FontCategory;
      url?: string;
    };
  };

  // New: Advanced options
  advancedOptions?: {
    styles?: ('modern' | 'classic' | 'minimalist' | 'bold' | 'playful' | 'elegant' | 'vintage' | 'futuristic')[];
    colorMood?: 'vibrant' | 'muted' | 'warm' | 'cool' | 'monochrome' | 'pastel' | 'earth' | 'neon';
    targetAudience?: 'b2b' | 'b2c' | 'gen-z' | 'millennial' | 'gen-x' | 'boomer' | 'luxury' | 'budget';
    brandTones?: ('professional' | 'playful' | 'serious' | 'friendly' | 'authoritative' | 'approachable' | 'innovative' | 'traditional')[];
  };
}
```

#### 2. Frontend Components

**Component Tree:**
```
HomePage
├── HeroSection (existing)
├── FeaturesGrid (existing)
└── BrandKitForm (enhanced)
    ├── BusinessNameInput (existing)
    ├── BusinessDescriptionTextarea (existing)
    ├── IndustrySelect (existing)
    ├── NotesTextarea (NEW)
    ├── LogoControl (NEW)
    │   ├── LogoOptionToggle (generate/upload/skip)
    │   └── LogoUpload (if upload selected)
    ├── ColorPaletteControl (NEW)
    │   ├── ColorOptionToggle (generate/existing)
    │   └── ColorPaletteInputs (if existing selected)
    │       ├── ColorPicker (primary)
    │       ├── ColorPicker (secondary)
    │       ├── ColorPicker (accent)
    │       ├── ColorPicker (neutral)
    │       └── ColorPicker (background)
    ├── TypographyControl (NEW)
    │   ├── FontOptionToggle (generate/existing)
    │   └── FontInputs (if existing selected)
    │       ├── PrimaryFontInput
    │       └── SecondaryFontInput
    └── AdvancedOptionsCollapsible (NEW)
        ├── StyleMultiSelect
        ├── ColorMoodSelect
        ├── TargetAudienceSelect
        └── BrandToneMultiSelect
```

**New Components to Create:**
1. `components/brand-kit-form/logo-control.tsx`
2. `components/brand-kit-form/color-palette-control.tsx`
3. `components/brand-kit-form/typography-control.tsx`
4. `components/brand-kit-form/notes-textarea.tsx`
5. `components/brand-kit-form/advanced-options.tsx`
6. `components/ui/color-picker.tsx` (new UI component)
7. `components/ui/collapsible.tsx` (shadcn/ui)
8. `components/ui/multi-select.tsx` (custom or find library)

#### 3. Backend API Changes

**API Route Flow:**
```typescript
POST /api/generate-brand-kit
1. Parse and validate enhanced input
2. Check rate limit
3. Process logo:
   - If logoOption === 'upload': Store uploaded file, convert to data URL
   - If logoOption === 'generate': Run logo generation with notes + advanced options
   - If logoOption === 'skip': Set logo to null
4. Process colors:
   - If colorOption === 'existing': Use provided colors
   - If colorOption === 'generate': Generate with notes + advanced options
5. Process fonts:
   - If fontOption === 'existing': Use provided fonts, construct Google Fonts URLs
   - If fontOption === 'generate': Generate with notes + advanced options
6. Generate tagline (always): Incorporate notes + advanced options
7. Return complete BrandKit
```

**Prompt Enhancement Strategy:**
```typescript
function enhancePrompt(
  basePrompt: string,
  notes?: string,
  advancedOptions?: AdvancedOptions
): string {
  let enhanced = basePrompt;

  if (notes) {
    enhanced += `\n\nAdditional Context: ${notes}`;
  }

  if (advancedOptions?.styles?.length) {
    enhanced += `\nStyle Preferences: ${advancedOptions.styles.join(', ')}`;
  }

  if (advancedOptions?.colorMood) {
    enhanced += `\nColor Mood: ${advancedOptions.colorMood}`;
  }

  if (advancedOptions?.targetAudience) {
    enhanced += `\nTarget Audience: ${advancedOptions.targetAudience}`;
  }

  if (advancedOptions?.brandTones?.length) {
    enhanced += `\nBrand Tone: ${advancedOptions.brandTones.join(', ')}`;
  }

  return enhanced;
}
```

#### 4. File Upload Strategy

**Logo Upload:**
- Use `multipart/form-data` instead of JSON for file uploads
- Alternative: Base64 encode on client, send in JSON (simpler, no API changes)
- Validation:
  - File size: Max 5MB
  - File types: PNG, JPG, JPEG, SVG
  - Dimensions: Min 100x100px, Max 2000x2000px
- Storage: Convert to data URL, store in BrandKit response (no server storage)

**Implementation (Base64 approach):**
```typescript
// Client-side
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Server-side
if (logoOption === 'upload' && logoBase64) {
  brandKit.logo = {
    url: logoBase64,
    svgCode: undefined, // User-uploaded, not SVG code
  };
}
```

### Data Models

**Enhanced Zod Schemas:**
```typescript
// lib/validations.ts additions

export const logoOptionSchema = z.enum(['generate', 'upload', 'skip']);

export const colorOptionSchema = z.enum(['generate', 'existing']);

export const fontOptionSchema = z.enum(['generate', 'existing']);

export const existingColorPaletteSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  accent: hexColorSchema,
  neutral: hexColorSchema,
  background: hexColorSchema,
});

export const existingFontSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.enum(['serif', 'sans-serif', 'display', 'handwriting', 'monospace']),
  url: z.string().url().optional(),
});

export const existingFontsSchema = z.object({
  primary: existingFontSchema,
  secondary: existingFontSchema,
});

export const advancedOptionsSchema = z.object({
  styles: z.array(z.enum([
    'modern', 'classic', 'minimalist', 'bold',
    'playful', 'elegant', 'vintage', 'futuristic'
  ])).optional(),
  colorMood: z.enum([
    'vibrant', 'muted', 'warm', 'cool',
    'monochrome', 'pastel', 'earth', 'neon'
  ]).optional(),
  targetAudience: z.enum([
    'b2b', 'b2c', 'gen-z', 'millennial',
    'gen-x', 'boomer', 'luxury', 'budget'
  ]).optional(),
  brandTones: z.array(z.enum([
    'professional', 'playful', 'serious', 'friendly',
    'authoritative', 'approachable', 'innovative', 'traditional'
  ])).optional(),
}).optional();

export const enhancedBrandKitInputSchema = z.object({
  // Existing
  businessName: z.string().min(1).max(50),
  businessDescription: z.string().min(10).max(500),
  industry: industrySchema,

  // New
  notes: z.string().max(500).optional(),

  logoOption: logoOptionSchema,
  logoBase64: z.string().optional(), // Base64 encoded file

  colorOption: colorOptionSchema,
  existingColors: existingColorPaletteSchema.optional(),

  fontOption: fontOptionSchema,
  existingFonts: existingFontsSchema.optional(),

  advancedOptions: advancedOptionsSchema,
}).superRefine((data, ctx) => {
  // Validate logo upload if option is 'upload'
  if (data.logoOption === 'upload' && !data.logoBase64) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Logo file is required when upload option is selected',
      path: ['logoBase64'],
    });
  }

  // Validate existing colors if option is 'existing'
  if (data.colorOption === 'existing' && !data.existingColors) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Existing colors are required when existing option is selected',
      path: ['existingColors'],
    });
  }

  // Validate existing fonts if option is 'existing'
  if (data.fontOption === 'existing' && !data.existingFonts) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Existing fonts are required when existing option is selected',
      path: ['existingFonts'],
    });
  }
});
```

## Edge Cases

### 1. Logo Upload Edge Cases
- **Large files**: Show error if >5MB
- **Invalid formats**: Show error for non-image files
- **Corrupted images**: Validate image can be loaded
- **SVG with scripts**: Sanitize SVG to prevent XSS

### 2. Color Palette Edge Cases
- **Invalid hex**: Validate format before submission
- **Low contrast**: Warn if primary/background contrast <4.5:1
- **Same colors**: Warn if primary === secondary

### 3. Typography Edge Cases
- **Invalid font names**: Allow any string, but warn if not in Google Fonts
- **Missing URLs**: Auto-construct Google Fonts URL if not provided
- **Same fonts**: Warn if primary === secondary

### 4. Notes Edge Cases
- **Conflicting instructions**: If notes conflict with industry/description, notes take precedence
- **Inappropriate content**: Sanitize for profanity/harmful content (basic filter)

### 5. Advanced Options Edge Cases
- **No options selected**: All optional, defaults to previous behavior
- **Conflicting styles**: E.g., "minimalist" + "bold" - AI resolves conflict

## API Contracts

### Request
```typescript
POST /api/generate-brand-kit
Content-Type: application/json

{
  "businessName": "TechVision Solutions",
  "businessDescription": "AI-powered analytics platform for enterprises",
  "industry": "tech",
  "notes": "Focus on trust and reliability. Target CTO/VP Engineering. Avoid overly playful designs.",

  "logoOption": "generate",
  "logoBase64": null,

  "colorOption": "existing",
  "existingColors": {
    "primary": "#2563EB",
    "secondary": "#7C3AED",
    "accent": "#10B981",
    "neutral": "#6B7280",
    "background": "#FFFFFF"
  },

  "fontOption": "generate",
  "existingFonts": null,

  "advancedOptions": {
    "styles": ["modern", "minimalist"],
    "colorMood": "cool",
    "targetAudience": "b2b",
    "brandTones": ["professional", "innovative"]
  }
}
```

### Response
```typescript
200 OK
Content-Type: application/json

{
  "businessName": "TechVision Solutions",
  "businessDescription": "AI-powered analytics platform for enterprises",
  "industry": "tech",
  "logo": {
    "url": "data:image/svg+xml;base64,...",
    "svgCode": "<svg>...</svg>"
  },
  "colors": {
    "primary": "#2563EB",
    "secondary": "#7C3AED",
    "accent": "#10B981",
    "neutral": "#6B7280",
    "background": "#FFFFFF"
  },
  "fonts": {
    "primary": {
      "name": "Inter",
      "family": "Inter, sans-serif",
      "url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700",
      "category": "sans-serif"
    },
    "secondary": {
      "name": "Roboto Mono",
      "family": "Roboto Mono, monospace",
      "url": "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600;700",
      "category": "monospace"
    }
  },
  "tagline": "Transform Data Into Decisions",
  "justifications": {
    "colors": "Your provided color palette...",
    "fonts": "Inter and Roboto Mono were selected...",
    "logo": "The logo design incorporates..."
  },
  "generatedAt": "2025-10-05T12:34:56Z"
}
```

## UI/UX Design

### Form Layout

```
┌──────────────────────────────────────┐
│ Tell us about your business          │
├──────────────────────────────────────┤
│                                      │
│ Business Name *                      │
│ [___________________________]        │
│                                      │
│ Business Description *               │
│ [___________________________]        │
│ [___________________________]        │
│ [___________________________]        │
│                                      │
│ Industry *                           │
│ [Technology              ▼]          │
│                                      │
│ Notes (Optional)                     │
│ Add details about your vision...     │
│ [___________________________]        │
│ [___________________________]        │
│                                      │
│ ┌────────────────────────┐           │
│ │ Logo                   │           │
│ │ ◉ Generate Logo        │           │
│ │ ○ Upload Existing Logo │           │
│ │ ○ Skip Logo            │           │
│ └────────────────────────┘           │
│                                      │
│ ┌────────────────────────┐           │
│ │ Color Palette          │           │
│ │ ◉ Generate Palette     │           │
│ │ ○ Use Existing Palette │           │
│ └────────────────────────┘           │
│                                      │
│ ┌────────────────────────┐           │
│ │ Typography             │           │
│ │ ◉ Generate Fonts       │           │
│ │ ○ Use Existing Fonts   │           │
│ └────────────────────────┘           │
│                                      │
│ ▼ Advanced Options                   │
│ (Click to expand - collapsed default)│
│                                      │
│ [Generate Brand Kit]                 │
│                                      │
└──────────────────────────────────────┘
```

### Advanced Options Expanded

```
┌──────────────────────────────────────┐
│ ▲ Advanced Options                   │
├──────────────────────────────────────┤
│                                      │
│ Style Preferences (Multi-select)     │
│ ☑ Modern  ☐ Classic  ☐ Minimalist   │
│ ☐ Bold    ☐ Playful  ☐ Elegant      │
│ ☐ Vintage ☐ Futuristic              │
│                                      │
│ Color Mood                           │
│ [Vibrant              ▼]             │
│                                      │
│ Target Audience                      │
│ [B2B                  ▼]             │
│                                      │
│ Brand Tone (Multi-select)            │
│ ☑ Professional  ☐ Playful            │
│ ☐ Serious       ☑ Innovative         │
│ ☐ Authoritative ☐ Approachable       │
│ ☐ Friendly      ☐ Traditional        │
│                                      │
└──────────────────────────────────────┘
```

### Color Palette Input (when "Use Existing" selected)

```
┌──────────────────────────────────────┐
│ Color Palette                        │
│ ○ Generate Palette                   │
│ ◉ Use Existing Palette               │
├──────────────────────────────────────┤
│                                      │
│ Primary Color *                      │
│ [#2563EB] [🎨]  ■ Preview           │
│                                      │
│ Secondary Color *                    │
│ [#7C3AED] [🎨]  ■ Preview           │
│                                      │
│ Accent Color *                       │
│ [#10B981] [🎨]  ■ Preview           │
│                                      │
│ Neutral Color *                      │
│ [#6B7280] [🎨]  ■ Preview           │
│                                      │
│ Background Color *                   │
│ [#FFFFFF] [🎨]  ■ Preview           │
│                                      │
│ ┌──────────────────────┐             │
│ │ Palette Preview      │             │
│ │ ■ ■ ■ ■ ■           │             │
│ └──────────────────────┘             │
│                                      │
└──────────────────────────────────────┘
```

## Performance Considerations

1. **File Upload**: Base64 encoding on client avoids multipart handling
2. **Conditional Generation**: Skipping logo/colors/fonts saves API calls and time
3. **Caching**: Cache uploaded logos in component state
4. **Validation**: Client-side validation before submission
5. **Lazy Loading**: Advanced options rendered only when expanded

## Security Considerations

1. **File Upload Sanitization**:
   - Validate file types (whitelist)
   - Limit file size (5MB max)
   - Sanitize SVG content (remove scripts)
   - Check image dimensions

2. **Input Sanitization**:
   - Sanitize notes field (XSS prevention)
   - Validate hex colors (regex)
   - Validate font URLs (must be Google Fonts domain)

3. **Rate Limiting**:
   - Same rate limits apply (existing system)
   - File uploads don't increase rate limit consumption

## Accessibility

1. **Logo Upload**:
   - `<input type="file">` with proper labels
   - Keyboard accessible
   - Screen reader announcements for upload status

2. **Color Pickers**:
   - Accessible color picker component
   - Keyboard navigation
   - ARIA labels for each color input
   - Text input alternative (hex value)

3. **Collapsible Section**:
   - ARIA attributes (`aria-expanded`, `aria-controls`)
   - Keyboard toggle (Enter/Space)
   - Focus management

4. **Radio Groups**:
   - Proper `<fieldset>` and `<legend>`
   - ARIA labels
   - Keyboard navigation (arrows)

## Testing Strategy

### Unit Tests
- Validation schemas (all new fields)
- Prompt enhancement function
- Base64 encoding/decoding
- Color validation
- Font URL construction

### Integration Tests
- API route with different option combinations
- File upload processing
- Conditional generation logic

### E2E Tests
- Complete flow: Generate all
- Complete flow: Upload logo + existing colors + generate fonts
- Complete flow: Skip logo + generate colors + existing fonts
- Advanced options submission
- Notes incorporation

### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- WCAG AA contrast ratios
- Focus indicators

## Migration Strategy

### Phase 1: Backend (Non-Breaking)
1. Add new fields to schema (all optional)
2. Update API route to handle new fields
3. Maintain backward compatibility (existing requests work)
4. Deploy backend changes

### Phase 2: Frontend
1. Create new components
2. Update form with new controls
3. Update form submission logic
4. Deploy frontend changes

### Phase 3: Testing & Iteration
1. Monitor usage analytics
2. Gather user feedback
3. Iterate on UX
4. Add more advanced options based on feedback

## Success Metrics

1. **Adoption**: % of users using advanced options
2. **Satisfaction**: Increase in positive feedback
3. **Retention**: Users returning to regenerate with tweaks
4. **Performance**: Generation time reduction (when skipping assets)
5. **Quality**: Subjective quality ratings of generated assets

## Future Enhancements

1. **Save & Resume**: Save partial inputs, resume later
2. **Templates**: Pre-filled advanced options for common use cases
3. **A/B Testing**: Generate multiple variations
4. **History**: View previous generations, regenerate with tweaks
5. **Export Presets**: Save advanced options as reusable presets
