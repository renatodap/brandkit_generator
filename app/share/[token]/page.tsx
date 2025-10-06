'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Link from 'next/link';

interface SharedBrandKit {
  id: string;
  business_name: string;
  business_description: string | null;
  industry: string | null;
  logo_url: string;
  logo_svg: string | null;
  colors: { name: string; hex: string; usage: string }[];
  fonts: { primary: string; secondary: string };
  tagline: string | null;
  created_at: string;
}

export default function SharePage() {
  const params = useParams();
  const [brandKit, setBrandKit] = useState<SharedBrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSharedBrandKit();
  }, [params['token']]);

  const fetchSharedBrandKit = async () => {
    try {
      const response = await fetch(`/api/share/${params['token']}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError(true);
          toast.error('Share link not found or expired');
          return;
        }
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      setBrandKit(data);
    } catch (error) {
      setError(true);
      toast.error('Failed to load shared brand kit');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!brandKit) return;

    try {
      const zip = new JSZip();

      // Add logo
      const logoResponse = await fetch(brandKit.logo_url);
      const logoBlob = await logoResponse.blob();
      zip.file('logo.png', logoBlob);

      // Add brand kit info
      const info = `BRAND KIT: ${brandKit.business_name}
=====================================

TAGLINE:
${brandKit.tagline || 'N/A'}

COLORS:
${brandKit.colors.map(c => `${c.name}: ${c.hex} (${c.usage})`).join('\n')}

FONTS:
Primary: ${brandKit.fonts.primary}
Secondary: ${brandKit.fonts.secondary}

INDUSTRY: ${brandKit.industry || 'N/A'}
CREATED: ${new Date(brandKit.created_at).toLocaleString()}
`;

      zip.file('brand-kit-info.txt', info);

      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${brandKit.business_name.replace(/\s+/g, '-')}-brand-kit.zip`);
      toast.success('Brand kit downloaded!');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-5xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !brandKit) {
    return (
      <div className="container py-12 max-w-5xl">
        <Card className="p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <h2 className="text-2xl font-semibold">Share Link Not Found</h2>
            <p className="text-muted-foreground">
              This share link may have expired or been removed.
            </p>
            <Link href="/">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Create Your Own
          </Button>
        </Link>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{brandKit.business_name}</h1>
          {brandKit.industry && (
            <p className="text-muted-foreground mt-2 capitalize">{brandKit.industry}</p>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Logo</h2>
          <div className="flex justify-center bg-muted rounded-lg p-12">
            <img
              src={brandKit.logo_url}
              alt={`${brandKit.business_name} logo`}
              className="max-h-64 object-contain"
            />
          </div>
        </Card>

        {brandKit.tagline && (
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Tagline</h2>
            <p className="text-xl italic text-muted-foreground">&ldquo;{brandKit.tagline}&rdquo;</p>
          </Card>
        )}

        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {brandKit.colors.map((color, index) => (
              <div key={index} className="space-y-2">
                <div
                  className="aspect-square rounded-lg border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => {
                    navigator.clipboard.writeText(color.hex);
                    toast.success(`Copied ${color.hex}`);
                  }}
                />
                <div className="text-sm">
                  <p className="font-medium">{color.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">{color.hex}</p>
                  <p className="text-muted-foreground text-xs capitalize">{color.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Typography</h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Primary Font</p>
              <p className="text-4xl font-bold" style={{ fontFamily: brandKit.fonts.primary }}>
                {brandKit.fonts.primary}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Secondary Font</p>
              <p className="text-2xl" style={{ fontFamily: brandKit.fonts.secondary }}>
                {brandKit.fonts.secondary}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-muted">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Want your own AI-generated brand kit?</h3>
            <p className="text-muted-foreground">
              Create a professional brand identity in seconds with our AI-powered generator.
            </p>
            <Link href="/">
              <Button size="lg" className="mt-2">
                Create Your Brand Kit
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
