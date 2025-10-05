import { z } from 'zod';

/**
 * Server-side environment variables schema
 */
const serverEnvSchema = z.object({
  // Required API keys
  HUGGINGFACE_API_KEY: z.string().min(1, 'HUGGINGFACE_API_KEY is required'),

  // Optional API keys
  OPENAI_API_KEY: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Client-side environment variables schema
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Brand Kit Generator'),
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
  // Server-only
  get huggingFaceApiKey() {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.HUGGINGFACE_API_KEY;
  },

  get openAiApiKey() {
    if (typeof window !== 'undefined') {
      throw new Error('Server environment variables cannot be accessed on the client');
    }
    return serverEnv.OPENAI_API_KEY;
  },

  get nodeEnv() {
    return serverEnv.NODE_ENV;
  },

  // Client-safe
  get appUrl() {
    return clientEnv.NEXT_PUBLIC_APP_URL;
  },

  get appName() {
    return clientEnv.NEXT_PUBLIC_APP_NAME;
  },

  get isDevelopment() {
    return serverEnv.NODE_ENV === 'development';
  },

  get isProduction() {
    return serverEnv.NODE_ENV === 'production';
  },
};
