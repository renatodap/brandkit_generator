import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { HeaderAuth } from '@/components/header-auth';
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
                <a href="/" className="mr-6 flex items-center space-x-2">
                  <span className="text-xl font-bold">Persimmon Labs</span>
                </a>
              </div>
              <nav className="ml-auto flex items-center space-x-4">
                <a
                  href="/tools/brand-kit"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Brand Kit
                </a>
                <a
                  href="/privacy"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Privacy
                </a>
                <a
                  href="/terms"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Terms
                </a>
                <HeaderAuth />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                © 2025 Persimmon Labs. Powered by AI. Generated assets should be reviewed
                before commercial use.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                <a
                  href="https://huggingface.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Hugging Face
                </a>{' '}
                •{' '}
                <a
                  href="https://fonts.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Google Fonts
                </a>
              </p>
            </div>
          </footer>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
