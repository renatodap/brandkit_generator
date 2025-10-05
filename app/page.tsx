'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Sparkles, Palette, Type, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { brandKitInputSchema, type BrandKitInputType } from '@/lib/validations';
import type { BrandKit } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BrandKitInputType>({
    resolver: zodResolver(brandKitInputSchema),
    defaultValues: {
      businessName: '',
      businessDescription: '',
      industry: 'tech',
    },
  });

  const selectedIndustry = watch('industry');

  const onSubmit = async (data: BrandKitInputType) => {
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
          <CardTitle>Tell us about your business</CardTitle>
          <CardDescription>
            Fill in the details below and we&apos;ll generate your complete brand kit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                aria-describedby={errors.businessName ? 'businessName-error' : undefined}
              />
              {errors.businessName && (
                <p id="businessName-error" className="text-sm text-destructive" role="alert">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            {/* Business Description */}
            <div className="space-y-2">
              <Label htmlFor="businessDescription">
                Business Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe what your business does in 2-3 sentences..."
                rows={4}
                {...register('businessDescription')}
                aria-invalid={errors.businessDescription ? 'true' : 'false'}
                aria-describedby={errors.businessDescription ? 'businessDescription-error' : undefined}
              />
              {errors.businessDescription && (
                <p id="businessDescription-error" className="text-sm text-destructive" role="alert">
                  {errors.businessDescription.message}
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
                onValueChange={(value) => setValue('industry', value as BrandKitInputType['industry'])}
              >
                <SelectTrigger id="industry" aria-label="Select industry">
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
              ⚠️ AI-generated content should be reviewed before commercial use. Generation may take 10-30 seconds.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
