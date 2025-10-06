'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Download, ArrowLeft, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BrandKit } from '@/types';
import { getTextColor, formatFileName } from '@/lib/utils';

export default function BrandKitResultsPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params['companySlug'] as string;
  const brandKitId = params['id'] as string;

  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [regeneratingComponent, setRegeneratingComponent] = useState<string | null>(null);

  useEffect(() => {
    // Try to load from localStorage first (for newly generated kits)
    const stored = localStorage.getItem('brandKit');
    if (stored) {
      try {
        const parsed: BrandKit = JSON.parse(stored);
        setBrandKit(parsed);
        return;
      } catch (error) {
        console.error('Failed to parse stored brand kit:', error);
      }
    }

    // If not in localStorage and we have a valid ID, fetch from API
    if (brandKitId && brandKitId !== 'new') {
      fetchBrandKit(brandKitId);
    } else {
      // Redirect to tool page if no brand kit data available
      router.push(`/dashboard/${companySlug}/tools/brand-kit`);
    }
  }, [brandKitId, companySlug, router]);

  const fetchBrandKit = async (id: string) => {
    try {
      const response = await fetch(`/api/brand-kits/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch brand kit');
      }

      const data = await response.json();

      // Transform database format to BrandKit type
      const transformedBrandKit: BrandKit = {
        businessName: data.business_name,
        businessDescription: data.business_description || '',
        industry: data.industry || 'tech',
        tagline: data.tagline || '',
        logo: data.logo_svg ? {
          url: data.logo_url,
          svgCode: data.logo_svg,
        } : { url: data.logo_url },
        colors: data.colors,
        fonts: data.fonts,
        justifications: {
          logo: data.design_justification || '',
          colors: '',
          fonts: '',
        },
        generatedAt: data.created_at,
      };

      setBrandKit(transformedBrandKit);
    } catch (error) {
      console.error('Error fetching brand kit:', error);
      toast.error('Failed to load brand kit');
      router.push(`/dashboard/${companySlug}/tools/brand-kit`);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedColor(text);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const regenerateBrandKit = async () => {
    if (!brandKit) return;

    setIsRegenerating(true);
    toast.info('Regenerating your brand kit...');

    try {
      const response = await fetch('/api/generate-brand-kit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: brandKit.businessName,
          businessDescription: brandKit.businessDescription,
          industry: brandKit.industry,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to regenerate brand kit');
      }

      const newBrandKit: BrandKit = await response.json();

      // Update state and localStorage
      setBrandKit(newBrandKit);
      localStorage.setItem('brandKit', JSON.stringify(newBrandKit));

      toast.success('Brand kit regenerated successfully!');
    } catch (error) {
      console.error('Regeneration error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate brand kit');
    } finally {
      setIsRegenerating(false);
    }
  };

  const regenerateComponent = async (component: 'logo' | 'colors' | 'fonts' | 'tagline') => {
    if (!brandKit) return;

    setRegeneratingComponent(component);
    const componentLabels = {
      logo: 'Logo',
      colors: 'Color palette',
      fonts: 'Typography',
      tagline: 'Tagline',
    };
    toast.info(`Regenerating ${componentLabels[component]}...`);

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component,
          brandKit: {
            businessName: brandKit.businessName,
            businessDescription: brandKit.businessDescription,
            industry: brandKit.industry,
            colors: brandKit.colors,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to regenerate ${component}`);
      }

      const updatedComponent = await response.json();

      // Merge the updated component with existing brand kit
      const updatedBrandKit = {
        ...brandKit,
        ...updatedComponent,
        justifications: {
          ...brandKit.justifications,
          ...updatedComponent.justifications,
        },
      };

      // Update state and localStorage
      setBrandKit(updatedBrandKit);
      localStorage.setItem('brandKit', JSON.stringify(updatedBrandKit));

      toast.success(`${componentLabels[component]} regenerated successfully!`);
    } catch (error) {
      console.error(`${component} regeneration error:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to regenerate ${component}`);
    } finally {
      setRegeneratingComponent(null);
    }
  };

  const downloadBrandKit = async () => {
    if (!brandKit) return;

    setIsDownloading(true);

    try {
      const zip = new JSZip();

      // Add logo file (SVG or PNG) if exists
      if (brandKit.logo?.url) {
        try {
          if (brandKit.logo.svgCode) {
            zip.file('logo.svg', brandKit.logo.svgCode);
          }

          if (brandKit.logo.url.startsWith('data:image/svg')) {
            const base64Data = brandKit.logo.url.split(',')[1];
            if (base64Data && !brandKit.logo.svgCode) {
              const svgContent = Buffer.from(base64Data, 'base64').toString('utf-8');
              zip.file('logo.svg', svgContent);
            }
          } else if (brandKit.logo.url.startsWith('data:')) {
            const base64Data = brandKit.logo.url.split(',')[1];
            if (base64Data) {
              zip.file('logo.png', base64Data, { base64: true });
            }
          }
        } catch (error) {
          console.error('Failed to add logo to download:', error);
          toast.warning('Logo could not be included in the download');
        }
      }

      // Create brand kit info text file
      const brandKitInfo = `
${brandKit.businessName} - Brand Kit
Generated: ${new Date(brandKit.generatedAt).toLocaleString()}

═══════════════════════════════════════════════════════════════

TAGLINE:
${brandKit.tagline}

═══════════════════════════════════════════════════════════════

COLOR PALETTE:
Primary:    ${brandKit.colors.primary}
Secondary:  ${brandKit.colors.secondary}
Accent:     ${brandKit.colors.accent}
Neutral:    ${brandKit.colors.neutral}
Background: ${brandKit.colors.background}

${brandKit.justifications?.colors ? `Why these colors?\n${brandKit.justifications.colors}\n` : ''}
═══════════════════════════════════════════════════════════════

TYPOGRAPHY:
Primary Font:   ${brandKit.fonts.primary.name} (${brandKit.fonts.primary.category})
                ${brandKit.fonts.primary.url}

Secondary Font: ${brandKit.fonts.secondary.name} (${brandKit.fonts.secondary.category})
                ${brandKit.fonts.secondary.url}

${brandKit.justifications?.fonts ? `Why these fonts?\n${brandKit.justifications.fonts}\n` : ''}
═══════════════════════════════════════════════════════════════

INDUSTRY: ${brandKit.industry.charAt(0).toUpperCase() + brandKit.industry.slice(1)}

⚠️  DISCLAIMER:
These assets are AI-generated and should be reviewed before commercial use.
Check for trademark conflicts and ensure compliance with your industry regulations.

Generated with Brand Kit Generator
Powered by AI
      `.trim();

      zip.file('brand-kit-info.txt', brandKitInfo);

      // Create HTML preview
      const htmlPreview = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brandKit.businessName} - Brand Kit Preview</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${brandKit.fonts.primary.url}" rel="stylesheet">
    <link href="${brandKit.fonts.secondary.url}" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${brandKit.fonts.secondary.family}; line-height: 1.6; color: #1a1a1a; background: #f5f5f5; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 3rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { font-family: ${brandKit.fonts.primary.family}; }
        h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: ${brandKit.colors.primary}; }
        .tagline { font-size: 1.25rem; color: #666; margin-bottom: 3rem; font-style: italic; }
        .section { margin-bottom: 3rem; }
        h2 { font-size: 1.75rem; margin-bottom: 1.5rem; color: #333; border-bottom: 3px solid ${brandKit.colors.primary}; padding-bottom: 0.5rem; }
        .color-palette { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
        .color-swatch { text-align: center; }
        .color-box { height: 100px; border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid #e0e0e0; }
        .color-name { font-weight: 600; margin-bottom: 0.25rem; }
        .color-code { font-family: monospace; color: #666; }
        .font-pair { background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
        .font-preview { font-size: 2rem; margin-bottom: 0.5rem; }
        .font-details { color: #666; font-size: 0.875rem; }
        .disclaimer { background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin-top: 3rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${brandKit.businessName}</h1>
        <p class="tagline">${brandKit.tagline}</p>

        <div class="section">
            <h2>Color Palette</h2>
            <div class="color-palette">
                ${Object.entries(brandKit.colors).map(([name, color]) => `
                <div class="color-swatch">
                    <div class="color-box" style="background-color: ${color}"></div>
                    <div class="color-name">${name.charAt(0).toUpperCase() + name.slice(1)}</div>
                    <div class="color-code">${color}</div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>Typography</h2>
            <div class="font-pair">
                <div class="font-preview" style="font-family: ${brandKit.fonts.primary.family}">${brandKit.fonts.primary.name}</div>
                <div class="font-details">Primary Font • ${brandKit.fonts.primary.category}</div>
            </div>
            <div class="font-pair">
                <div class="font-preview" style="font-family: ${brandKit.fonts.secondary.family}">${brandKit.fonts.secondary.name}</div>
                <div class="font-details">Secondary Font • ${brandKit.fonts.secondary.category}</div>
            </div>
        </div>

        <div class="disclaimer">
            <strong>⚠️ Disclaimer:</strong> These assets are AI-generated and should be reviewed before commercial use.
        </div>
    </div>
</body>
</html>
      `.trim();

      zip.file('brand-kit-preview.html', htmlPreview);

      // Generate and download ZIP file
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = formatFileName(brandKit.businessName, 'zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Brand kit downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download brand kit');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!brandKit) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading brand kit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/${companySlug}/tools/brand-kit`)}
          aria-label="Go back to brand kit tool"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Create Another
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={regenerateBrandKit}
            disabled={isRegenerating}
            variant="outline"
            aria-label="Regenerate brand kit"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
          <Button onClick={downloadBrandKit} disabled={isDownloading} aria-label="Download brand kit">
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download Kit'}
          </Button>
        </div>
      </div>

      {/* Brand Kit Display */}
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Logo & Tagline */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl">{brandKit.businessName}</CardTitle>
                <CardDescription className="text-lg mt-2">{brandKit.tagline}</CardDescription>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateComponent('tagline')}
                  disabled={regeneratingComponent === 'tagline'}
                  aria-label="Regenerate tagline"
                >
                  <RefreshCw className={`h-4 w-4 ${regeneratingComponent === 'tagline' ? 'animate-spin' : ''}`} />
                </Button>
                {brandKit.logo?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regenerateComponent('logo')}
                    disabled={regeneratingComponent === 'logo'}
                    aria-label="Regenerate logo"
                  >
                    <RefreshCw className={`h-4 w-4 ${regeneratingComponent === 'logo' ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {brandKit.logo?.url ? (
              <>
                <div className="flex justify-center p-8 bg-muted rounded-lg" data-testid="logo-preview">
                  <img
                    src={brandKit.logo.url}
                    alt={`${brandKit.businessName} logo`}
                    className="max-w-md w-full h-auto"
                  />
                </div>
                {brandKit.justifications?.logo && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground font-semibold mb-2">
                      Design Quality Assessment
                    </p>
                    <p className="text-sm">{brandKit.justifications.logo}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg text-muted-foreground">
                <p className="text-sm">
                  {brandKit.justifications?.logo === 'Logo generation skipped'
                    ? 'Logo generation was skipped'
                    : 'No logo available'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Color Palette</CardTitle>
                <CardDescription>Click any color to copy the hex code</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateComponent('colors')}
                disabled={regeneratingComponent === 'colors'}
                aria-label="Regenerate color palette"
              >
                <RefreshCw className={`h-4 w-4 ${regeneratingComponent === 'colors' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(brandKit.colors).map(([name, color]) => {
                const textColor = getTextColor(color);
                return (
                  <button
                    key={name}
                    onClick={() => copyToClipboard(color, name)}
                    className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={`Copy ${name} color ${color}`}
                  >
                    <div
                      className="aspect-square flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      {copiedColor === color ? (
                        <Check className={`h-8 w-8 ${textColor === 'light' ? 'text-white' : 'text-black'}`} />
                      ) : (
                        <Copy className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${textColor === 'light' ? 'text-white' : 'text-black'}`} />
                      )}
                    </div>
                    <div className="p-2 bg-background">
                      <p className="font-semibold text-sm capitalize">{name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{color}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {brandKit.justifications?.colors && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground font-semibold mb-2">Why these colors?</p>
                <p className="text-sm">{brandKit.justifications.colors}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Font pairing for your brand</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateComponent('fonts')}
                disabled={regeneratingComponent === 'fonts'}
                aria-label="Regenerate typography"
              >
                <RefreshCw className={`h-4 w-4 ${regeneratingComponent === 'fonts' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Load fonts */}
            <link rel="stylesheet" href={brandKit.fonts.primary.url} />
            <link rel="stylesheet" href={brandKit.fonts.secondary.url} />

            <div className="p-6 bg-muted rounded-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Primary Font</span>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                  {brandKit.fonts.primary.category}
                </span>
              </div>
              <p
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: brandKit.fonts.primary.family }}
              >
                {brandKit.fonts.primary.name}
              </p>
              <p className="text-sm text-muted-foreground">For headings and emphasis</p>
            </div>

            <div className="p-6 bg-muted rounded-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Secondary Font</span>
                <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded">
                  {brandKit.fonts.secondary.category}
                </span>
              </div>
              <p
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: brandKit.fonts.secondary.family }}
              >
                {brandKit.fonts.secondary.name}
              </p>
              <p className="text-sm text-muted-foreground">For body text and descriptions</p>
            </div>

            {brandKit.justifications?.fonts && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground font-semibold mb-2">Why these fonts?</p>
                <p className="text-sm">{brandKit.justifications.fonts}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ AI-Generated Content:</strong> These assets are created by AI and should be
              reviewed before commercial use. Check for trademark conflicts and ensure compliance with
              your industry regulations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
