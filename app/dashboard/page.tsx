'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Download, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface BrandKit {
  id: string;
  business_name: string;
  industry: string | null;
  logo_url: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/sign-in');
      return;
    }

    setUser(user);
    fetchBrandKits();
  };

  const fetchBrandKits = async () => {
    try {
      const response = await fetch('/api/brand-kits');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch brand kits');
      }

      const data = await response.json();
      setBrandKits(data.brandKits || []);
    } catch (error) {
      console.error('Error fetching brand kits:', error);
      toast.error('Failed to load brand kits');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const response = await fetch(`/api/brand-kits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setBrandKits(kits =>
        kits.map(kit =>
          kit.id === id ? { ...kit, is_favorite: !currentFavorite } : kit
        )
      );

      toast.success(currentFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Your Brand Kits</h1>
          <p className="text-muted-foreground mt-2">
            Manage and download your generated brand identities
          </p>
        </div>
        <Button onClick={() => router.push('/')} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </div>

      {brandKits.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">No brand kits yet</h2>
            <p className="text-muted-foreground">
              Create your first brand kit to get started. It only takes a few seconds!
            </p>
            <Button onClick={() => router.push('/')} size="lg" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Brand Kit
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {brandKits.map((kit) => (
            <Card key={kit.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={kit.logo_url}
                    alt={`${kit.business_name} logo`}
                    className="h-full w-full object-contain p-4"
                  />
                  <button
                    onClick={() => toggleFavorite(kit.id, kit.is_favorite)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
                    aria-label={kit.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        kit.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>
                <h3 className="font-semibold text-lg line-clamp-1 mb-1">
                  {kit.business_name}
                </h3>
                {kit.industry && (
                  <p className="text-sm text-muted-foreground capitalize mb-2">
                    {kit.industry}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {new Date(kit.created_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/brand-kit/${kit.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
