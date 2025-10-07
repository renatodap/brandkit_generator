/**
 * Test Helpers for Business API Routes
 *
 * Provides mock Supabase clients and authentication helpers for testing.
 */

import { vi } from 'vitest';
import type { Business } from '@/types';

/**
 * Mock authenticated user
 */
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

/**
 * Mock business data
 */
export const mockBusiness: Business = {
  id: 'business-123',
  user_id: 'user-123',
  name: 'Test Business',
  slug: 'test-business',
  description: 'A test business',
  industry: 'Technology',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

/**
 * Mock Supabase client builder
 */
export function createMockSupabaseClient(overrides?: {
  select?: unknown;
  insert?: unknown;
  update?: unknown;
  delete?: unknown;
  error?: unknown;
  data?: unknown;
}) {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockNeq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({
    data: overrides?.data ?? mockBusiness,
    error: overrides?.error ?? null,
  });
  const mockMaybeSingle = vi.fn().mockResolvedValue({
    data: overrides?.data ?? null,
    error: overrides?.error ?? null,
  });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  });

  // Chain methods properly
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  });

  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  });

  mockUpdate.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    }),
  });

  mockDelete.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
    }),
  });

  mockEq.mockReturnValue({
    eq: mockEq,
    neq: mockNeq,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  });

  mockNeq.mockReturnValue({
    maybeSingle: mockMaybeSingle,
  });

  mockOrder.mockReturnValue({
    range: mockRange,
  });

  mockRange.mockResolvedValue({
    data: overrides?.data ?? [mockBusiness],
    error: overrides?.error ?? null,
    count: 1,
  });

  return {
    from: mockFrom,
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };
}

/**
 * Mock requireUser function that returns authenticated user
 */
export function mockRequireUser() {
  return vi.fn().mockResolvedValue(mockUser);
}

/**
 * Mock requireUser function that throws unauthorized error
 */
export function mockRequireUserUnauthorized() {
  return vi.fn().mockRejectedValue(new Error('Unauthorized'));
}

/**
 * Create a mock NextRequest
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
}) {
  const url = new URL(options.url || 'http://localhost:3000/api/businesses');

  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const request = {
    method: options.method || 'GET',
    url: url.toString(),
    nextUrl: url,
    json: vi.fn().mockResolvedValue(options.body || {}),
    headers: new Headers(),
  } as any;

  return request;
}

/**
 * Mock Supabase error codes
 */
export const SUPABASE_ERRORS = {
  UNIQUE_VIOLATION: { code: '23505', message: 'duplicate key value violates unique constraint' },
  NOT_FOUND: { code: 'PGRST116', message: 'No rows found' },
  PERMISSION_DENIED: { code: '42501', message: 'permission denied' },
  GENERIC_ERROR: { code: '08000', message: 'connection error' },
};
