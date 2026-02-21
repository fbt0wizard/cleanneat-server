import type { Settings } from '@domain/entities';
import type { SettingsUpdate } from '@domain/repositories';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const bodySchema = z
  .object({
    primary_phone: z.string().max(50).nullable().optional(),
    primary_email: z.string().email().max(255).nullable().optional(),
    office_hours_text: z.string().max(1000).nullable().optional(),
    service_area_text: z.string().max(1000).nullable().optional(),
    service_area_postcodes: z.array(z.string().max(20)).nullable().optional(),
    hero_badge_text: z.string().max(255).nullable().optional(),
    hero_headline: z.string().max(500).nullable().optional(),
    hero_headline_highlight: z.string().max(255).nullable().optional(),
    hero_subtext: z.string().max(2000).nullable().optional(),
    hero_images: z.array(z.string().url()).nullable().optional(),
    social_facebook: z.string().url().max(500).nullable().optional(),
    social_instagram: z.string().url().max(500).nullable().optional(),
    social_twitter: z.string().url().max(500).nullable().optional(),
    social_linkedin: z.string().url().max(500).nullable().optional(),
    logo_url: z.string().url().max(500).nullable().optional(),
    favicon_url: z.string().url().max(500).nullable().optional(),
  })
  .strict();

export type UpsertSettingsParams = z.input<typeof bodySchema>;
export type UpsertSettingsResult = { type: 'success'; settings: Settings } | { type: 'error' };

export async function upsertSettings(
  params: UpsertSettingsParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<UpsertSettingsResult> {
  logger.info('Upserting settings');

  try {
    const validated = bodySchema.parse(params);
    const updates: SettingsUpdate = {};
    const keys = [
      'primary_phone',
      'primary_email',
      'office_hours_text',
      'service_area_text',
      'service_area_postcodes',
      'hero_badge_text',
      'hero_headline',
      'hero_headline_highlight',
      'hero_subtext',
      'hero_images',
      'social_facebook',
      'social_instagram',
      'social_twitter',
      'social_linkedin',
      'logo_url',
      'favicon_url',
    ] as const;
    for (const key of keys) {
      if (validated[key] !== undefined) updates[key] = validated[key];
    }
    const settings = await repositories.settingsRepository.upsert(updates);
    return { type: 'success', settings };
  } catch (error) {
    logger.error({ error }, 'Failed to upsert settings');
    return { type: 'error' };
  }
}
