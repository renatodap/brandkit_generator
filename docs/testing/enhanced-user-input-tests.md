# Enhanced User Input - Test Design

## Test Coverage Goals
- **Overall Coverage**: ≥80%
- **Critical Paths**: 100% (API validation, file uploads, conditional generation)
- **Unit Tests**: All utility functions, validation schemas
- **Integration Tests**: API routes with different option combinations
- **E2E Tests**: Complete user flows
- **Accessibility Tests**: All new interactive components

## Test Scenarios

### 1. Validation Schema Tests (Unit)

#### 1.1 Logo Option Validation
**File**: `lib/validations.test.ts`

**Test Cases**:
```typescript
describe('logoOptionSchema', () => {
  it('should accept "generate"', () => {
    expect(logoOptionSchema.parse('generate')).toBe('generate');
  });

  it('should accept "upload"', () => {
    expect(logoOptionSchema.parse('upload')).toBe('upload');
  });

  it('should accept "skip"', () => {
    expect(logoOptionSchema.parse('skip')).toBe('skip');
  });

  it('should reject invalid values', () => {
    expect(() => logoOptionSchema.parse('invalid')).toThrow();
  });
});
```

#### 1.2 Color Palette Validation
```typescript
describe('existingColorPaletteSchema', () => {
  it('should accept valid hex colors', () => {
    const validPalette = {
      primary: '#FF5733',
      secondary: '#C70039',
      accent: '#900C3F',
      neutral: '#581845',
      background: '#FFFFFF'
    };
    expect(existingColorPaletteSchema.parse(validPalette)).toEqual(validPalette);
  });

  it('should accept 3-digit hex colors', () => {
    const validPalette = {
      primary: '#F00',
      secondary: '#0F0',
      accent: '#00F',
      neutral: '#FFF',
      background: '#000'
    };
    expect(existingColorPaletteSchema.parse(validPalette)).toBeDefined();
  });

  it('should reject invalid hex format', () => {
    const invalidPalette = {
      primary: 'FF5733', // Missing #
      secondary: '#C70039',
      accent: '#900C3F',
      neutral: '#581845',
      background: '#FFFFFF'
    };
    expect(() => existingColorPaletteSchema.parse(invalidPalette)).toThrow();
  });

  it('should reject non-hex characters', () => {
    const invalidPalette = {
      primary: '#GGGGGG',
      secondary: '#C70039',
      accent: '#900C3F',
      neutral: '#581845',
      background: '#FFFFFF'
    };
    expect(() => existingColorPaletteSchema.parse(invalidPalette)).toThrow();
  });
});
```

#### 1.3 Font Validation
```typescript
describe('existingFontsSchema', () => {
  it('should accept valid font configuration', () => {
    const validFonts = {
      primary: {
        name: 'Inter',
        category: 'sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Inter'
      },
      secondary: {
        name: 'Lora',
        category: 'serif',
        url: 'https://fonts.googleapis.com/css2?family=Lora'
      }
    };
    expect(existingFontsSchema.parse(validFonts)).toEqual(validFonts);
  });

  it('should accept fonts without URLs', () => {
    const validFonts = {
      primary: {
        name: 'Inter',
        category: 'sans-serif'
      },
      secondary: {
        name: 'Lora',
        category: 'serif'
      }
    };
    expect(existingFontsSchema.parse(validFonts)).toBeDefined();
  });

  it('should reject invalid font category', () => {
    const invalidFonts = {
      primary: {
        name: 'Inter',
        category: 'invalid-category',
        url: 'https://fonts.googleapis.com/css2?family=Inter'
      },
      secondary: {
        name: 'Lora',
        category: 'serif'
      }
    };
    expect(() => existingFontsSchema.parse(invalidFonts)).toThrow();
  });

  it('should reject non-URL font URLs', () => {
    const invalidFonts = {
      primary: {
        name: 'Inter',
        category: 'sans-serif',
        url: 'not-a-url'
      },
      secondary: {
        name: 'Lora',
        category: 'serif'
      }
    };
    expect(() => existingFontsSchema.parse(invalidFonts)).toThrow();
  });
});
```

#### 1.4 Enhanced Input Schema
```typescript
describe('enhancedBrandKitInputSchema', () => {
  const baseInput = {
    businessName: 'Test Business',
    businessDescription: 'A test business description that is long enough',
    industry: 'tech',
    logoOption: 'generate',
    colorOption: 'generate',
    fontOption: 'generate'
  };

  it('should accept minimal valid input', () => {
    expect(enhancedBrandKitInputSchema.parse(baseInput)).toBeDefined();
  });

  it('should accept input with notes', () => {
    const withNotes = {
      ...baseInput,
      notes: 'Please use ocean imagery and avoid red colors'
    };
    expect(enhancedBrandKitInputSchema.parse(withNotes)).toBeDefined();
  });

  it('should accept input with advanced options', () => {
    const withAdvanced = {
      ...baseInput,
      advancedOptions: {
        styles: ['modern', 'minimalist'],
        colorMood: 'cool',
        targetAudience: 'b2b',
        brandTones: ['professional', 'innovative']
      }
    };
    expect(enhancedBrandKitInputSchema.parse(withAdvanced)).toBeDefined();
  });

  it('should require logoBase64 when logoOption is "upload"', () => {
    const withoutLogo = {
      ...baseInput,
      logoOption: 'upload'
      // Missing logoBase64
    };
    expect(() => enhancedBrandKitInputSchema.parse(withoutLogo)).toThrow(
      /Logo file is required/
    );
  });

  it('should require existingColors when colorOption is "existing"', () => {
    const withoutColors = {
      ...baseInput,
      colorOption: 'existing'
      // Missing existingColors
    };
    expect(() => enhancedBrandKitInputSchema.parse(withoutColors)).toThrow(
      /Existing colors are required/
    );
  });

  it('should require existingFonts when fontOption is "existing"', () => {
    const withoutFonts = {
      ...baseInput,
      fontOption: 'existing'
      // Missing existingFonts
    };
    expect(() => enhancedBrandKitInputSchema.parse(withoutFonts)).toThrow(
      /Existing fonts are required/
    );
  });

  it('should reject notes longer than 500 characters', () => {
    const longNotes = 'x'.repeat(501);
    const withLongNotes = {
      ...baseInput,
      notes: longNotes
    };
    expect(() => enhancedBrandKitInputSchema.parse(withLongNotes)).toThrow();
  });
});
```

### 2. Utility Function Tests (Unit)

#### 2.1 Prompt Enhancement
**File**: `lib/utils/prompt-enhancement.test.ts`

```typescript
describe('enhancePrompt', () => {
  it('should return base prompt when no enhancements provided', () => {
    const base = 'Generate a logo for a tech company';
    expect(enhancePrompt(base)).toBe(base);
  });

  it('should append notes to prompt', () => {
    const base = 'Generate a logo';
    const notes = 'Use ocean imagery';
    const result = enhancePrompt(base, notes);
    expect(result).toContain('Additional Context: Use ocean imagery');
  });

  it('should append style preferences', () => {
    const base = 'Generate a logo';
    const options = { styles: ['modern', 'minimalist'] };
    const result = enhancePrompt(base, undefined, options);
    expect(result).toContain('Style Preferences: modern, minimalist');
  });

  it('should append all advanced options', () => {
    const base = 'Generate colors';
    const options = {
      styles: ['modern'],
      colorMood: 'cool',
      targetAudience: 'b2b',
      brandTones: ['professional']
    };
    const result = enhancePrompt(base, undefined, options);
    expect(result).toContain('Style Preferences: modern');
    expect(result).toContain('Color Mood: cool');
    expect(result).toContain('Target Audience: b2b');
    expect(result).toContain('Brand Tone: professional');
  });

  it('should combine notes and advanced options', () => {
    const base = 'Generate fonts';
    const notes = 'Target CTO audience';
    const options = {
      styles: ['minimalist'],
      targetAudience: 'b2b'
    };
    const result = enhancePrompt(base, notes, options);
    expect(result).toContain('Additional Context: Target CTO audience');
    expect(result).toContain('Style Preferences: minimalist');
    expect(result).toContain('Target Audience: b2b');
  });
});
```

#### 2.2 File Validation
**File**: `lib/utils/file-validation.test.ts`

```typescript
describe('validateLogoFile', () => {
  it('should accept PNG files under 5MB', () => {
    const file = new File(['x'.repeat(1024 * 1024)], 'logo.png', { type: 'image/png' });
    expect(validateLogoFile(file)).toEqual({ valid: true });
  });

  it('should accept JPG files under 5MB', () => {
    const file = new File(['x'.repeat(1024 * 1024)], 'logo.jpg', { type: 'image/jpeg' });
    expect(validateLogoFile(file)).toEqual({ valid: true });
  });

  it('should accept SVG files under 5MB', () => {
    const file = new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' });
    expect(validateLogoFile(file)).toEqual({ valid: true });
  });

  it('should reject files over 5MB', () => {
    const file = new File(['x'.repeat(6 * 1024 * 1024)], 'logo.png', { type: 'image/png' });
    expect(validateLogoFile(file)).toEqual({
      valid: false,
      error: 'File size must be under 5MB'
    });
  });

  it('should reject non-image files', () => {
    const file = new File(['content'], 'logo.pdf', { type: 'application/pdf' });
    expect(validateLogoFile(file)).toEqual({
      valid: false,
      error: 'File must be PNG, JPG, or SVG'
    });
  });
});
```

### 3. API Integration Tests

#### 3.1 Logo Generation Options
**File**: `app/api/generate-brand-kit/route.test.ts`

```typescript
describe('POST /api/generate-brand-kit - Logo Options', () => {
  it('should generate logo when logoOption is "generate"', async () => {
    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'generate',
      colorOption: 'generate',
      fontOption: 'generate'
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.logo).toBeDefined();
    expect(data.logo.url).toMatch(/^data:image/);
  });

  it('should use uploaded logo when logoOption is "upload"', async () => {
    const base64Logo = 'data:image/png;base64,iVBORw0KGgo...';
    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'upload',
      logoBase64: base64Logo,
      colorOption: 'generate',
      fontOption: 'generate'
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.logo.url).toBe(base64Logo);
    expect(data.logo.svgCode).toBeUndefined();
  });

  it('should skip logo when logoOption is "skip"', async () => {
    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'skip',
      colorOption: 'generate',
      fontOption: 'generate'
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.logo).toBeNull();
  });
});
```

#### 3.2 Color Palette Options
```typescript
describe('POST /api/generate-brand-kit - Color Options', () => {
  it('should generate colors when colorOption is "generate"', async () => {
    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'skip',
      colorOption: 'generate',
      fontOption: 'generate'
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.colors).toBeDefined();
    expect(data.colors.primary).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should use existing colors when colorOption is "existing"', async () => {
    const existingColors = {
      primary: '#FF5733',
      secondary: '#C70039',
      accent: '#900C3F',
      neutral: '#581845',
      background: '#FFFFFF'
    };

    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'skip',
      colorOption: 'existing',
      existingColors,
      fontOption: 'generate'
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.colors).toEqual(existingColors);
  });
});
```

#### 3.3 Typography Options
```typescript
describe('POST /api/generate-brand-kit - Font Options', () => {
  it('should generate fonts when fontOption is "generate"', async () => {
    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'skip',
      colorOption: 'generate',
      fontOption: 'generate'
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.fonts).toBeDefined();
    expect(data.fonts.primary.name).toBeDefined();
    expect(data.fonts.secondary.name).toBeDefined();
  });

  it('should use existing fonts when fontOption is "existing"', async () => {
    const existingFonts = {
      primary: {
        name: 'Inter',
        category: 'sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Inter'
      },
      secondary: {
        name: 'Lora',
        category: 'serif',
        url: 'https://fonts.googleapis.com/css2?family=Lora'
      }
    };

    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'skip',
      colorOption: 'generate',
      fontOption: 'existing',
      existingFonts
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.fonts.primary.name).toBe('Inter');
    expect(data.fonts.secondary.name).toBe('Lora');
  });
});
```

#### 3.4 Notes and Advanced Options
```typescript
describe('POST /api/generate-brand-kit - Notes & Advanced Options', () => {
  it('should incorporate notes into generation', async () => {
    const input = {
      businessName: 'OceanTech',
      businessDescription: 'Marine technology company',
      industry: 'tech',
      notes: 'Use blue ocean colors and wave imagery',
      logoOption: 'generate',
      colorOption: 'generate',
      fontOption: 'generate'
    };

    // Mock the AI generation functions to verify they receive enhanced prompts
    const generateLogoSpy = vi.spyOn(require('@/lib/api/groq-logo'), 'generateLogoWithGroq');

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    expect(response.status).toBe(200);
    // Verify the spy was called with prompt containing notes
    expect(generateLogoSpy).toHaveBeenCalled();
  });

  it('should use advanced options in generation', async () => {
    const input = {
      businessName: 'ModernCo',
      businessDescription: 'Modern design company',
      industry: 'creative',
      logoOption: 'generate',
      colorOption: 'generate',
      fontOption: 'generate',
      advancedOptions: {
        styles: ['modern', 'minimalist'],
        colorMood: 'cool',
        targetAudience: 'b2b',
        brandTones: ['professional', 'innovative']
      }
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    expect(response.status).toBe(200);
  });
});
```

#### 3.5 Validation Errors
```typescript
describe('POST /api/generate-brand-kit - Validation', () => {
  it('should return 400 when logoBase64 missing for upload option', async () => {
    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'upload',
      // Missing logoBase64
      colorOption: 'generate',
      fontOption: 'generate'
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid input');
  });

  it('should return 400 when existingColors missing for existing option', async () => {
    const input = {
      businessName: 'TechCo',
      businessDescription: 'A technology company',
      industry: 'tech',
      logoOption: 'skip',
      colorOption: 'existing',
      // Missing existingColors
      fontOption: 'generate'
    };

    const response = await POST(new Request('http://localhost/api/generate-brand-kit', {
      method: 'POST',
      body: JSON.stringify(input)
    }));

    expect(response.status).toBe(400);
  });
});
```

### 4. Component Tests (Unit/Integration)

#### 4.1 LogoControl Component
**File**: `components/brand-kit-form/logo-control.test.tsx`

```typescript
describe('LogoControl', () => {
  it('should render with default "generate" option', () => {
    render(<LogoControl value="generate" onChange={() => {}} />);
    expect(screen.getByLabelText('Generate Logo')).toBeChecked();
  });

  it('should switch to upload option when clicked', async () => {
    const handleChange = vi.fn();
    render(<LogoControl value="generate" onChange={handleChange} />);

    await userEvent.click(screen.getByLabelText('Upload Existing Logo'));
    expect(handleChange).toHaveBeenCalledWith('upload');
  });

  it('should show file input when upload option selected', () => {
    render(<LogoControl value="upload" onChange={() => {}} onFileChange={() => {}} />);
    expect(screen.getByLabelText('Upload logo file')).toBeInTheDocument();
  });

  it('should validate file size on upload', async () => {
    const handleFileChange = vi.fn();
    render(<LogoControl value="upload" onChange={() => {}} onFileChange={handleFileChange} />);

    // Create file >5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'logo.png', { type: 'image/png' });
    const input = screen.getByLabelText('Upload logo file');

    await userEvent.upload(input, largeFile);

    expect(screen.getByText(/File size must be under 5MB/)).toBeInTheDocument();
    expect(handleFileChange).not.toHaveBeenCalled();
  });

  it('should accept valid file', async () => {
    const handleFileChange = vi.fn();
    render(<LogoControl value="upload" onChange={() => {}} onFileChange={handleFileChange} />);

    const validFile = new File(['content'], 'logo.png', { type: 'image/png' });
    const input = screen.getByLabelText('Upload logo file');

    await userEvent.upload(input, validFile);

    expect(handleFileChange).toHaveBeenCalledWith(validFile);
  });

  it('should be keyboard accessible', async () => {
    render(<LogoControl value="generate" onChange={() => {}} />);

    const generateOption = screen.getByLabelText('Generate Logo');
    const uploadOption = screen.getByLabelText('Upload Existing Logo');

    expect(generateOption).toHaveFocus();

    await userEvent.tab();
    expect(uploadOption).toHaveFocus();
  });
});
```

#### 4.2 ColorPaletteControl Component
```typescript
describe('ColorPaletteControl', () => {
  it('should render with default "generate" option', () => {
    render(<ColorPaletteControl value="generate" onChange={() => {}} />);
    expect(screen.getByLabelText('Generate Palette')).toBeChecked();
  });

  it('should show color inputs when existing option selected', () => {
    render(<ColorPaletteControl value="existing" onChange={() => {}} onColorsChange={() => {}} />);

    expect(screen.getByLabelText('Primary Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Secondary Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Accent Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Neutral Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Background Color')).toBeInTheDocument();
  });

  it('should validate hex color format', async () => {
    const handleColorsChange = vi.fn();
    render(<ColorPaletteControl value="existing" onChange={() => {}} onColorsChange={handleColorsChange} />);

    const primaryInput = screen.getByLabelText('Primary Color');
    await userEvent.type(primaryInput, 'invalid');

    expect(screen.getByText(/Invalid hex color format/)).toBeInTheDocument();
  });

  it('should accept valid hex colors', async () => {
    const handleColorsChange = vi.fn();
    render(<ColorPaletteControl value="existing" onChange={() => {}} onColorsChange={handleColorsChange} />);

    const primaryInput = screen.getByLabelText('Primary Color');
    await userEvent.type(primaryInput, '#FF5733');

    expect(handleColorsChange).toHaveBeenCalledWith(expect.objectContaining({
      primary: '#FF5733'
    }));
  });

  it('should show palette preview', () => {
    const colors = {
      primary: '#FF5733',
      secondary: '#C70039',
      accent: '#900C3F',
      neutral: '#581845',
      background: '#FFFFFF'
    };

    render(
      <ColorPaletteControl
        value="existing"
        onChange={() => {}}
        onColorsChange={() => {}}
        colors={colors}
      />
    );

    expect(screen.getByTestId('palette-preview')).toBeInTheDocument();
  });
});
```

#### 4.3 AdvancedOptions Component
```typescript
describe('AdvancedOptions', () => {
  it('should render collapsed by default', () => {
    render(<AdvancedOptions onChange={() => {}} />);

    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
    expect(screen.queryByLabelText('Style Preferences')).not.toBeVisible();
  });

  it('should expand when clicked', async () => {
    render(<AdvancedOptions onChange={() => {}} />);

    await userEvent.click(screen.getByText('Advanced Options'));

    expect(screen.getByLabelText('Style Preferences')).toBeVisible();
    expect(screen.getByLabelText('Color Mood')).toBeVisible();
    expect(screen.getByLabelText('Target Audience')).toBeVisible();
    expect(screen.getByLabelText('Brand Tone')).toBeVisible();
  });

  it('should allow multi-select for styles', async () => {
    const handleChange = vi.fn();
    render(<AdvancedOptions onChange={handleChange} />);

    await userEvent.click(screen.getByText('Advanced Options'));

    const modernCheckbox = screen.getByLabelText('Modern');
    const minimalistCheckbox = screen.getByLabelText('Minimalist');

    await userEvent.click(modernCheckbox);
    await userEvent.click(minimalistCheckbox);

    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      styles: ['modern', 'minimalist']
    }));
  });

  it('should be keyboard accessible', async () => {
    render(<AdvancedOptions onChange={() => {}} />);

    const trigger = screen.getByRole('button', { name: /Advanced Options/ });

    // Trigger should be focusable
    trigger.focus();
    expect(trigger).toHaveFocus();

    // Should expand with Enter
    await userEvent.keyboard('{Enter}');
    expect(screen.getByLabelText('Style Preferences')).toBeVisible();

    // Should expand with Space
    await userEvent.keyboard(' ');
    expect(screen.getByLabelText('Style Preferences')).not.toBeVisible();
  });

  it('should have proper ARIA attributes', () => {
    render(<AdvancedOptions onChange={() => {}} />);

    const trigger = screen.getByRole('button', { name: /Advanced Options/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
```

### 5. E2E Tests (Playwright)

#### 5.1 Complete Flow - Generate All
**File**: `e2e/brand-kit-generation.spec.ts`

```typescript
test('should generate complete brand kit with all options', async ({ page }) => {
  await page.goto('/');

  // Fill in basic info
  await page.fill('[name="businessName"]', 'TechVision');
  await page.fill('[name="businessDescription"]', 'An innovative AI-powered analytics platform');
  await page.selectOption('[name="industry"]', 'tech');

  // Add notes
  await page.fill('[name="notes"]', 'Focus on trust and reliability');

  // Keep default options (generate all)
  await expect(page.locator('text=Generate Logo')).toBeChecked();
  await expect(page.locator('text=Generate Palette')).toBeChecked();
  await expect(page.locator('text=Generate Fonts')).toBeChecked();

  // Expand advanced options
  await page.click('text=Advanced Options');

  // Select advanced options
  await page.check('text=Modern');
  await page.check('text=Minimalist');
  await page.selectOption('[name="colorMood"]', 'cool');
  await page.selectOption('[name="targetAudience"]', 'b2b');
  await page.check('text=Professional');

  // Submit
  await page.click('button:has-text("Generate Brand Kit")');

  // Wait for navigation to results page
  await page.waitForURL('/results');

  // Verify results
  await expect(page.locator('[data-testid="logo-preview"]')).toBeVisible();
  await expect(page.locator('[data-testid="color-palette"]')).toBeVisible();
  await expect(page.locator('[data-testid="typography-preview"]')).toBeVisible();
  await expect(page.locator('[data-testid="tagline"]')).toBeVisible();
});
```

#### 5.2 Complete Flow - Upload Logo
```typescript
test('should upload logo and generate other assets', async ({ page }) => {
  await page.goto('/');

  await page.fill('[name="businessName"]', 'ExistingBrand');
  await page.fill('[name="businessDescription"]', 'A company with an existing logo');
  await page.selectOption('[name="industry"]', 'tech');

  // Switch to upload logo
  await page.check('text=Upload Existing Logo');

  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-fixtures/logo.png');

  // Verify preview
  await expect(page.locator('[data-testid="logo-preview"]')).toBeVisible();

  // Submit
  await page.click('button:has-text("Generate Brand Kit")');

  await page.waitForURL('/results');

  // Verify uploaded logo is used
  const logoSrc = await page.locator('[data-testid="logo-preview"] img').getAttribute('src');
  expect(logoSrc).toMatch(/^data:image/);
});
```

#### 5.3 Complete Flow - Existing Colors and Fonts
```typescript
test('should use existing colors and fonts', async ({ page }) => {
  await page.goto('/');

  await page.fill('[name="businessName"]', 'BrandWithAssets');
  await page.fill('[name="businessDescription"]', 'A company with established brand assets');
  await page.selectOption('[name="industry"]', 'tech');

  // Skip logo
  await page.check('text=Skip Logo');

  // Use existing palette
  await page.check('text=Use Existing Palette');
  await page.fill('[name="existingColors.primary"]', '#2563EB');
  await page.fill('[name="existingColors.secondary"]', '#7C3AED');
  await page.fill('[name="existingColors.accent"]', '#10B981');
  await page.fill('[name="existingColors.neutral"]', '#6B7280');
  await page.fill('[name="existingColors.background"]', '#FFFFFF');

  // Use existing fonts
  await page.check('text=Use Existing Fonts');
  await page.fill('[name="existingFonts.primary.name"]', 'Inter');
  await page.selectOption('[name="existingFonts.primary.category"]', 'sans-serif');
  await page.fill('[name="existingFonts.secondary.name"]', 'Lora');
  await page.selectOption('[name="existingFonts.secondary.category"]', 'serif');

  // Submit
  await page.click('button:has-text("Generate Brand Kit")');

  await page.waitForURL('/results');

  // Verify existing assets are used
  await expect(page.locator('text=#2563EB')).toBeVisible();
  await expect(page.locator('text=Inter')).toBeVisible();
  await expect(page.locator('text=Lora')).toBeVisible();
});
```

### 6. Accessibility Tests

```typescript
describe('Accessibility - Enhanced Form', () => {
  it('should have no violations (axe-core)', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    render(<HomePage />);
    const headings = screen.getAllByRole('heading');
    expect(headings[0].tagName).toBe('H1');
    expect(headings[1].tagName).toBe('H2');
  });

  it('should have labels for all inputs', () => {
    render(<HomePage />);

    expect(screen.getByLabelText('Business Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Business Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Industry')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument();
  });

  it('should indicate required fields', () => {
    render(<HomePage />);

    expect(screen.getByLabelText(/Business Name.*\*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Description.*\*/)).toBeInTheDocument();
  });

  it('should have sufficient color contrast', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container, {
      rules: ['color-contrast']
    });
    expect(results).toHaveNoViolations();
  });
});
```

## Test Data

### Mock Data
**File**: `test-utils/mock-data.ts`

```typescript
export const mockBrandKitInput = {
  businessName: 'TechVision',
  businessDescription: 'An innovative AI-powered analytics platform for enterprises',
  industry: 'tech',
  notes: 'Focus on trust and reliability',
  logoOption: 'generate',
  colorOption: 'generate',
  fontOption: 'generate',
  advancedOptions: {
    styles: ['modern', 'minimalist'],
    colorMood: 'cool',
    targetAudience: 'b2b',
    brandTones: ['professional', 'innovative']
  }
};

export const mockExistingColors = {
  primary: '#2563EB',
  secondary: '#7C3AED',
  accent: '#10B981',
  neutral: '#6B7280',
  background: '#FFFFFF'
};

export const mockExistingFonts = {
  primary: {
    name: 'Inter',
    category: 'sans-serif',
    url: 'https://fonts.googleapis.com/css2?family=Inter'
  },
  secondary: {
    name: 'Lora',
    category: 'serif',
    url: 'https://fonts.googleapis.com/css2?family=Lora'
  }
};

export const mockBase64Logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
```

## Coverage Targets

### By File Type
- **Validation Schemas**: 100%
- **Utility Functions**: 100%
- **API Routes**: ≥90%
- **Components**: ≥85%
- **E2E Flows**: Critical paths covered

### By Feature
- **Logo Upload**: 100% (critical path)
- **Color Input**: ≥90%
- **Font Input**: ≥90%
- **Notes**: ≥80%
- **Advanced Options**: ≥80%

## Test Execution Strategy

### Local Development
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- logo-control.test.tsx

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
- name: Unit & Integration Tests
  run: npm test -- --coverage --ci

- name: E2E Tests
  run: npm run test:e2e

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-Commit Hook
```bash
# .husky/pre-commit
npm test -- --bail --findRelatedTests
```

## Test Maintenance

### When to Update Tests
1. When adding new validation rules
2. When modifying API contracts
3. When changing component behavior
4. When fixing bugs (add regression test)

### Test Review Checklist
- [ ] All test files follow naming convention: `*.test.ts(x)`
- [ ] Each test has descriptive name (should...)
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Accessibility tested
- [ ] Mock data realistic
- [ ] Tests run independently (no shared state)
- [ ] Tests are deterministic (no flaky tests)

## Expected Test Counts

- **Unit Tests**: ~50 tests
- **Integration Tests**: ~20 tests
- **E2E Tests**: ~10 tests
- **Accessibility Tests**: ~15 tests

**Total**: ~95 tests

Target execution time: <30 seconds (unit + integration), <2 minutes (E2E)
