'use client';

/**
 * Dialog for managing recall-notebook collections linked to a business
 */

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Database, Link2, Trash2, RefreshCw, BookOpen } from 'lucide-react';
import type { RecallCollection, BusinessCollection } from '@/types';

interface BusinessCollectionsDialogProps {
  businessId: string;
  businessName: string;
}

export function BusinessCollectionsDialog({
  businessId,
  businessName,
}: BusinessCollectionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [availableCollections, setAvailableCollections] = useState<RecallCollection[]>([]);
  const [linkedCollections, setLinkedCollections] = useState<BusinessCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  const [hasApiKey, setHasApiKey] = useState(false);

  // Check if user has API key
  useEffect(() => {
    if (open) {
      checkApiKey();
    }
  }, [open]);

  const checkApiKey = async () => {
    try {
      const response = await fetch('/api/recall/api-key');
      const data = await response.json();

      if (data.success && data.data.has_key && data.data.is_valid) {
        setHasApiKey(true);
        await Promise.all([fetchAvailableCollections(), fetchLinkedCollections()]);
      } else {
        setHasApiKey(false);
      }
    } catch (error) {
      console.error('Failed to check API key:', error);
      setHasApiKey(false);
    }
  };

  const fetchAvailableCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recall/collections');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch collections');
      }

      setAvailableCollections(data.data || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedCollections = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/collections`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch linked collections');
      }

      setLinkedCollections(data.data || []);
    } catch (error) {
      console.error('Failed to fetch linked collections:', error);
    }
  };

  const handleLinkCollection = async () => {
    if (!selectedCollectionId) {
      toast.error('Please select a collection');
      return;
    }

    setLinking(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collectionId: selectedCollectionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link collection');
      }

      toast.success('Collection linked successfully!');
      setSelectedCollectionId('');
      await fetchLinkedCollections();
    } catch (error) {
      console.error('Failed to link collection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to link collection');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkCollection = async (collectionId: string) => {
    setDeleting(collectionId);
    try {
      const response = await fetch(`/api/businesses/${businessId}/collections/${collectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink collection');
      }

      toast.success('Collection unlinked');
      await fetchLinkedCollections();
    } catch (error) {
      console.error('Failed to unlink collection:', error);
      toast.error('Failed to unlink collection');
    } finally {
      setDeleting(null);
    }
  };

  const handleRefreshCache = async (collectionId: string) => {
    setRefreshing(collectionId);
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/collections/${collectionId}/refresh`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh cache');
      }

      toast.success('Cache refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      toast.error('Failed to refresh cache');
    } finally {
      setRefreshing(null);
    }
  };

  // Filter out already linked collections
  const unlinkedCollections = availableCollections.filter(
    (col) => !linkedCollections.some((linked) => linked.collection_id === col.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="mr-2 h-4 w-4" />
          Knowledge Base
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Connect Knowledge Base</DialogTitle>
          <DialogDescription>
            Link recall-notebook collections to enhance {businessName}'s brand generation with your
            company knowledge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!hasApiKey ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
              <p className="font-medium">No API key connected</p>
              <p className="mt-1">
                Please connect your recall-notebook API key first to link collections.
              </p>
            </div>
          ) : (
            <>
              {/* Linked Collections */}
              <div className="space-y-3">
                <Label>Linked Collections ({linkedCollections.length})</Label>

                {linkedCollections.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p>No collections linked yet</p>
                    <p className="text-xs">Link a collection to enhance brand generation</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedCollections.map((collection) => (
                      <div
                        key={collection.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{collection.collection_name}</p>
                          {collection.collection_description && (
                            <p className="text-xs text-muted-foreground">
                              {collection.collection_description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRefreshCache(collection.id)}
                            disabled={refreshing === collection.id}
                          >
                            {refreshing === collection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkCollection(collection.id)}
                            disabled={deleting === collection.id}
                          >
                            {deleting === collection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Link New Collection */}
              <div className="space-y-3">
                <Label>Link New Collection</Label>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : unlinkedCollections.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    <p>No more collections available to link</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedCollections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                            {collection.description && ` - ${collection.description}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleLinkCollection}
                      disabled={linking || !selectedCollectionId}
                    >
                      {linking ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="mr-2 h-4 w-4" />
                      )}
                      Link
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
