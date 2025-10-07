import { z } from 'zod';

/**
 * Server-side environment variables schema
 */
const serverEnvSchema = z.object({
  // Supabase (server-only keys)
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),
  SUPABASE_ACCESS_TOKEN: z.string().optional(),

  // Required API keys
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required for SVG logo generation'),

  // Optional API keys (with fallback functionality)
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),

  // Upstash Redis (optional, for rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sentry (optional, for error tracking)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Client-side environment variables schema
 */
const clientEnvSchema = z.object({
  // Supabase (client-safe keys)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Brand Kit Generator'),

  // Sentry (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

/**
 * Validate server environment variables
 * @throws {ZodError} If validation fails
 */
function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }

  return parsed.data;
}

/**
 * Validate client environment variables
 * @throws {ZodError} If validation fails
 */
function validateClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_APP_NAME: process.env['NEXT_PUBLIC_APP_NAME'],
  });

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

/**
 * Validated server environment variables
 * Only accessible on the server
 */
export const serverEnv = validateServerEnv();

/**
 * Validated client environment variables
 * Safe to access in browser
 */
export const clientEnv = validateClientEnv();

/**
 * Type-safe environment variable access
 */
export const env = {
  // Server-only - Supabase
  get supabaseServiceKey(): string {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.SUPABASE_SERVICE_KEY;
  },

  get supabaseAccessToken(): string | undefined {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.SUPABASE_ACCESS_TOKEN;
  },

  // Server-only - API Keys
  get openRouterApiKey(): string {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.OPENROUTER_API_KEY;
  },

  get groqApiKey(): string | undefined {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.GROQ_API_KEY;
  },

  get openAiApiKey(): string | undefined {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.OPENAI_API_KEY;
  },

  get huggingFaceApiKey(): string | undefined {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.HUGGINGFACE_API_KEY;
  },

  // Server-only - Redis
  get upstashRedisUrl(): string | undefined {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.UPSTASH_REDIS_REST_URL;
  },

  get upstashRedisToken(): string | undefined {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.UPSTASH_REDIS_REST_TOKEN;
  },

  // Server-only - Environment
  get nodeEnv(): string {
    return serverEnv.NODE_ENV;
  },

  get isDevelopment(): boolean {
    return serverEnv.NODE_ENV === 'development';
  },

  get isProduction(): boolean {
    return serverEnv.NODE_ENV === 'production';
  },

  // Client-safe - Supabase
  get supabaseUrl(): string {
    return clientEnv.NEXT_PUBLIC_SUPABASE_URL;
  },

  get supabaseAnonKey(): string {
    return clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  },

  // Client-safe - App Config
  get appUrl(): string {
    return clientEnv.NEXT_PUBLIC_APP_URL;
  },

  get appName(): string {
    return clientEnv.NEXT_PUBLIC_APP_NAME;
  },

  // Client-safe - Sentry
  get sentryDsn(): string | undefined {
    return clientEnv.NEXT_PUBLIC_SENTRY_DSN;
  },
};
