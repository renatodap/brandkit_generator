'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Sparkles, Palette, Type, Tag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { LogoControl } from '@/components/brand-kit-form/logo-control';
import { ColorPaletteControl } from '@/components/brand-kit-form/color-palette-control';
import { TypographyControl } from '@/components/brand-kit-form/typography-control';
import { AdvancedOptions } from '@/components/brand-kit-form/advanced-options';
import { ProgressiveGeneration } from '@/components/progressive-generation';

import { enhancedBrandKitInputSchema, type EnhancedBrandKitInputType } from '@/lib/validations';
import type { BrandKit } from '@/types';

export default function BrandKitGenerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams?.get('businessId');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(!!businessId);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EnhancedBrandKitInputType>({
    resolver: zodResolver(enhancedBrandKitInputSchema),
    defaultValues: {
      businessId: businessId || '',
      businessName: '',
      businessDescription: '',
      industry: 'tech',
      notes: '',
      logoOption: 'generate',
      logoBase64: undefined,
      colorOption: 'generate',
      existingColors: undefined,
      fontOption: 'generate',
      existingFonts: undefined,
      advancedOptions: undefined,
    },
  });

  const selectedIndustry = watch('industry');
  const logoOption = watch('logoOption');
  const logoBase64 = watch('logoBase64');
  const colorOption = watch('colorOption');
  const existingColors = watch('existingColors');
  const fontOption = watch('fontOption');
  const existingFonts = watch('existingFonts');
  const advancedOptions = watch('advancedOptions');

  // Fetch business data if businessId is provided
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId) {
        // No business selected - redirect to dashboard
        toast.error('Please select a business first');
        router.push('/dashboard');
        return;
      }

      try {
        const response = await fetch(`/api/businesses/${businessId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setBusinessError('Business not found');
          } else if (response.status === 401) {
            router.push('/sign-in');
            return;
          } else {
            setBusinessError('Failed to load business');
          }
          return;
        }

        const business = await response.json();

        // Check if business already has a brand kit by trying to fetch it
        try {
          const brandKitCheck = await fetch(`/api/brand-kits?businessId=${businessId}`);
          if (brandKitCheck.ok) {
            const kits = await brandKitCheck.json();
            if (kits.brandKits && kits.brandKits.length > 0) {
              toast.error('This business already has a brand kit');
              router.push(`/brand-kit/${kits.brandKits[0].id}`);
              return;
            }
          }
        } catch (err) {
          // Ignore error, allow user to proceed
        }

        // Pre-fill form with business data
        setValue('businessId', business.id);
        setValue('businessName', business.name);
        setValue('businessDescription', business.description || '');
        setValue('industry', business.industry || 'tech');
      } catch (error) {
        console.error('Error fetching business:', error);
        setBusinessError('Failed to load business');
      } finally {
        setIsLoadingBusiness(false);
      }
    };

    fetchBusiness();
  }, [businessId, router, setValue]);

  const onSubmit = async (data: EnhancedBrandKitInputType) => {
    if (!businessId) {
      toast.error('Please select a business first');
      router.push('/dashboard');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-brand-kit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate brand kit');
      }

      const brandKit: BrandKit = await response.json();

      // Store in localStorage for results page
      localStorage.setItem('brandKit', JSON.stringify(brandKit));

      toast.success('Brand kit generated successfully!');
      router.push('/results');
    } catch (error) {
      console.error('Error generating brand kit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate brand kit. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Show error state
  if (businessError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto p-12 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-6">{businessError}</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Show loading state while fetching business
  if (isLoadingBusiness) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mx-auto max-w-3xl text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
          Generate Your Brand Kit
          <span className="block text-primary mt-2">Powered by AI</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Create a professional brand identity in seconds. Get your logo, color palette, typography, and tagline instantly.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">AI Logo</h3>
            <p className="text-sm text-muted-foreground">Unique, professional logo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Palette className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Color Palette</h3>
            <p className="text-sm text-muted-foreground">5-color brand palette</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Type className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Typography</h3>
            <p className="text-sm text-muted-foreground">Perfect font pairing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Tag className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Tagline</h3>
            <p className="text-sm text-muted-foreground">Compelling brand message</p>
          </CardContent>
        </Card>
      </div>

      {/* Generation Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{isGenerating ? 'Creating Your Brand Kit' : 'Generate Your Brand Kit'}</CardTitle>
          <CardDescription>
            {isGenerating
              ? 'Our AI is crafting your unique brand identity'
              : 'We\'ll handle the details—just tell us a bit about your business'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <ProgressiveGeneration isGenerating={isGenerating} />
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Core Fields (Always Visible) */}
            <div className="space-y-6 p-6 rounded-lg bg-muted/30 border">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="e.g., TechVision Solutions"
                  {...register('businessName')}
                  aria-invalid={errors.businessName ? 'true' : 'false'}
                  disabled={!!businessId}
                  className="text-base"
                />
                {errors.businessName && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedIndustry}
                  onValueChange={(value) => setValue('industry', value as EnhancedBrandKitInputType['industry'])}
                >
                  <SelectTrigger id="industry" className="text-base">
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
                {errors.industry && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.industry.message}
                  </p>
                )}
              </div>

              {/* Business Description */}
              <div className="space-y-2">
                <Label htmlFor="businessDescription">
                  Short Description (Optional)
                </Label>
                <Textarea
                  id="businessDescription"
                  placeholder="Briefly describe what your business does..."
                  rows={3}
                  {...register('businessDescription')}
                  aria-invalid={errors.businessDescription ? 'true' : 'false'}
                  className="text-base resize-none"
                />
                {errors.businessDescription && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.businessDescription.message}
                  </p>
                )}
              </div>
            </div>

            {/* Advanced Options (Collapsed by Default) */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Advanced Options</span>
                    <span className="text-xs text-muted-foreground">(Optional - Use smart defaults)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      Brand Vision Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="E.g., 'Modern and minimal', 'Ocean-inspired colors', 'Target Gen Z'"
                      rows={3}
                      {...register('notes')}
                      className="resize-none"
                    />
                    {errors.notes && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.notes.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Guide the AI with specific preferences or requirements
                    </p>
                  </div>

                  {/* Logo Control */}
                  <LogoControl
                    value={logoOption}
                    onChange={(value) => setValue('logoOption', value)}
                    onFileChange={(base64) => setValue('logoBase64', base64 || undefined)}
                    logoBase64={logoBase64}
                    error={errors.logoBase64?.message}
                  />

                  {/* Color Palette Control */}
                  <ColorPaletteControl
                    value={colorOption}
                    onChange={(value) => setValue('colorOption', value)}
                    colors={existingColors}
                    onColorsChange={(colors) => setValue('existingColors', colors)}
                    errors={{
                      primary: errors.existingColors?.primary?.message,
                      secondary: errors.existingColors?.secondary?.message,
                      accent: errors.existingColors?.accent?.message,
                      neutral: errors.existingColors?.neutral?.message,
                      background: errors.existingColors?.background?.message,
                    }}
                  />

                  {/* Typography Control */}
                  <TypographyControl
                    value={fontOption}
                    onChange={(value) => setValue('fontOption', value)}
                    fonts={existingFonts}
                    onFontsChange={(fonts) => setValue('existingFonts', fonts)}
                    errors={{
                      primaryName: errors.existingFonts?.primary?.name?.message,
                      primaryCategory: errors.existingFonts?.primary?.category?.message,
                      primaryUrl: errors.existingFonts?.primary?.url?.message,
                      secondaryName: errors.existingFonts?.secondary?.name?.message,
                      secondaryCategory: errors.existingFonts?.secondary?.category?.message,
                      secondaryUrl: errors.existingFonts?.secondary?.url?.message,
                    }}
                  />

                  {/* AI Model Options */}
                  <AdvancedOptions
                    value={advancedOptions}
                    onChange={(value) => setValue('advancedOptions', value)}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isGenerating}
              aria-label={isGenerating ? 'Generating brand kit' : 'Generate brand kit'}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating Your Brand Kit...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  Generate Brand Kit
                </>
              )}
            </Button>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ AI-generated content should be reviewed before commercial use.
              {logoOption === 'generate' ? ' Logo generation may take 10-30 seconds.' : ' Generation may take 5-15 seconds.'}
            </p>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
