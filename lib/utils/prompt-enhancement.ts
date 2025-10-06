import type { AdvancedOptions } from '@/types';

/**
 * Enhances AI prompts with notes and advanced options
 * @param basePrompt - The base prompt to enhance
 * @param notes - Optional user notes for additional context
 * @param advancedOptions - Optional advanced generation parameters
 * @returns Enhanced prompt string
 */
export function enhancePrompt(
  basePrompt: string,
  notes?: string,
  advancedOptions?: AdvancedOptions
): string {
  let enhanced = basePrompt;

  // Add notes if provided
  if (notes && notes.trim()) {
    enhanced += `\n\nAdditional Context: ${notes.trim()}`;
  }

  // Add advanced options if provided
  if (advancedOptions) {
    if (advancedOptions.styles && advancedOptions.styles.length > 0) {
      enhanced += `\nStyle Preferences: ${advancedOptions.styles.join(', ')}`;
    }

    if (advancedOptions.colorMood) {
      enhanced += `\nColor Mood: ${advancedOptions.colorMood}`;
    }

    if (advancedOptions.targetAudience) {
      enhanced += `\nTarget Audience: ${advancedOptions.targetAudience}`;
    }

    if (advancedOptions.brandTones && advancedOptions.brandTones.length > 0) {
      enhanced += `\nBrand Tone: ${advancedOptions.brandTones.join(', ')}`;
    }
  }

  return enhanced;
}

/**
 * Builds a comprehensive context string from all enhancement parameters
 * @param notes - Optional user notes
 * @param advancedOptions - Optional advanced options
 * @returns Context string to append to prompts
 */
export function buildEnhancementContext(
  notes?: string,
  advancedOptions?: AdvancedOptions
): string {
  const parts: string[] = [];

  if (notes && notes.trim()) {
    parts.push(`User Notes: ${notes.trim()}`);
  }

  if (advancedOptions) {
    if (advancedOptions.styles && advancedOptions.styles.length > 0) {
      parts.push(`Style: ${advancedOptions.styles.join(', ')}`);
    }

    if (advancedOptions.colorMood) {
      parts.push(`Color Mood: ${advancedOptions.colorMood}`);
    }

    if (advancedOptions.targetAudience) {
      parts.push(`Target Audience: ${advancedOptions.targetAudience}`);
    }

    if (advancedOptions.brandTones && advancedOptions.brandTones.length > 0) {
      parts.push(`Brand Tone: ${advancedOptions.brandTones.join(', ')}`);
    }
  }

  return parts.length > 0 ? `\n\n${parts.join('\n')}` : '';
}
