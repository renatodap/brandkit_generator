/**
 * Recall API Key Service
 *
 * Manages storage and retrieval of recall-notebook API keys
 * for persimmon users.
 */

import { createClient } from '@/lib/supabase/server';
import type { RecallApiKey } from '@/types';
import { createRecallService } from './recall-notebook-service';

/**
 * Simple encryption/decryption for API keys
 * In production, use a proper encryption service
 */
function encryptApiKey(apiKey: string): string {
  // For MVP: Base64 encoding (NOT secure for production!)
  // In production: Use proper encryption with env variable secret key
  return Buffer.from(apiKey).toString('base64');
}

function decryptApiKey(encryptedKey: string): string {
  // For MVP: Base64 decoding
  // In production: Use proper decryption
  return Buffer.from(encryptedKey, 'base64').toString('utf-8');
}

/**
 * Store or update user's recall-notebook API key
 */
export async function saveRecallApiKey(
  userId: string,
  apiKey: string
): Promise<RecallApiKey> {
  const supabase = await createClient();

  // Verify API key is valid before storing
  const recallService = createRecallService(apiKey);
  const isValid = await recallService.verifyApiKey();

  if (!isValid) {
    throw new Error('Invalid recall-notebook API key');
  }

  // Encrypt the API key
  const encryptedKey = encryptApiKey(apiKey);

  // Check if user already has an API key
  const { data: existing } = await supabase
    .from('recall_api_keys')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing key
    const { data, error } = await supabase
      .from('recall_api_keys')
      .update({
        api_key: encryptedKey,
        is_active: true,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update recall API key:', error);
      throw new Error('Failed to update API key');
    }

    return data;
  } else {
    // Insert new key
    const { data, error } = await supabase
      .from('recall_api_keys')
      .insert({
        user_id: userId,
        api_key: encryptedKey,
        is_active: true,
        last_verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save recall API key:', error);
      throw new Error('Failed to save API key');
    }

    return data;
  }
}

/**
 * Get user's recall-notebook API key (decrypted)
 */
export async function getRecallApiKey(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recall_api_keys')
    .select('api_key, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return decryptApiKey(data.api_key);
}

/**
 * Check if user has a valid recall-notebook API key
 */
export async function hasRecallApiKey(userId: string): Promise<boolean> {
  const apiKey = await getRecallApiKey(userId);
  return apiKey !== null;
}

/**
 * Delete user's recall-notebook API key
 */
export async function deleteRecallApiKey(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('recall_api_keys')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to delete recall API key:', error);
    throw new Error('Failed to delete API key');
  }
}

/**
 * Verify and update last_verified_at timestamp
 */
export async function verifyRecallApiKey(userId: string): Promise<boolean> {
  const apiKey = await getRecallApiKey(userId);

  if (!apiKey) {
    return false;
  }

  const recallService = createRecallService(apiKey);
  const isValid = await recallService.verifyApiKey();

  if (isValid) {
    const supabase = await createClient();
    await supabase
      .from('recall_api_keys')
      .update({ last_verified_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  return isValid;
}

/**
 * Get recall service instance for user
 */
export async function getRecallServiceForUser(
  userId: string
): Promise<ReturnType<typeof createRecallService> | null> {
  const apiKey = await getRecallApiKey(userId);

  if (!apiKey) {
    return null;
  }

  return createRecallService(apiKey);
}
