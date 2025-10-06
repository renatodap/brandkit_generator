import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { HeaderAuth } from '@/components/header-auth';
import { LogoLink } from '@/components/logo-link';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Persimmon Labs - AI-Powered Business Tools',
    template: '%s | Persimmon Labs',
  },
  description:
    'Your unified platform for AI-powered business tools. Create brand identities, manage teams, and grow your business with intelligent automation. One account, multiple tools.',
  keywords: [
    'persimmon labs',
    'AI business tools',
    'brand kit generator',
    'AI logo generator',
    'color palette generator',
    'brand identity',
    'team collaboration',
    'business automation',
    'AI branding',
    'unified platform',
  ],
  authors: [{ name: 'Persimmon Labs' }],
  creator: 'Persimmon Labs',
  publisher: 'Persimmon Labs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env['NEXT_PUBLIC_APP_URL'] ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  ),
  openGraph: {
    title: 'Persimmon Labs - AI-Powered Business Tools',
    description:
      'Your unified platform for AI-powered business tools. One account, multiple tools.',
    url: '/',
    siteName: 'Persimmon Labs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Persimmon Labs - AI-Powered Business Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Persimmon Labs - AI-Powered Business Tools',
    description: 'Generate professional brand kits instantly with AI.',
    images: ['/og-image.png'],
    creator: '@brandkitgen',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Brand Kit Generator',
              description: 'AI-powered brand identity generator',
              url: process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000',
              applicationCategory: 'DesignApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              operatingSystem: 'Any',
              browserRequirements: 'Requires JavaScript. Requires HTML5.',
            }),
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
              <div className="mr-4 flex">
                <LogoLink />
              </div>
              <nav className="ml-auto flex items-center">
                <HeaderAuth />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-8">
            <div className="container">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Copyright and AI Disclaimer */}
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground">
                    © 2025 Persimmon Labs. All rights reserved.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI-generated assets should be reviewed before commercial use.
                  </p>
                </div>

                {/* Links */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <a
                    href="/privacy"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/terms"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="https://huggingface.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Hugging Face
                  </a>
                  <a
                    href="https://fonts.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Google Fonts
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
