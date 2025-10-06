'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Palette, Users, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // User is logged in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is not logged in, show landing page
        setLoading(false);
      }
    };

    checkUser();
  }, [router, supabase.auth]);

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Powered by AI
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Welcome to
            <span className="block text-primary mt-2">Persimmon Labs</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your unified platform for AI-powered business tools. Create brand identities, manage teams, and grow your business with intelligent automation.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/tools/brand-kit">Try Brand Kit</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • Free forever for personal use
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">One Account, Multiple Tools</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sign up once and access all Persimmon Labs tools with a single unified account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <Palette className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Brand Kit Generator</CardTitle>
              <CardDescription>
                AI-powered brand identity creation in seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Custom logos with AI</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Perfect color palettes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Professional typography</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Compelling taglines</span>
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline" asChild>
                <Link href="/tools/brand-kit">Try Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Work together with your team on shared projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Role-based access control</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Shared workspaces</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Activity tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Team management</span>
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>More Tools Coming</CardTitle>
              <CardDescription>
                Expanding suite of AI-powered business tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Content generation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Marketing automation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Analytics & insights</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>And much more...</span>
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Account Types Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Account Type</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Personal or Business - one account works everywhere
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Personal Account</CardTitle>
                <CardDescription className="text-base">
                  Perfect for freelancers, consultants, and entrepreneurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">Free</div>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">✓</span>
                    <span>Manage unlimited businesses</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">✓</span>
                    <span>10 brand kits per month</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">✓</span>
                    <span>Export all assets</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">✓</span>
                    <span>Multiple client projects</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/sign-up">Create Personal Account</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary mb-2 w-fit">
                  RECOMMENDED FOR TEAMS
                </div>
                <CardTitle className="text-2xl">Business Account</CardTitle>
                <CardDescription className="text-base">
                  For teams and companies that need collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">From $29/month</div>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">✓</span>
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">✓</span>
                    <span>Unlimited brand kits</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">✓</span>
                    <span>Role-based access</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">✓</span>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/sign-up">Create Business Account</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join Persimmon Labs today and access all our AI-powered tools with a single unified account
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Create Your Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
