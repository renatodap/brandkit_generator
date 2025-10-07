'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Share2, Download, Trash2, ArrowLeft, Copy, RefreshCw, Palette, Type, Sparkles, Info } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BrandKit {
  id: string;
  business_name: string;
  business_description: string | null;
  industry: string | null;
  logo_url: string;
  logo_svg: string | null;
  colors: { name: string; hex: string; usage: string }[];
  fonts: { primary: string; secondary: string };
  tagline: string | null;
  is_favorite: boolean;
  created_at: string;
}

export default function BrandKitPage() {
  const params = useParams();
  const router = useRouter();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [showShare, setShowShare] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAuthAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params['id']]);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/sign-in');
      return;
    }

    fetchBrandKit();
  };

  const fetchBrandKit = async () => {
    try {
      const response = await fetch(`/api/brand-kits/${params['id']}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Brand kit not found');
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      setBrandKit(data);
    } catch (error) {
      toast.error('Failed to load brand kit');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!brandKit) return;

    try {
      const response = await fetch(`/api/brand-kits/${brandKit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !brandKit.is_favorite }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setBrandKit({ ...brandKit, is_favorite: !brandKit.is_favorite });
      toast.success(brandKit.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/brand-kits/${params['id']}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to create share link');

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setShowShare(true);
    } catch (error) {
      toast.error('Failed to create share link');
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied!');
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this brand kit? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/brand-kits/${params['id']}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Brand kit deleted');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to delete brand kit');
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

  if (!brandKit) return null;

  // Industry-specific color explanations
  const getColorExplanation = (colorName: string, hex: string) => {
    const explanations: Record<string, string> = {
      primary: `${hex} - Your main brand color. Creates immediate recognition and conveys ${brandKit.industry === 'tech' ? 'innovation and trust' : brandKit.industry === 'food' ? 'appetite and warmth' : brandKit.industry === 'health' ? 'vitality and care' : 'professionalism'}.`,
      secondary: `${hex} - Complements your primary color. Used for accents and supporting elements to create visual hierarchy.`,
      accent: `${hex} - Draws attention to calls-to-action and important elements. Creates visual interest and guides user focus.`,
      neutral: `${hex} - Provides balance and breathing room. Used for backgrounds, borders, and subtle UI elements.`,
      background: `${hex} - Your canvas color. Creates the foundation that makes other colors pop while maintaining readability.`,
    };
    return explanations[colorName.toLowerCase()] || `${hex} - Part of your brand's color system`;
  };

  return (
    <TooltipProvider>
    <div className="container py-12 max-w-5xl">
      <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{brandKit.business_name}</h1>
          {brandKit.industry && (
            <p className="text-muted-foreground mt-2 capitalize">{brandKit.industry}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleFavorite}>
            <Star className={`h-4 w-4 ${brandKit.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showShare && shareUrl && (
        <Card className="p-4 mb-6 bg-muted">
          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button onClick={copyShareUrl} size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Anyone with this link can view this brand kit
          </p>
        </Card>
      )}

      {/* Refinement Section */}
      <Card className="mb-8 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Refine Your Brand Kit
          </CardTitle>
          <CardDescription>
            Not happy with something? Regenerate individual elements or create variations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="w-full" disabled>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate Logo
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <Palette className="mr-2 h-4 w-4" />
              Regenerate Colors
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <Type className="mr-2 h-4 w-4" />
              Regenerate Tagline
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            🚧 Regeneration features coming soon! For now, create a new brand kit with different preferences.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Logo</h2>
          <div className="flex justify-center bg-muted rounded-lg p-12">
            <Image
              src={brandKit.logo_url}
              alt={`${brandKit.business_name} logo`}
              width={256}
              height={256}
              className="max-h-64 object-contain"
              unoptimized
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
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-semibold">Color Palette</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>These colors were selected to work harmoniously together and reflect your {brandKit.industry || 'business'} industry. Click any color to copy its hex code.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {brandKit.colors.map((color, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="space-y-2">
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
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{getColorExplanation(color.name, color.hex)}</p>
                  </TooltipContent>
                </Tooltip>
            ))}
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-semibold">Typography</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Font pairings carefully selected for readability and brand personality. Primary for headlines, secondary for body text.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="text-sm text-muted-foreground mb-2">Primary Font</p>
                  <p className="text-4xl font-bold" style={{ fontFamily: brandKit.fonts.primary }}>
                    {brandKit.fonts.primary}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">The quick brown fox jumps over the lazy dog</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">Use for headlines, titles, and key brand messaging. Creates strong visual impact and brand recognition.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="text-sm text-muted-foreground mb-2">Secondary Font</p>
                  <p className="text-2xl" style={{ fontFamily: brandKit.fonts.secondary }}>
                    {brandKit.fonts.secondary}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">The quick brown fox jumps over the lazy dog</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">Use for body copy, descriptions, and supporting content. Optimized for readability at smaller sizes.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}
