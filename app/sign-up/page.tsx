'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountTypeSelector } from '@/components/account-type-selector';
import { toast } from 'sonner';

export default function SignUpPage() {
  const [step, setStep] = useState<'account-type' | 'credentials'>('account-type');
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAccountTypeSelect = (type: 'personal' | 'business') => {
    setAccountType(type);
  };

  const handleContinue = () => {
    if (accountType) {
      setStep('credentials');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            account_type: accountType,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created! Please check your email to verify.');

      // Store account type for onboarding
      localStorage.setItem('pendingAccountType', accountType);

      router.push('/sign-in');
    } catch (error) {
      toast.error('An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'account-type') {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-5xl space-y-8">
          <AccountTypeSelector
            onSelect={handleAccountTypeSelect}
            selectedType={accountType}
          />
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!accountType}
              size="lg"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('account-type')}
            className="w-fit -mt-2 mb-2"
          >
            ← Back
          </Button>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            {accountType === 'personal'
              ? 'Set up your personal account to manage unlimited businesses'
              : 'Set up your business account for team collaboration'
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : `Create ${accountType === 'personal' ? 'Personal' : 'Business'} Account`}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <a href="/sign-in" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
