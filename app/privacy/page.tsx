import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Brand Kit Generator - How we handle your data',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1.1 Information You Provide</h3>
              <p className="text-muted-foreground">
                When you use Brand Kit Generator, you provide us with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4">
                <li>Business name</li>
                <li>Business description</li>
                <li>Industry category</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">1.2 Automatically Collected Information</h3>
              <p className="text-muted-foreground">
                We may collect technical information including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4">
                <li>Browser type and version</li>
                <li>Device type</li>
                <li>IP address (anonymized)</li>
                <li>Usage statistics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">We use your information to:</p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>Generate AI-powered brand kits based on your inputs</li>
              <li>Improve our AI models and service quality</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Prevent fraud and abuse</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We use the following third-party services:
            </p>

            <div>
              <h3 className="font-semibold mb-2">3.1 Hugging Face</h3>
              <p className="text-muted-foreground">
                We use Hugging Face APIs for AI-powered logo and tagline generation. Your inputs are sent to
                Hugging Face servers for processing. Please review{' '}
                <a
                  href="https://huggingface.co/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Hugging Face&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3.2 Google Fonts</h3>
              <p className="text-muted-foreground">
                We use Google Fonts for typography recommendations. Font files are loaded from Google&apos;s CDN.
                Please review{' '}
                <a
                  href="https://developers.google.com/fonts/faq/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Fonts Privacy FAQ
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Data Storage and Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your generated brand kits are stored locally in your browser (localStorage) and are not saved on
              our servers. You can clear this data at any time by clearing your browser&apos;s local storage.
            </p>
            <p className="text-muted-foreground">
              Inputs sent to third-party AI services are subject to their respective retention policies.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>Access the information we have about you</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We use localStorage (not cookies) to temporarily store your generated brand kits in your browser.
              This data is never sent to our servers and remains entirely on your device.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>HTTPS encryption for all data transmission</li>
              <li>Secure API key management</li>
              <li>Regular security audits</li>
              <li>Input validation and sanitization</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Children&apos;s Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our service is not intended for children under 13. We do not knowingly collect information from
              children under 13.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-muted-foreground font-mono text-sm">
              Email: privacy@brandkitgenerator.com
              <br />
              Mailing Address: Brand Kit Generator
              <br />
              [Company Address - To Be Added]
              <br />
              [City, State ZIP Code]
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Note: Please update contact information before deploying to production.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
