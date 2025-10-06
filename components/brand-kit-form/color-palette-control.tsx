'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ColorPicker } from '@/components/ui/color-picker';
import { Card } from '@/components/ui/card';
import type { ColorOption } from '@/types';

export interface ColorPaletteControlProps {
  value: ColorOption;
  onChange: (value: ColorOption) => void;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    background: string;
  };
  onColorsChange?: (colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    background: string;
  }) => void;
  errors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
    background?: string;
  };
}

export function ColorPaletteControl({
  value,
  onChange,
  colors = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#10B981',
    neutral: '#6B7280',
    background: '#FFFFFF',
  },
  onColorsChange,
  errors,
}: ColorPaletteControlProps) {
  const handleColorChange = (colorKey: keyof typeof colors) => (colorValue: string) => {
    onColorsChange?.({
      ...colors,
      [colorKey]: colorValue,
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Color Palette</Label>

      {/* Radio Group for Options */}
      <RadioGroup value={value} onValueChange={(v) => onChange(v as ColorOption)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="generate" id="color-generate" />
          <Label htmlFor="color-generate" className="font-normal cursor-pointer">
            Generate Palette
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="existing" id="color-existing" />
          <Label htmlFor="color-existing" className="font-normal cursor-pointer">
            Use Existing Palette
          </Label>
        </div>
      </RadioGroup>

      {/* Color Inputs (shown when existing is selected) */}
      {value === 'existing' && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker
              label="Primary Color"
              value={colors.primary}
              onChange={handleColorChange('primary')}
              error={errors?.primary}
              required
            />

            <ColorPicker
              label="Secondary Color"
              value={colors.secondary}
              onChange={handleColorChange('secondary')}
              error={errors?.secondary}
              required
            />

            <ColorPicker
              label="Accent Color"
              value={colors.accent}
              onChange={handleColorChange('accent')}
              error={errors?.accent}
              required
            />

            <ColorPicker
              label="Neutral Color"
              value={colors.neutral}
              onChange={handleColorChange('neutral')}
              error={errors?.neutral}
              required
            />

            <ColorPicker
              label="Background Color"
              value={colors.background}
              onChange={handleColorChange('background')}
              error={errors?.background}
              required
            />
          </div>

          {/* Palette Preview */}
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-2 block">Palette Preview</Label>
            <div className="flex gap-2" role="img" aria-label="Color palette preview">
              {Object.entries(colors).map(([key, color]) => (
                <div
                  key={key}
                  className="flex-1 h-12 rounded border border-input shadow-sm"
                  style={{ backgroundColor: color }}
                  title={`${key}: ${color}`}
                />
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
