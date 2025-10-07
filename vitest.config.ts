import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.config.*',
        '**/types/',
        '**/*.d.ts',
        // Exclude UI components (tested via E2E, not unit tests)
        'app/**/page.tsx',
        'app/**/layout.tsx',
        'app/global-error.tsx',
        'components/ui/**',
        'components/features/**', // Feature components tested via E2E
        'components/**/*.tsx', // All React components tested via E2E
        // Exclude infrastructure files
        'middleware.ts',
        'app/app-documentation.ts',
        'lib/supabase/middleware.ts',
        'lib/supabase/client.ts',
        // Exclude advanced features not in MVP
        'app/api/businesses/**/access-requests/**',
        'lib/services/team-service.ts',
        // Exclude third-party AI integrations (tested via integration tests)
        'lib/api/huggingface.ts',
        'lib/api/openrouter.ts',
        'lib/api/index.ts',
        // Exclude environment files (validated at runtime)
        'lib/env.ts',
        'lib/env-runtime.ts',
        // Exclude scripts and tools
        'scripts/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
