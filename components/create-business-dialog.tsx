/**
 * Create Business Dialog Component
 *
 * Form dialog for creating a new business with auto-slug generation.
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
import { createBusinessSchema, generateSlug, type CreateBusinessInput } from '@/lib/validations/business';
import { logger } from '@/lib/logger';

interface CreateBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (business: any) => void;
}

export function CreateBusinessDialog({ open, onOpenChange, onSuccess }: CreateBusinessDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateBusinessInput>({
    resolver: zodResolver(createBusinessSchema),
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

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSlugAvailable(null);
      setCheckingSlug(false);
    }
  }, [open]);

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      const generatedSlug = generateSlug(name);
      setValue('slug', generatedSlug);

      // If generated slug is too short, show error
      if (generatedSlug.length < 2) {
        setValue('slug', '');
        // This will trigger form validation error
      }
    }
  }, [name, slug, setValue]);

  // Check slug availability
  useEffect(() => {
    const checkSlug = async () => {
      if (!slug || slug.length < 2) {
        setSlugAvailable(null);
        return;
      }

      setCheckingSlug(true);
      try {
        const response = await fetch(`/api/businesses/check-slug?slug=${encodeURIComponent(slug)}`);

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
  }, [slug]);

  const onSubmit = async (data: CreateBusinessInput) => {
    if (slugAvailable === false) {
      toast.error('This slug is already taken. Please choose another.');
      return;
    }

    setIsCreating(true);
    try {
      logger.info('Creating business', { name: data.name, slug: data.slug });

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      logger.info('Business creation response received', { status: response.status });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        logger.error('Business creation API error', errorData as Error, { status: response.status });

        // Handle different error types
        if (response.status === 401) {
          toast.error('Your session has expired. Please sign in again.');
          setTimeout(() => window.location.href = '/sign-in', 2000);
          return;
        }

        if (response.status === 409) {
          toast.error(errorData.error || 'A business with this slug already exists');
          return;
        }

        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const business = await response.json();
      logger.info('Business created successfully', { businessId: business.id });
      toast.success('Business created successfully!');
      onSuccess(business);
      reset();
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to create business', error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create business. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Business</DialogTitle>
          <DialogDescription>
            Add a new business or project to organize your brand kits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
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
            <Label htmlFor="slug">
              URL Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              placeholder="e.g., acme-corporation"
              {...register('slug')}
              aria-invalid={errors.slug ? 'true' : 'false'}
            />
            {checkingSlug && (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            )}
            {!checkingSlug && slugAvailable === true && (
              <p className="text-sm text-green-600">✓ Slug is available</p>
            )}
            {!checkingSlug && slugAvailable === false && (
              <p className="text-sm text-destructive">✗ Slug is already taken</p>
            )}
            {!checkingSlug && slug && slug.length < 2 && (
              <p className="text-sm text-amber-600">⚠ Slug must be at least 2 characters</p>
            )}
            {!checkingSlug && slugAvailable === null && slug && slug.length >= 2 && (
              <p className="text-sm text-muted-foreground">Unable to verify availability (will be checked on submit)</p>
            )}
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={industry} onValueChange={(value) => setValue('industry', value)}>
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || checkingSlug || slugAvailable === false}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Business'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
