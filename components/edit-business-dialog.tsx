/**
 * Edit Business Dialog Component
 *
 * Form dialog for editing an existing business with slug validation.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateBusinessSchema, generateSlug, type UpdateBusinessInput } from '@/lib/validations/business';
import type { Business } from '@/types';

interface EditBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: Business | null;
  onSuccess: (business: Business) => void;
}

export function EditBusinessDialog({ open, onOpenChange, business, onSuccess }: EditBusinessDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(true);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateBusinessInput>({
    resolver: zodResolver(updateBusinessSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      industry: '',
    },
  });

  const name = watch('name');
  const slug = watch('slug');
  const industry = watch('industry');

  // Reset form when business changes
  useEffect(() => {
    if (business) {
      setValue('name', business.name);
      setValue('slug', business.slug);
      setValue('description', business.description || '');
      setValue('industry', business.industry || '');
      setSlugAvailable(true); // Current slug is always available
    }
  }, [business, setValue]);

  // Auto-generate slug from name if name changes
  useEffect(() => {
    if (business && name && name !== business.name && !slug) {
      const generatedSlug = generateSlug(name);
      setValue('slug', generatedSlug);
    }
  }, [name, slug, business, setValue]);

  // Check slug availability (only if it changed)
  useEffect(() => {
    const checkSlug = async () => {
      if (!slug || !business || slug === business.slug) {
        setSlugAvailable(true);
        return;
      }

      if (slug.length < 2) {
        setSlugAvailable(null);
        return;
      }

      setCheckingSlug(true);
      try {
        const response = await fetch(
          `/api/businesses/check-slug?slug=${encodeURIComponent(slug)}&excludeId=${business.id}`
        );

        if (!response.ok) {
          // Handle API errors gracefully
          if (response.status === 401) {
            toast.error('Session expired. Please sign in again.');
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            toast.error(errorData.error || 'Failed to check slug availability');
          }
          setSlugAvailable(null);
          return;
        }

        const data = await response.json();
        setSlugAvailable(data.available);
      } catch (error) {
        console.error('Failed to check slug availability:', error);
        toast.error('Network error. Please check your connection.');
        setSlugAvailable(null);
      } finally {
        setCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkSlug, 500); // Debounce
    return () => clearTimeout(timer);
  }, [slug, business]);

  const onSubmit = async (data: UpdateBusinessInput) => {
    if (!business) return;

    if (slug && slug !== business.slug && !slugAvailable) {
      toast.error('This slug is already taken. Please choose another.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update business');
      }

      const updatedBusiness = await response.json();
      toast.success('Business updated successfully!');
      onSuccess(updatedBusiness);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update business');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Business</DialogTitle>
          <DialogDescription>
            Update your business information. Changes will be reflected across all brand kits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              placeholder="e.g., Acme Corporation"
              {...register('name')}
              aria-invalid={errors.name ? 'true' : 'false'}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="edit-slug">
              URL Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-slug"
              placeholder="e.g., acme-corporation"
              {...register('slug')}
              aria-invalid={errors.slug ? 'true' : 'false'}
            />
            {checkingSlug && (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            )}
            {!checkingSlug && slug && business && slug !== business.slug && slugAvailable === true && (
              <p className="text-sm text-green-600">✓ Slug is available</p>
            )}
            {!checkingSlug && slug && business && slug !== business.slug && slugAvailable === false && (
              <p className="text-sm text-destructive">✗ Slug is already taken</p>
            )}
            {!checkingSlug && slug && slug.length < 2 && (
              <p className="text-sm text-amber-600">⚠ Slug must be at least 2 characters</p>
            )}
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="edit-industry">Industry</Label>
            <Select value={industry || ''} onValueChange={(value) => setValue('industry', value || null)}>
              <SelectTrigger id="edit-industry">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
                <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                <SelectItem value="health">Health & Wellness</SelectItem>
                <SelectItem value="creative">Creative & Arts</SelectItem>
                <SelectItem value="finance">Finance & Business</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Describe your business or project..."
              rows={3}
              {...register('description')}
              aria-invalid={errors.description ? 'true' : 'false'}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || (slug !== business?.slug && !slugAvailable)}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
