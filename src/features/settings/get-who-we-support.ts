import type { Settings } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';

export type GetWhoWeSupportResult =
  | { type: 'success'; who_we_support: NonNullable<Settings['who_we_support']> }
  | { type: 'not_found' };

export async function getWhoWeSupport(
  _params: Record<string, never>,
  { repositories }: UseCaseDependencies,
): Promise<GetWhoWeSupportResult> {
  const settings = await repositories.settingsRepository.get();
  if (!settings?.who_we_support) {
    return { type: 'not_found' };
  }

  return { type: 'success', who_we_support: settings.who_we_support };
}
