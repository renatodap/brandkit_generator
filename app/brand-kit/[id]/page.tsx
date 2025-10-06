'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Share2, Download, Trash2, ArrowLeft, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  }, [params.id]);

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
      const response = await fetch(`/api/brand-kits/${params.id}`);

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
      const response = await fetch(`/api/brand-kits/${params.id}/share`, {
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
      const response = await fetch(`/api/brand-kits/${params.id}`, {
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

  return (
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
      </div>
    </div>
  );
}
