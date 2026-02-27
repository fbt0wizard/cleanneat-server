import type { Settings } from '@domain/entities';
import type { SettingsUpdate } from '@domain/repositories';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const bodySchema = z
  .object({
    section_title: z.string().min(1).max(255),
    section_intro: z.string().min(1).max(5000),
    groups: z
      .array(
        z.object({
          label: z.string().min(1).max(255),
          description: z.string().min(1).max(2000),
        }),
      )
      .max(100),
  })
  .strict();

export type UpsertWhoWeSupportParams = z.input<typeof bodySchema>;
export type UpsertWhoWeSupportResult =
  | { type: 'success'; who_we_support: NonNullable<Settings['who_we_support']> }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function upsertWhoWeSupport(
  params: UpsertWhoWeSupportParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<UpsertWhoWeSupportResult> {
  const parsed = bodySchema.safeParse(params);
  if (!parsed.success) {
    return { type: 'validation_error', message: parsed.error.message };
  }

  try {
    const settings = await repositories.settingsRepository.upsert({
      who_we_support: parsed.data,
    } as SettingsUpdate);

    if (!settings.who_we_support) {
      return { type: 'error' };
    }

    return { type: 'success', who_we_support: settings.who_we_support };
  } catch (error) {
    logger.error({ error }, 'Failed to upsert who we support settings');
    return { type: 'error' };
  }
}
