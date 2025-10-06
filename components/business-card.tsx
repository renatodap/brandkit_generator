/**
 * Business Card Component
 *
 * Displays a business with its brand kit status.
 * Shows either "Generate Brand Kit" or "View Brand Kit" button.
 */

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sparkles, Eye, Building2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import type { Business } from '@/types';

interface BusinessCardProps {
  business: Business & {
    brand_kit: any | null;
    has_brand_kit: boolean;
  };
  onGenerateKit: (businessId: string) => void;
  onViewKit: (brandKitId: string) => void;
  onEdit: (business: Business & { brand_kit: any | null; has_brand_kit: boolean }) => void;
  onDelete: (business: Business & { brand_kit: any | null; has_brand_kit: boolean }) => void;
}

export function BusinessCard({ business, onGenerateKit, onViewKit, onEdit, onDelete }: BusinessCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardContent className="pt-6 flex-1">
        {/* Business Icon or Logo Preview */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
          {business.brand_kit?.logo_url ? (
            <img
              src={business.brand_kit.logo_url}
              alt={`${business.name} logo`}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <Building2 className="h-16 w-16 text-muted-foreground/30" />
          )}

          {/* Actions Dropdown */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur hover:bg-background"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(business)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Business
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(business)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Business
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Business Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{business.name}</h3>

          <div className="flex items-center gap-2 flex-wrap">
            {business.industry && (
              <Badge variant="secondary" className="capitalize text-xs">
                {business.industry}
              </Badge>
            )}
            {business.has_brand_kit && (
              <Badge variant="default" className="text-xs">
                Has Brand Kit
              </Badge>
            )}
          </div>

          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {business.description}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Created {new Date(business.created_at).toLocaleDateString()}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4 border-t">
        {business.has_brand_kit ? (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onViewKit(business.brand_kit.id)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Brand Kit
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onGenerateKit(business.id)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Brand Kit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
