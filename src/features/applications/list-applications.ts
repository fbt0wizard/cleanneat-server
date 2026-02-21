import type { Application } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';

export type ListApplicationsResult = { type: 'success'; applications: Application[] };

export async function listApplications(
  _params: Record<string, never>,
  { logger, repositories }: UseCaseDependencies,
): Promise<ListApplicationsResult> {
  logger.info('Listing applications');

  const applications = await repositories.applicationsRepository.findAll();
  return { type: 'success', applications };
}
