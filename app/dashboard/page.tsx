'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessCard } from '@/components/business-card';
import { CreateBusinessDialog } from '@/components/create-business-dialog';
import type { Business } from '@/types';

interface BusinessWithBrandKit extends Business {
  brand_kit: any | null;
  has_brand_kit: boolean;
}

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<BusinessWithBrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/sign-in');
      return;
    }

    fetchBusinesses();
  };

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses?include=brand_kits');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch businesses');
      }

      const data = await response.json();
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKit = (businessId: string) => {
    router.push(`/tools/brand-kit?businessId=${businessId}`);
  };

  const handleViewKit = (brandKitId: string) => {
    router.push(`/brand-kit/${brandKitId}`);
  };

  const handleBusinessCreated = (business: Business) => {
    // Add the new business to the list
    setBusinesses((prev) => [
      {
        ...business,
        brand_kit: null,
        has_brand_kit: false,
      },
      ...prev,
    ]);
    toast.success('Business created! Now generate a brand kit for it.');
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
            <Card key={i} className="p-6">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-24" />
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
          <h1 className="text-4xl font-bold tracking-tight">Your Businesses</h1>
          <p className="text-muted-foreground mt-2">
            Manage your businesses and generate brand kits for each one
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Business
        </Button>
      </div>

      {businesses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">No businesses yet</h2>
            <p className="text-muted-foreground">
              Create your first business to get started. Each business can have its own brand
              kit.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} size="lg" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Business
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              onGenerateKit={handleGenerateKit}
              onViewKit={handleViewKit}
            />
          ))}
        </div>
      )}

      <CreateBusinessDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleBusinessCreated}
      />
    </div>
  );
}
