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
export type UpsertSettingsResult =
  | { type: 'success'; settings: Settings }
  | { type: 'validation_error'; message: string; issues: unknown }
  | { type: 'error' };

export async function upsertSettings(
  params: UpsertSettingsParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<UpsertSettingsResult> {
  logger.info('Upserting settings');

  const parsed = bodySchema.safeParse(params);
  if (!parsed.success) {
    const msg = parsed.error.message;
    const issues = parsed.error.issues;
    logger.warn({ message: msg, issues }, 'Settings validation failed');
    return { type: 'validation_error', message: msg, issues };
  }
  const validated = parsed.data;

  try {
    const updates: Record<string, unknown> = {};
    const keys: (keyof SettingsUpdate)[] = [
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
    ];
    for (const key of keys) {
      if (validated[key] !== undefined) updates[key] = validated[key];
    }
    const settings = await repositories.settingsRepository.upsert(updates as SettingsUpdate);
    return { type: 'success', settings };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      { err: { message: err.message, name: err.name, stack: err.stack } },
      'Failed to upsert settings',
    );
    return { type: 'error' };
  }
}
