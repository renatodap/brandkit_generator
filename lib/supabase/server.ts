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

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting errors (e.g., in middleware)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  );
}

/**
 * Admin client for server-side operations that bypass RLS
 * Use with caution!
 */
export function createAdminClient() {
  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_KEY']!,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
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
    console.error('[Auth] Error getting user:', error.message);
    return null;
  }

  if (!user) {
    console.log('[Auth] No user found in session');
    return null;
  }

  console.log('[Auth] User found:', user.id, user.email);
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
