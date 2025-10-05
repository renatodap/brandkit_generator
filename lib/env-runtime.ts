import { z } from 'zod';

/**
 * Runtime environment variable validation (doesn't run at build time)
 * This is better for deployment to avoid build failures due to missing env vars
 */

const serverEnvSchema = z.object({
  HUGGINGFACE_API_KEY: z.string().min(1, 'HUGGINGFACE_API_KEY is required'),
  OPENAI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Brand Kit Generator'),
});

let serverEnvCache: z.infer<typeof serverEnvSchema> | null = null;
let clientEnvCache: z.infer<typeof clientEnvSchema> | null = null;

/**
 * Get validated server environment variables (lazy validation)
 * Only validates when first accessed, not at build time
 */
function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('Server environment variables cannot be accessed on the client');
  }

  if (serverEnvCache) return serverEnvCache;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables. Check your .env file.');
  }

  serverEnvCache = parsed.data;
  return serverEnvCache;
}

/**
 * Get validated client environment variables (lazy validation)
 */
function getClientEnv() {
  if (clientEnvCache) return clientEnvCache;

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_APP_NAME: process.env['NEXT_PUBLIC_APP_NAME'],
  });

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  clientEnvCache = parsed.data;
  return clientEnvCache;
}

/**
 * Type-safe environment variable access with runtime validation
 */
export const env = {
  // Server-only (validated on first access, not build time)
  get huggingFaceApiKey() {
    return getServerEnv().HUGGINGFACE_API_KEY;
  },

  get openAiApiKey() {
    return getServerEnv().OPENAI_API_KEY;
  },

  get nodeEnv() {
    return getServerEnv().NODE_ENV;
  },

  // Client-safe
  get appUrl() {
    return getClientEnv().NEXT_PUBLIC_APP_URL;
  },

  get appName() {
    return getClientEnv().NEXT_PUBLIC_APP_NAME;
  },

  get isDevelopment() {
    return getServerEnv().NODE_ENV === 'development';
  },

  get isProduction() {
    return getServerEnv().NODE_ENV === 'production';
  },
};
