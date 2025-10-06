'use client';

import * as React from 'react';
import { Upload, Image as ImageIcon, XCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateLogoFile, fileToBase64 } from '@/lib/utils/file-validation';
import type { LogoOption } from '@/types';

export interface LogoControlProps {
  value: LogoOption;
  onChange: (value: LogoOption) => void;
  onFileChange?: (base64: string | null) => void;
  logoBase64?: string | null;
  error?: string;
}

export function LogoControl({ value, onChange, onFileChange, logoBase64, error }: LogoControlProps) {
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setUploadError(null);

    // Validate file
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      onFileChange?.(base64);
    } catch (err) {
      setUploadError('Failed to process file');
      console.error('File processing error:', err);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    onFileChange?.(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Logo</Label>

      {/* Radio Group for Options */}
      <RadioGroup value={value} onValueChange={(v) => onChange(v as LogoOption)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="generate" id="logo-generate" />
          <Label htmlFor="logo-generate" className="font-normal cursor-pointer">
            Generate Logo
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="upload" id="logo-upload" />
          <Label htmlFor="logo-upload" className="font-normal cursor-pointer">
            Upload Existing Logo
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="skip" id="logo-skip" />
          <Label htmlFor="logo-skip" className="font-normal cursor-pointer">
            Skip Logo
          </Label>
        </div>
      </RadioGroup>

      {/* File Upload Area (shown when upload is selected) */}
      {value === 'upload' && (
        <div className="space-y-3">
          {!logoBase64 ? (
            <>
              <Card
                className={cn(
                  'border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary hover:bg-accent/50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="logo-file-input"
                  aria-describedby={uploadError ? 'logo-upload-error' : undefined}
                />

                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">
                      Drop your logo here or{' '}
                      <span className="text-primary">browse files</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, or SVG • Max 5MB
                    </p>
                  </div>
                </div>
              </Card>

              {uploadError && (
                <p id="logo-upload-error" className="text-sm text-destructive" role="alert">
                  {uploadError}
                </p>
              )}
            </>
          ) : (
            <Card className="p-4">
              <div className="flex items-center gap-4">
                {/* Logo Preview */}
                <div className="flex-shrink-0 w-20 h-20 border rounded flex items-center justify-center bg-muted">
                  {logoBase64 ? (
                    <img
                      src={logoBase64}
                      alt="Uploaded logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Logo uploaded successfully</p>
                  <p className="text-xs text-muted-foreground">
                    Click remove to choose a different file
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="flex-shrink-0"
                  aria-label="Remove uploaded logo"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* General Error */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
