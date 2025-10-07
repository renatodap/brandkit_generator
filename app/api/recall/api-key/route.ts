/**
 * API routes for managing recall-notebook API keys
 *
 * POST /api/recall/api-key - Save/update API key
 * GET /api/recall/api-key - Check if user has API key
 * DELETE /api/recall/api-key - Delete API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import {
  saveRecallApiKey,
  hasRecallApiKey,
  deleteRecallApiKey,
  verifyRecallApiKey,
} from '@/lib/services/recall-api-key-service';
import { z } from 'zod';

const saveApiKeySchema = z.object({
  apiKey: z.string().min(10, 'API key must be at least 10 characters'),
});

/**
 * POST /api/recall/api-key
 * Save or update user's recall-notebook API key
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    const body = await request.json();
    const validated = saveApiKeySchema.parse(body);

    const result = await saveRecallApiKey(user.id, validated.apiKey);

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        is_active: result.is_active,
        last_verified_at: result.last_verified_at,
      },
      message: 'API key saved successfully',
    });
  } catch (error) {
    console.error('Failed to save recall API key:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save API key',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recall/api-key
 * Check if user has a valid API key
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    const hasKey = await hasRecallApiKey(user.id);

    if (hasKey) {
      // Verify the key is still valid
      const isValid = await verifyRecallApiKey(user.id);

      return NextResponse.json({
        success: true,
        data: {
          has_key: true,
          is_valid: isValid,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        has_key: false,
        is_valid: false,
      },
    });
  } catch (error) {
    console.error('Failed to check recall API key:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check API key status',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recall/api-key
 * Delete user's recall-notebook API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();

    await deleteRecallApiKey(user.id);

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete recall API key:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete API key',
      },
      { status: 500 }
    );
  }
}
