'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessCard } from '@/components/business-card';
import { CreateBusinessDialog } from '@/components/create-business-dialog';
import { EditBusinessDialog } from '@/components/edit-business-dialog';
import { TemplateSelector } from '@/components/template-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Business } from '@/types';
import type { BusinessTemplate } from '@/config/templates';
import { generateSlugFromTemplate } from '@/config/templates';

interface BusinessWithBrandKit extends Business {
  brand_kit: any | null;
  has_brand_kit: boolean;
}

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<BusinessWithBrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<BusinessWithBrandKit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
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

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setShowEditDialog(true);
  };

  const handleBusinessUpdated = (updatedBusiness: Business) => {
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === updatedBusiness.id
          ? { ...b, ...updatedBusiness }
          : b
      )
    );
    toast.success('Business updated successfully!');
  };

  const handleDelete = (business: BusinessWithBrandKit) => {
    setDeletingBusiness(business);
  };

  const confirmDelete = async () => {
    if (!deletingBusiness) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/businesses/${deletingBusiness.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete business');
      }

      setBusinesses((prev) => prev.filter((b) => b.id !== deletingBusiness.id));
      toast.success('Business deleted successfully');
      setDeletingBusiness(null);
    } catch (error) {
      console.error('Error deleting business:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete business');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTemplateSelect = async (template: BusinessTemplate) => {
    setIsCreatingFromTemplate(true);
    try {
      // Create business from template
      const slug = generateSlugFromTemplate(template);

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.businessName,
          slug,
          description: template.description,
          industry: template.industry,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create business');
      }

      const newBusiness = await response.json();

      // Add to list
      setBusinesses((prev) => [
        {
          ...newBusiness,
          brand_kit: null,
          has_brand_kit: false,
        },
        ...prev,
      ]);

      toast.success('Business created from template!');

      // Immediately redirect to generate brand kit
      router.push(`/tools/brand-kit?businessId=${newBusiness.id}&template=${template.id}`);
    } catch (error) {
      console.error('Error creating business from template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create business');
    } finally {
      setIsCreatingFromTemplate(false);
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
        <Card className="p-8">
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Create Your First Brand Kit</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get started in under 60 seconds with a template, or customize every detail from scratch.
              </p>
            </div>

            {/* Tabs for Templates vs Custom */}
            <Tabs defaultValue="templates" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="templates">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Quick Start Templates
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Start from Scratch
                </TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="mt-6">
                <TemplateSelector
                  onSelectTemplate={handleTemplateSelect}
                  disabled={isCreatingFromTemplate}
                />
              </TabsContent>

              <TabsContent value="custom" className="mt-6">
                <div className="text-center space-y-4 py-12">
                  <div className="mx-auto max-w-md space-y-3">
                    <h3 className="text-xl font-semibold">Build from Scratch</h3>
                    <p className="text-muted-foreground">
                      Create a business with full control over every detail. Perfect if you have
                      specific branding requirements.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)} size="lg" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Custom Business
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateBusinessDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleBusinessCreated}
      />

      <EditBusinessDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        business={editingBusiness}
        onSuccess={handleBusinessUpdated}
      />

      <AlertDialog open={!!deletingBusiness} onOpenChange={(open) => !open && setDeletingBusiness(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingBusiness?.name}&quot;?
              {deletingBusiness?.has_brand_kit && (
                <span className="block mt-2 font-semibold text-destructive">
                  ⚠️ This will also permanently delete the associated brand kit.
                </span>
              )}
              <span className="block mt-2">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
