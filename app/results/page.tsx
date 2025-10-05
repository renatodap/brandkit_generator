'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, ArrowLeft, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BrandKit } from '@/types';
import { getTextColor, formatFileName } from '@/lib/utils';

export default function ResultsPage() {
  const router = useRouter();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('brandKit');
    if (!stored) {
      router.push('/');
      return;
    }

    try {
      const parsed: BrandKit = JSON.parse(stored);
      setBrandKit(parsed);
    } catch (error) {
      console.error('Failed to parse brand kit:', error);
      router.push('/');
    }
  }, [router]);

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

  const downloadBrandKit = async () => {
    if (!brandKit) return;

    setIsDownloading(true);

    try {
      const zip = new JSZip();

      // Add logo image
      if (brandKit.logo.url) {
        try {
          if (brandKit.logo.url.startsWith('data:')) {
            // Handle base64 data URLs
            const base64Data = brandKit.logo.url.split(',')[1];
            if (base64Data) {
              zip.file('logo.png', base64Data, { base64: true });
            }
          } else {
            // Handle external URLs (from DeepAI)
            const logoResponse = await fetch(brandKit.logo.url);
            const logoBlob = await logoResponse.blob();
            zip.file('logo.png', logoBlob);
          }
        } catch (error) {
          console.error('Failed to download logo:', error);
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
Powered by DeepAI & Google Fonts
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${brandKit.fonts.secondary.family};
            line-height: 1.6;
            color: #1a1a1a;
            background: #f5f5f5;
            padding: 2rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 3rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h1, h2, h3 {
            font-family: ${brandKit.fonts.primary.family};
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            color: ${brandKit.colors.primary};
        }

        .tagline {
            font-size: 1.25rem;
            color: #666;
            margin-bottom: 3rem;
            font-style: italic;
        }

        .section {
            margin-bottom: 3rem;
        }

        h2 {
            font-size: 1.75rem;
            margin-bottom: 1.5rem;
            color: #333;
            border-bottom: 3px solid ${brandKit.colors.primary};
            padding-bottom: 0.5rem;
        }

        .color-palette {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }

        .color-swatch {
            text-align: center;
        }

        .color-box {
            height: 100px;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            border: 1px solid #e0e0e0;
        }

        .color-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .color-code {
            font-family: monospace;
            color: #666;
        }

        .font-pair {
            background: #f9f9f9;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }

        .font-preview {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .font-details {
            color: #666;
            font-size: 0.875rem;
        }

        .disclaimer {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 1rem;
            margin-top: 3rem;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${brandKit.businessName}</h1>
        <p class="tagline">${brandKit.tagline}</p>

        <div class="section">
            <h2>Color Palette</h2>
            <div class="color-palette">
                <div class="color-swatch">
                    <div class="color-box" style="background-color: ${brandKit.colors.primary}"></div>
                    <div class="color-name">Primary</div>
                    <div class="color-code">${brandKit.colors.primary}</div>
                </div>
                <div class="color-swatch">
                    <div class="color-box" style="background-color: ${brandKit.colors.secondary}"></div>
                    <div class="color-name">Secondary</div>
                    <div class="color-code">${brandKit.colors.secondary}</div>
                </div>
                <div class="color-swatch">
                    <div class="color-box" style="background-color: ${brandKit.colors.accent}"></div>
                    <div class="color-name">Accent</div>
                    <div class="color-code">${brandKit.colors.accent}</div>
                </div>
                <div class="color-swatch">
                    <div class="color-box" style="background-color: ${brandKit.colors.neutral}"></div>
                    <div class="color-name">Neutral</div>
                    <div class="color-code">${brandKit.colors.neutral}</div>
                </div>
                <div class="color-swatch">
                    <div class="color-box" style="background-color: ${brandKit.colors.background}"></div>
                    <div class="color-name">Background</div>
                    <div class="color-code">${brandKit.colors.background}</div>
                </div>
            </div>
            ${brandKit.justifications?.colors ? `<div style="margin-top: 1.5rem; padding: 1rem; background: #f9f9f9; border-radius: 8px; border-left: 4px solid ${brandKit.colors.primary};"><strong>Why these colors?</strong><br/>${brandKit.justifications.colors}</div>` : ''}
        </div>

        <div class="section">
            <h2>Typography</h2>
            <div class="font-pair">
                <div class="font-preview" style="font-family: ${brandKit.fonts.primary.family}">
                    ${brandKit.fonts.primary.name}
                </div>
                <div class="font-details">
                    Primary Font • ${brandKit.fonts.primary.category}
                </div>
            </div>
            <div class="font-pair">
                <div class="font-preview" style="font-family: ${brandKit.fonts.secondary.family}">
                    ${brandKit.fonts.secondary.name}
                </div>
                <div class="font-details">
                    Secondary Font • ${brandKit.fonts.secondary.category}
                </div>
            </div>
            ${brandKit.justifications?.fonts ? `<div style="margin-top: 1.5rem; padding: 1rem; background: #f9f9f9; border-radius: 8px; border-left: 4px solid ${brandKit.colors.primary};"><strong>Why these fonts?</strong><br/>${brandKit.justifications.fonts}</div>` : ''}
        </div>

        <div class="disclaimer">
            <strong>⚠️ Disclaimer:</strong> These assets are AI-generated and should be reviewed before commercial use.
            Check for trademark conflicts and ensure compliance with your industry regulations.
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
        <Button variant="ghost" onClick={() => router.push('/')} aria-label="Go back to homepage">
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
            <CardTitle className="text-3xl">{brandKit.businessName}</CardTitle>
            <CardDescription className="text-lg">{brandKit.tagline}</CardDescription>
          </CardHeader>
          <CardContent>
            {brandKit.logo.url && (
              <div className="flex justify-center p-8 bg-muted rounded-lg">
                <img
                  src={brandKit.logo.url}
                  alt={`${brandKit.businessName} logo`}
                  className="max-w-md w-full h-auto"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Click any color to copy the hex code</CardDescription>
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
            <CardTitle>Typography</CardTitle>
            <CardDescription>Font pairing for your brand</CardDescription>
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
