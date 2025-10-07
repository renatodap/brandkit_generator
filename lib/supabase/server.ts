/**
 * Supabase Client for Server Components and API Routes
 *
 * Use this in:
 * - Server Components
 * - Server Actions
 * - API Routes
 */

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { logger } from '@/lib/logger';

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        get(name: string): string | undefined {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions): void {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting can fail in middleware or read-only contexts
            logger.error('Failed to set Supabase cookie', error as Error, { cookieName: name });
          }
        },
        remove(name: string, options: CookieOptions): void {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie removal can fail in middleware or read-only contexts
            console.error('[Supabase] Failed to remove cookie:', name, error);
          }
        },
      },
    }
  );
}

/**
 * Admin client for server-side operations that bypass RLS
 * Use with caution! This client has full database access and bypasses all Row Level Security policies.
 *
 * @returns Supabase client with service role permissions
 */
export function createAdminClient() {
  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_KEY']!,
    {
      cookies: {
        get(): undefined { return undefined; },
        set(): void {},
        remove(): void {},
      },
    }
  );
}

/**
 * Get the current authenticated user
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    logger.error('Error getting authenticated user', error as Error);
    return null;
  }

  if (!user) {
    logger.debug('No user found in session');
    return null;
  }

  logger.debug('Authenticated user retrieved', { userId: user.id, email: user.email });
  return user;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireUser() {
  const user = await getUser();

  if (!user) {
    console.error('[Auth] requireUser() failed - no user in session');
    throw new Error('Unauthorized');
  }

  return user;
}
