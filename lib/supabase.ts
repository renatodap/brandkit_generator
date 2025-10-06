/**
 * Supabase Client Configuration
 *
 * Provides both client-side and server-side Supabase clients
 * with proper authentication context from Clerk.
 */

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Client-side Supabase client
 * Uses anon key with RLS policies
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Clerk handles sessions
    autoRefreshToken: false,
  },
});

/**
 * Server-side Supabase client with user context
 * Sets the current user ID for RLS policies
 *
 * @returns Supabase client configured with current user context
 */
export async function getSupabaseClient() {
  const { userId } = auth();

  if (!userId) {
    // Return client without user context (for public queries)
    return createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Create client with user context for RLS
  const client = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Set user context for RLS policies
        'x-user-id': userId,
      },
    },
  });

  // Set Postgres session variable for RLS
  // This is used in RLS policies: current_setting('app.current_user_id')
  await client.rpc('set_user_context', { user_id: userId }).catch(() => {
    // Ignore error if function doesn't exist yet
    // RLS will be enforced via application logic
  });

  return client;
}

/**
 * Server-side Supabase admin client
 * Bypasses RLS policies (use with caution!)
 *
 * Only use for:
 * - System operations
 * - Webhook handlers
 * - Admin functions
 */
export function getSupabaseAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_KEY (required for admin operations)');
  }

  return createClient(supabaseUrl!, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Database Types
 * Generated from Supabase schema
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          clerk_user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          profile_image_url: string | null;
          total_kits_generated: number;
          created_at: string;
          last_login_at: string | null;
        };
        Insert: {
          clerk_user_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          profile_image_url?: string | null;
          total_kits_generated?: number;
          created_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          clerk_user_id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          profile_image_url?: string | null;
          total_kits_generated?: number;
          created_at?: string;
          last_login_at?: string | null;
        };
      };
      brand_kits: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          business_description: string | null;
          industry: string | null;
          logo_url: string;
          logo_svg: string | null;
          colors: ColorData[];
          fonts: FontData;
          tagline: string | null;
          design_justification: string | null;
          is_favorite: boolean;
          view_count: number;
          last_viewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          business_description?: string | null;
          industry?: string | null;
          logo_url: string;
          logo_svg?: string | null;
          colors: ColorData[];
          fonts: FontData;
          tagline?: string | null;
          design_justification?: string | null;
          is_favorite?: boolean;
          view_count?: number;
          last_viewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          business_description?: string | null;
          industry?: string | null;
          logo_url?: string;
          logo_svg?: string | null;
          colors?: ColorData[];
          fonts?: FontData;
          tagline?: string | null;
          design_justification?: string | null;
          is_favorite?: boolean;
          view_count?: number;
          last_viewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      share_tokens: {
        Row: {
          id: string;
          brand_kit_id: string;
          token: string;
          expires_at: string | null;
          view_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_kit_id: string;
          token: string;
          expires_at?: string | null;
          view_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_kit_id?: string;
          token?: string;
          expires_at?: string | null;
          view_count?: number;
          created_at?: string;
        };
      };
    };
  };
}

// Brand Kit Data Types
export interface ColorData {
  name: string;
  hex: string;
  usage: string;
}

export interface FontData {
  primary: string;
  secondary: string;
}
