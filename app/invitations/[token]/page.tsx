'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Building2, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { InvitationWithDetails } from '@/types/team';

type InvitationState = 'loading' | 'valid' | 'expired' | 'not-found' | 'error';

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [invitation, setInvitation] = useState<InvitationWithDetails | null>(null);
  const [state, setState] = useState<InvitationState>('loading');
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const token = params['token'] as string;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user !== null) {
      fetchInvitation();
    }
  }, [user]);

  const checkAuth = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    setUser(currentUser);
  };

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);

      if (!response.ok) {
        if (response.status === 404) {
          setState('not-found');
        } else if (response.status === 410) {
          setState('expired');
        } else {
          setState('error');
        }
        return;
      }

      const data = await response.json();
      setInvitation(data);
      setState('valid');
    } catch (error) {
      console.error('Failed to fetch invitation:', error);
      setState('error');
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Redirect to sign-in with return URL
      router.push(`/sign-in?redirect=/invitations/${token}`);
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept invitation');
      }

      toast.success('Invitation accepted! Redirecting to business...');

      // Redirect to business dashboard
      setTimeout(() => {
        const slug = invitation?.business.slug || '';
        router.push(`/dashboard/${slug}` as any);
      }, 1500);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to accept invitation'
      );
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);

    try {
      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to decline invitation');
      }

      toast.success('Invitation declined');

      // Redirect to home or dashboard
      setTimeout(() => {
        router.push(user ? '/dashboard' : '/');
      }, 1500);
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to decline invitation'
      );
      setProcessing(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (state === 'not-found') {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              <CardTitle>Invitation Not Found</CardTitle>
            </div>
            <CardDescription>
              This invitation link is invalid or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => router.push(user ? '/dashboard' : '/')}
              className="w-full"
            >
              Go to {user ? 'Dashboard' : 'Home'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Invitation Expired</CardTitle>
            </div>
            <CardDescription>
              This invitation has expired or is no longer valid. Please contact the
              business owner for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => router.push(user ? '/dashboard' : '/')}
              className="w-full"
            >
              Go to {user ? 'Dashboard' : 'Home'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (state === 'error' || !invitation) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              <CardTitle>Error</CardTitle>
            </div>
            <CardDescription>
              Failed to load invitation. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => fetchInvitation()}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const getRoleName = (role: string) => {
    const roleNames = {
      admin: 'Administrator',
      editor: 'Editor',
      viewer: 'Viewer',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleDescription = (role: string) => {
    const descriptions = {
      admin: 'Can manage team members and edit business content',
      editor: 'Can edit business content and brand kits',
      viewer: 'Can view business content (read-only access)',
    };
    return descriptions[role as keyof typeof descriptions] || '';
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <CardTitle>Team Invitation</CardTitle>
          </div>
          <CardDescription>
            You&apos;ve been invited to join a business on Persimmon Labs
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Business Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">{invitation.business.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Invited by {invitation.inviter.user_metadata?.full_name || invitation.inviter.email}
            </p>
          </div>

          {/* Role Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role:</span>
              <span className="text-sm font-semibold text-primary">
                {getRoleName(invitation.role)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {getRoleDescription(invitation.role)}
            </p>
          </div>

          {/* Email mismatch warning */}
          {user && user.email !== invitation.email && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to {invitation.email}, but you&apos;re signed in
                as {user.email}. Please sign in with the correct account.
              </AlertDescription>
            </Alert>
          )}

          {/* Not signed in notice */}
          {!user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in or create an account to accept this invitation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={processing}
            className="flex-1"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={processing || (user && user.email !== invitation.email)}
            className="flex-1"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {processing ? 'Processing...' : user ? 'Accept' : 'Sign In to Accept'}
          </Button>
        </CardFooter>

        <div className="px-6 pb-6">
          <p className="text-xs text-center text-muted-foreground">
            By accepting, you&apos;ll be able to collaborate on this business and its
            brand kits.
          </p>
        </div>
      </Card>
    </div>
  );
}
