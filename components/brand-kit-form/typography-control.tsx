'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import type { FontOption } from '@/types';

export interface TypographyControlProps {
  value: FontOption;
  onChange: (value: FontOption) => void;
  fonts?: {
    primary: {
      name: string;
      category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
      url?: string;
    };
    secondary: {
      name: string;
      category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
      url?: string;
    };
  };
  onFontsChange?: (fonts: {
    primary: {
      name: string;
      category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
      url?: string;
    };
    secondary: {
      name: string;
      category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
      url?: string;
    };
  }) => void;
  errors?: {
    primaryName?: string;
    primaryCategory?: string;
    primaryUrl?: string;
    secondaryName?: string;
    secondaryCategory?: string;
    secondaryUrl?: string;
  };
}

export function TypographyControl({
  value,
  onChange,
  fonts = {
    primary: {
      name: 'Inter',
      category: 'sans-serif',
      url: '',
    },
    secondary: {
      name: 'Lora',
      category: 'serif',
      url: '',
    },
  },
  onFontsChange,
  errors,
}: TypographyControlProps) {
  const handlePrimaryChange = (key: 'name' | 'category' | 'url', val: string) => {
    onFontsChange?.({
      ...fonts,
      primary: {
        ...fonts.primary,
        [key]: val,
      },
    });
  };

  const handleSecondaryChange = (key: 'name' | 'category' | 'url', val: string) => {
    onFontsChange?.({
      ...fonts,
      secondary: {
        ...fonts.secondary,
        [key]: val,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Typography</Label>

      {/* Radio Group for Options */}
      <RadioGroup value={value} onValueChange={(v) => onChange(v as FontOption)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="generate" id="font-generate" />
          <Label htmlFor="font-generate" className="font-normal cursor-pointer">
            Generate Fonts
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="existing" id="font-existing" />
          <Label htmlFor="font-existing" className="font-normal cursor-pointer">
            Use Existing Fonts
          </Label>
        </div>
      </RadioGroup>

      {/* Font Inputs (shown when existing is selected) */}
      {value === 'existing' && (
        <Card className="p-4 space-y-6">
          {/* Primary Font */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Primary Font (Headings)</Label>

            <div className="space-y-3">
              <div>
                <Label htmlFor="primary-font-name" className="text-sm">
                  Font Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="primary-font-name"
                  placeholder="e.g., Inter, Roboto, Poppins"
                  value={fonts.primary.name}
                  onChange={(e) => handlePrimaryChange('name', e.target.value)}
                  aria-invalid={!!errors?.primaryName}
                  aria-describedby={errors?.primaryName ? 'primary-name-error' : undefined}
                />
                {errors?.primaryName && (
                  <p id="primary-name-error" className="text-sm text-destructive mt-1" role="alert">
                    {errors.primaryName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="primary-font-category" className="text-sm">
                  Font Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={fonts.primary.category}
                  onValueChange={(v) => handlePrimaryChange('category', v)}
                >
                  <SelectTrigger id="primary-font-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="display">Display</SelectItem>
                    <SelectItem value="handwriting">Handwriting</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.primaryCategory && (
                  <p className="text-sm text-destructive mt-1" role="alert">
                    {errors.primaryCategory}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="primary-font-url" className="text-sm">
                  Google Fonts URL (Optional)
                </Label>
                <Input
                  id="primary-font-url"
                  type="url"
                  placeholder="https://fonts.googleapis.com/css2?family=Inter"
                  value={fonts.primary.url}
                  onChange={(e) => handlePrimaryChange('url', e.target.value)}
                  aria-invalid={!!errors?.primaryUrl}
                  aria-describedby={errors?.primaryUrl ? 'primary-url-error' : undefined}
                />
                {errors?.primaryUrl && (
                  <p id="primary-url-error" className="text-sm text-destructive mt-1" role="alert">
                    {errors.primaryUrl}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  We&apos;ll auto-generate if not provided
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Font */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-semibold">Secondary Font (Body)</Label>

            <div className="space-y-3">
              <div>
                <Label htmlFor="secondary-font-name" className="text-sm">
                  Font Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="secondary-font-name"
                  placeholder="e.g., Lora, Merriweather, Open Sans"
                  value={fonts.secondary.name}
                  onChange={(e) => handleSecondaryChange('name', e.target.value)}
                  aria-invalid={!!errors?.secondaryName}
                  aria-describedby={errors?.secondaryName ? 'secondary-name-error' : undefined}
                />
                {errors?.secondaryName && (
                  <p id="secondary-name-error" className="text-sm text-destructive mt-1" role="alert">
                    {errors.secondaryName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="secondary-font-category" className="text-sm">
                  Font Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={fonts.secondary.category}
                  onValueChange={(v) => handleSecondaryChange('category', v)}
                >
                  <SelectTrigger id="secondary-font-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="display">Display</SelectItem>
                    <SelectItem value="handwriting">Handwriting</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.secondaryCategory && (
                  <p className="text-sm text-destructive mt-1" role="alert">
                    {errors.secondaryCategory}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="secondary-font-url" className="text-sm">
                  Google Fonts URL (Optional)
                </Label>
                <Input
                  id="secondary-font-url"
                  type="url"
                  placeholder="https://fonts.googleapis.com/css2?family=Lora"
                  value={fonts.secondary.url}
                  onChange={(e) => handleSecondaryChange('url', e.target.value)}
                  aria-invalid={!!errors?.secondaryUrl}
                  aria-describedby={errors?.secondaryUrl ? 'secondary-url-error' : undefined}
                />
                {errors?.secondaryUrl && (
                  <p id="secondary-url-error" className="text-sm text-destructive mt-1" role="alert">
                    {errors.secondaryUrl}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  We&apos;ll auto-generate if not provided
                </p>
              </div>
            </div>
          </div>

          {/* Font Preview */}
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-3 block">Font Preview</Label>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Primary ({fonts.primary.name})</p>
                <p className="text-2xl font-semibold">The quick brown fox</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Secondary ({fonts.secondary.name})</p>
                <p className="text-base">The quick brown fox jumps over the lazy dog</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
