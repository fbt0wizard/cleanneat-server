import type { Settings } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';

export type GetSettingsResult = { type: 'success'; settings: Settings } | { type: 'not_found' };

export async function getSettings(
  _params: Record<string, never>,
  { logger, repositories }: UseCaseDependencies,
): Promise<GetSettingsResult> {
  logger.info('Fetching settings');

  const settings = await repositories.settingsRepository.get();
  if (!settings) {
    return { type: 'not_found' };
  }
  return { type: 'success', settings };
}
