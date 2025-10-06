'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type {
  AdvancedOptions as AdvancedOptionsType,
  StylePreference,
  ColorMood,
  TargetAudience,
  BrandTone,
} from '@/types';

export interface AdvancedOptionsProps {
  value?: AdvancedOptionsType;
  onChange?: (value: AdvancedOptionsType) => void;
}

const styleOptions: { value: StylePreference; label: string }[] = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'bold', label: 'Bold' },
  { value: 'playful', label: 'Playful' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'futuristic', label: 'Futuristic' },
];

const colorMoodOptions: { value: ColorMood; label: string }[] = [
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'muted', label: 'Muted' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'earth', label: 'Earth Tones' },
  { value: 'neon', label: 'Neon' },
];

const targetAudienceOptions: { value: TargetAudience; label: string }[] = [
  { value: 'b2b', label: 'B2B (Business to Business)' },
  { value: 'b2c', label: 'B2C (Business to Consumer)' },
  { value: 'gen-z', label: 'Gen Z (1997-2012)' },
  { value: 'millennial', label: 'Millennials (1981-1996)' },
  { value: 'gen-x', label: 'Gen X (1965-1980)' },
  { value: 'boomer', label: 'Boomers (1946-1964)' },
  { value: 'luxury', label: 'Luxury Market' },
  { value: 'budget', label: 'Budget-Conscious' },
];

const brandToneOptions: { value: BrandTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'playful', label: 'Playful' },
  { value: 'serious', label: 'Serious' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'approachable', label: 'Approachable' },
  { value: 'innovative', label: 'Innovative' },
  { value: 'traditional', label: 'Traditional' },
];

export function AdvancedOptions({ value = {}, onChange }: AdvancedOptionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleStyleToggle = (style: StylePreference) => {
    const currentStyles = value.styles || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter((s) => s !== style)
      : [...currentStyles, style];

    onChange?.({
      ...value,
      styles: newStyles.length > 0 ? newStyles : undefined,
    });
  };

  const handleColorMoodChange = (mood: ColorMood) => {
    onChange?.({
      ...value,
      colorMood: mood,
    });
  };

  const handleTargetAudienceChange = (audience: TargetAudience) => {
    onChange?.({
      ...value,
      targetAudience: audience,
    });
  };

  const handleBrandToneToggle = (tone: BrandTone) => {
    const currentTones = value.brandTones || [];
    const newTones = currentTones.includes(tone)
      ? currentTones.filter((t) => t !== tone)
      : [...currentTones, tone];

    onChange?.({
      ...value,
      brandTones: newTones.length > 0 ? newTones : undefined,
    });
  };

  const handleClearAll = () => {
    onChange?.({
      styles: undefined,
      colorMood: undefined,
      targetAudience: undefined,
      brandTones: undefined,
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
            aria-expanded={isOpen}
            aria-controls="advanced-options-content"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
              aria-hidden="true"
            />
            Advanced Options
          </button>
        </CollapsibleTrigger>

        {isOpen && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <CollapsibleContent id="advanced-options-content" className="space-y-6 pt-4">
        {/* Style Preferences */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Style Preferences</Label>
          <p className="text-xs text-muted-foreground">
            Select one or more styles that align with your brand vision
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {styleOptions.map((style) => (
              <div key={style.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`style-${style.value}`}
                  checked={value.styles?.includes(style.value) || false}
                  onCheckedChange={() => handleStyleToggle(style.value)}
                />
                <Label
                  htmlFor={`style-${style.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {style.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Color Mood */}
        <div className="space-y-3">
          <Label htmlFor="color-mood" className="text-sm font-semibold">
            Color Mood
          </Label>
          <p className="text-xs text-muted-foreground">
            Choose the overall color vibe for your brand palette
          </p>
          <Select
            value={value.colorMood}
            onValueChange={(v) => handleColorMoodChange(v as ColorMood)}
          >
            <SelectTrigger id="color-mood">
              <SelectValue placeholder="Select color mood (optional)" />
            </SelectTrigger>
            <SelectContent>
              {colorMoodOptions.map((mood) => (
                <SelectItem key={mood.value} value={mood.value}>
                  {mood.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target Audience */}
        <div className="space-y-3">
          <Label htmlFor="target-audience" className="text-sm font-semibold">
            Target Audience
          </Label>
          <p className="text-xs text-muted-foreground">
            Who is your primary target market?
          </p>
          <Select
            value={value.targetAudience}
            onValueChange={(v) => handleTargetAudienceChange(v as TargetAudience)}
          >
            <SelectTrigger id="target-audience">
              <SelectValue placeholder="Select target audience (optional)" />
            </SelectTrigger>
            <SelectContent>
              {targetAudienceOptions.map((audience) => (
                <SelectItem key={audience.value} value={audience.value}>
                  {audience.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand Tone */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Brand Tone</Label>
          <p className="text-xs text-muted-foreground">
            Select the personality traits that best represent your brand
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {brandToneOptions.map((tone) => (
              <div key={tone.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`tone-${tone.value}`}
                  checked={value.brandTones?.includes(tone.value) || false}
                  onCheckedChange={() => handleBrandToneToggle(tone.value)}
                />
                <Label
                  htmlFor={`tone-${tone.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {tone.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
