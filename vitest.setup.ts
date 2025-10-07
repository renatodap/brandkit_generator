import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env['HUGGINGFACE_API_KEY'] = 'hf_test_key_for_testing';
process.env['NEXT_PUBLIC_APP_URL'] = 'http://localhost:3000';
process.env['NEXT_PUBLIC_APP_NAME'] = 'Brand Kit Generator';
process.env['GROQ_API_KEY'] = 'gsk_test_key_for_testing';
process.env['OPENROUTER_API_KEY'] = 'sk-test_key_for_testing';
process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test_anon_key';
process.env['SUPABASE_SERVICE_KEY'] = 'test_service_key';
// NODE_ENV is read-only and set automatically by the test runner
