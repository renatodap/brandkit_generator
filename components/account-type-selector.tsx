'use client';

import { useState } from 'react';
import { Check, User, Users, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AccountType {
  type: 'personal' | 'business';
  label: string;
  description: string;
  features: string[];
  price: string;
  icon: React.ReactNode;
}

const accountTypes: AccountType[] = [
  {
    type: 'personal',
    label: 'Personal Account',
    description: 'Perfect for freelancers, consultants, and entrepreneurs',
    features: [
      'Unlimited businesses',
      'Full control over all assets',
      '10 brand kits per month',
      'Export all assets',
      'Manage multiple client projects',
    ],
    price: 'Free',
    icon: <User className="h-8 w-8" />,
  },
  {
    type: 'business',
    label: 'Business Account',
    description: 'For teams and companies that need collaboration',
    features: [
      'Team collaboration',
      'Role-based access control',
      'Unlimited brand kits',
      'Activity tracking',
      'Priority support',
    ],
    price: 'From $29/month',
    icon: <Users className="h-8 w-8" />,
  },
];

interface AccountTypeSelectorProps {
  onSelect: (type: 'personal' | 'business') => void;
  selectedType?: 'personal' | 'business';
}

export function AccountTypeSelector({ onSelect, selectedType }: AccountTypeSelectorProps) {
  const [selected, setSelected] = useState<'personal' | 'business' | undefined>(selectedType);

  const handleSelect = (type: 'personal' | 'business') => {
    setSelected(type);
    onSelect(type);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Account Type</h2>
        <p className="text-muted-foreground text-lg">
          Select the option that best fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {accountTypes.map((accountType) => (
          <Card
            key={accountType.type}
            className={cn(
              'relative cursor-pointer transition-all hover:shadow-lg',
              selected === accountType.type && 'ring-2 ring-primary shadow-lg'
            )}
            onClick={() => handleSelect(accountType.type)}
          >
            {/* Selected indicator */}
            {selected === accountType.type && (
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-full p-2">
                <Check className="h-5 w-5" />
              </div>
            )}

            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {accountType.icon}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Starting at</p>
                  <p className="text-lg font-bold">{accountType.price}</p>
                </div>
              </div>
              <CardTitle>{accountType.label}</CardTitle>
              <CardDescription>{accountType.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2">
                {accountType.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={selected === accountType.type ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(accountType.type);
                }}
              >
                {selected === accountType.type ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Selected
                  </>
                ) : (
                  'Select'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Additional info */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>You can upgrade or change your account type anytime</span>
        </div>

        {selected === 'personal' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-sm text-center">
                <strong className="text-primary">Personal accounts</strong> are perfect if you&apos;re managing
                multiple businesses as a freelancer or consultant. Each business you create is private to you,
                and you have full control.
              </p>
            </CardContent>
          </Card>
        )}

        {selected === 'business' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-sm text-center">
                <strong className="text-primary">Business accounts</strong> are ideal for teams. You&apos;ll be able
                to invite team members, assign roles, and collaborate on brand assets together.
                Includes a 14-day free trial!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Compact version for settings page
export function AccountTypeBadge({ type }: { type: 'personal' | 'business' }) {
  const accountType = accountTypes.find((at) => at.type === type);
  if (!accountType) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
      {type === 'personal' ? (
        <User className="h-4 w-4" />
      ) : (
        <Users className="h-4 w-4" />
      )}
      {accountType.label}
    </div>
  );
}
