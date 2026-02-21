import type { UseCaseDependencies } from '@infrastructure/di';
import { logAction } from '../action-logs/log-action';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteServiceParams = z.input<typeof paramsSchema>;
export type DeleteServiceResult = { type: 'success' } | { type: 'not_found' } | { type: 'error' };

export async function deleteService(
  params: DeleteServiceParams,
  deps: UseCaseDependencies,
): Promise<DeleteServiceResult> {
  const { logger, repositories } = deps;
  const validated = paramsSchema.parse(params);

  logger.info({ serviceId: validated.id }, 'Deleting service');

  // Check if service exists
  const service = await repositories.servicesRepository.findById(validated.id);
  if (!service) {
    logger.warn({ serviceId: validated.id }, 'Delete attempted on non-existent service');
    return { type: 'not_found' };
  }

  try {
    const deleted = await repositories.servicesRepository.delete(validated.id);

    if (!deleted) {
      return { type: 'not_found' };
    }

    logger.info({ serviceId: validated.id }, 'Service deleted successfully');

    await logAction(
      {
        userId: service.userId,
        action: 'delete_service',
        entityType: 'service',
        entityId: validated.id,
        details: `Deleted service "${service.title}" (${service.slug})`,
      },
      deps,
    );

    return { type: 'success' };
  } catch (error) {
    logger.error({ error, serviceId: validated.id }, 'Failed to delete service');
    return { type: 'error' };
  }
}
