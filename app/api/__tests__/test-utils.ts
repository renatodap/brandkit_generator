/**
 * Shared test utilities and mocks for API tests
 */

import type { BrandKit, ColorPalette, FontPairing } from '@/types';

/**
 * Mock brand kit data for testing
 */
export const mockBrandKit: BrandKit = {
  id: '660e8400-e29b-41d4-a716-446655440000', // Valid UUID
  business_id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
  businessName: 'Test Business',
  businessDescription: 'A test business for unit testing',
  industry: 'tech',
  logo: {
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzNCODJGNiIvPjwvc3ZnPg==',
    svgCode: '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#3B82F6"/></svg>',
  },
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#10B981',
    neutral: '#6B7280',
    background: '#FFFFFF',
  },
  fonts: {
    primary: {
      name: 'Inter',
      family: 'Inter, sans-serif',
      url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      category: 'sans-serif',
    },
    secondary: {
      name: 'Lora',
      family: 'Lora, serif',
      url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
      category: 'serif',
    },
  },
  tagline: 'Innovation at its finest',
  justifications: {
    colors: 'These colors represent trust and innovation',
    fonts: 'Modern sans-serif paired with elegant serif',
    logo: 'Simple and memorable design',
  },
  generatedAt: '2025-10-06T12:00:00.000Z',
};

/**
 * Mock color palette
 */
export const mockColorPalette: ColorPalette = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#10B981',
  neutral: '#6B7280',
  background: '#FFFFFF',
};

/**
 * Mock font pairing
 */
export const mockFontPairing: FontPairing = {
  primary: {
    name: 'Inter',
    family: 'Inter, sans-serif',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    category: 'sans-serif',
  },
  secondary: {
    name: 'Lora',
    family: 'Lora, serif',
    url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
    category: 'serif',
  },
};

/**
 * Mock tagline
 */
export const mockTagline = 'Innovation at its finest';

/**
 * Mock SVG logo code
 */
export const mockLogoSvg = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#3B82F6"/></svg>';

/**
 * Mock logo symbols result
 */
export const mockLogoSymbols = {
  primary: 'circle',
  secondary: 'triangle',
  mood: 'modern',
};

/**
 * Mock color preferences
 */
export const mockColorPrefs = {
  mood: 'professional' as const,
  trend: 'classic' as const,
  keywords: ['trust', 'innovation'],
};

/**
 * Mock brand personality
 */
export const mockBrandPersonality = {
  modern: 0.8,
  classic: 0.4,
  playful: 0.2,
  elegant: 0.6,
  bold: 0.5,
  friendly: 0.7,
  professional: 0.9,
  luxurious: 0.3,
};

/**
 * Mock rate limit success
 */
export const mockRateLimitSuccess = {
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 60000,
};

/**
 * Mock rate limit exceeded
 */
export const mockRateLimitExceeded = {
  success: false,
  error: 'Rate limit exceeded. Please try again later.',
  limit: 10,
  remaining: 0,
  reset: Date.now() + 60000,
};

/**
 * Valid brand kit input for testing
 */
export const validBrandKitInput = {
  businessId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
  businessName: 'Test Business',
  businessDescription: 'A test business for unit testing',
  industry: 'tech' as const,
  logoOption: 'generate' as const,
  colorOption: 'generate' as const,
  fontOption: 'generate' as const,
};

/**
 * Invalid brand kit input (missing required fields)
 */
export const invalidBrandKitInput = {
  businessName: '',
  industry: 'invalid-industry',
};

/**
 * Mock Supabase client
 */
export const createMockSupabaseClient = () => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
});

/**
 * Mock user for authentication
 */
export const mockUser = {
  id: '770e8400-e29b-41d4-a716-446655440000', // Valid UUID
  email: 'test@example.com',
};

/**
 * Mock business
 */
export const mockBusiness = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID (matches validBrandKitInput.businessId)
  user_id: '770e8400-e29b-41d4-a716-446655440000', // Valid UUID (matches mockUser.id)
  name: 'Test Business',
  slug: 'test-business',
  description: 'A test business',
  industry: 'tech',
  created_at: '2025-10-06T12:00:00.000Z',
  updated_at: '2025-10-06T12:00:00.000Z',
};

/**
 * Mock share token
 */
export const mockShareToken = {
  token: 'test-share-token-123',
  brand_kit_id: '660e8400-e29b-41d4-a716-446655440000', // Valid UUID (matches mockBrandKit.id)
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  view_count: 0,
  created_at: '2025-10-06T12:00:00.000Z',
};

/**
 * Expired share token
 */
export const expiredShareToken = {
  token: 'expired-token-123',
  brand_kit_id: '660e8400-e29b-41d4-a716-446655440000', // Valid UUID (matches mockBrandKit.id)
  expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  view_count: 5,
  created_at: '2025-10-05T12:00:00.000Z',
};

/**
 * Mock Groq logo generation result
 */
export const mockGroqLogoResult = {
  svgCode: mockLogoSvg,
  template: 'geometric-icon',
  quality: {
    score: 9,
    feedback: 'High-quality logo with clean design',
  },
};

/**
 * Helper to create a mock Request
 */
export function createMockRequest(body: unknown, headers?: Record<string, string>) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(headers || {}),
  } as unknown as Request;
}

/**
 * Helper to extract JSON from NextResponse
 */
export async function extractJson<T>(response: Response): Promise<T> {
  return await response.json();
}

/**
 * Helper to check response status
 */
export function expectStatus(response: Response, status: number) {
  expect(response.status).toBe(status);
}
