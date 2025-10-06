/**
 * Authentication Helper Functions
 *
 * Provides utilities for working with Clerk authentication
 * in API routes and server components.
 */

import { auth, currentUser } from '@clerk/nextjs';

/**
 * Get the current user's ID from Clerk
 *
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = auth();
  return userId;
}

/**
 * Require authentication - throws error if not authenticated
 *
 * @returns User ID
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new UnauthorizedError('Authentication required');
  }

  return userId;
}

/**
 * Get the current user's full profile from Clerk
 *
 * @returns Clerk user object or null if not authenticated
 */
export async function getCurrentUser() {
  return await currentUser();
}

/**
 * Custom error for unauthorized access
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Custom error for forbidden access
 */
export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Check if a resource belongs to the current user
 *
 * @param resourceUserId - The user ID that owns the resource
 * @throws ForbiddenError if user doesn't own the resource
 */
export async function requireResourceOwnership(resourceUserId: string): Promise<void> {
  const currentUserId = await requireAuth();

  if (currentUserId !== resourceUserId) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }
}

/**
 * Extract user info for database sync
 *
 * Converts Clerk user object to database user format
 */
export async function getUserInfoForDatabase() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return {
    clerk_user_id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    first_name: user.firstName || null,
    last_name: user.lastName || null,
    profile_image_url: user.imageUrl || null,
  };
}
