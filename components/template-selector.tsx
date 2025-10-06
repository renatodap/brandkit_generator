/**
 * Template Selector Component
 *
 * Displays business templates for quick-start generation.
 * Allows users to generate brand kits in under 60 seconds.
 */

'use client';

import { BUSINESS_TEMPLATES, type BusinessTemplate } from '@/config/templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (template: BusinessTemplate) => void;
  disabled?: boolean;
}

export function TemplateSelector({ onSelectTemplate, disabled }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Choose a Template</h2>
        <p className="text-muted-foreground">
          Get started in seconds with a pre-configured business template
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BUSINESS_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className="group relative overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
            onClick={() => !disabled && onSelectTemplate(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${template.color} text-2xl`}
                >
                  {template.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{template.businessName}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              </div>

              <Button
                size="sm"
                className="w-full"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTemplate(template);
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Use Template
              </Button>
            </CardContent>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>These templates include pre-configured settings for instant generation.</p>
        <p>You can customize everything after generation.</p>
      </div>
    </div>
  );
}
