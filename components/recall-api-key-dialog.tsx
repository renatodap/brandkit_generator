'use client';

/**
 * Dialog for managing recall-notebook API key
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Key, ExternalLink, CheckCircle2 } from 'lucide-react';

interface RecallApiKeyDialogProps {
  hasApiKey?: boolean;
  onSuccess?: () => void;
}

export function RecallApiKeyDialog({ hasApiKey = false, onSuccess }: RecallApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/recall/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }

      toast.success('API key saved successfully!');
      setApiKey('');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={hasApiKey ? 'outline' : 'default'} size="sm">
          <Key className="mr-2 h-4 w-4" />
          {hasApiKey ? 'Update' : 'Connect'} API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Recall Notebook</DialogTitle>
          <DialogDescription>
            Enter your recall-notebook API key to link collections to your businesses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasApiKey && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>You have an active API key connected</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your recall-notebook API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is encrypted and stored securely. It&apos;s used to fetch collections from
              recall-notebook.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="mb-2 text-sm font-medium">How to get your API key:</p>
            <ol className="space-y-1 text-sm text-muted-foreground">
              <li>1. Visit recall-notebook settings</li>
              <li>2. Navigate to API section</li>
              <li>3. Generate a new API key</li>
              <li>4. Copy and paste it here</li>
            </ol>
            <Button
              variant="link"
              size="sm"
              className="mt-2 h-auto p-0"
              asChild
            >
              <a
                href="https://notebook-recall.vercel.app/settings/api"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open recall-notebook settings
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !apiKey.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasApiKey ? 'Update' : 'Save'} API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
