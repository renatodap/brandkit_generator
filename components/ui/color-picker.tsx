'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, isValidHexColor } from '@/lib/utils';

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  id?: string;
}

export function ColorPicker({ label, value, onChange, error, required, id }: ColorPickerProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const [isValid, setIsValid] = React.useState(true);
  const inputId = id || `color-${label.toLowerCase().replace(/\s+/g, '-')}`;

  // Sync local value with prop value
  React.useEffect(() => {
    setLocalValue(value);
    setIsValid(isValidHexColor(value));
  }, [value]);

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Add # if missing
    const hexValue = newValue.startsWith('#') ? newValue : `#${newValue}`;

    if (isValidHexColor(hexValue)) {
      setIsValid(true);
      onChange(hexValue);
    } else {
      setIsValid(false);
    }
  };

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsValid(true);
    onChange(newValue);
  };

  const displayValue = localValue.startsWith('#') ? localValue.slice(1) : localValue;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="flex gap-2 items-center">
        {/* Native color picker */}
        <div className="relative">
          <input
            type="color"
            value={localValue}
            onChange={handleColorInput}
            className="h-10 w-14 rounded border border-input bg-background cursor-pointer"
            aria-label={`${label} color picker`}
          />
        </div>

        {/* Hex input */}
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            #
          </div>
          <Input
            id={inputId}
            type="text"
            value={displayValue}
            onChange={handleHexInput}
            placeholder="FF5733"
            maxLength={6}
            className={cn('pl-7', !isValid && 'border-destructive')}
            aria-invalid={!isValid || !!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
        </div>

        {/* Color preview */}
        <div
          className="h-10 w-10 rounded border border-input shadow-sm"
          style={{ backgroundColor: localValue }}
          aria-label={`Preview of ${label}`}
        />
      </div>

      {/* Error message */}
      {(error || !isValid) && (
        <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
          {error || 'Invalid hex color format'}
        </p>
      )}
    </div>
  );
}
