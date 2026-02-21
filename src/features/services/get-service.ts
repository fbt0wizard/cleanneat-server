import type { Service } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export type GetServiceParams = z.input<typeof paramsSchema>;
export type GetServiceResult =
  | { type: 'success'; service: Service }
  | { type: 'not_found' };

export async function getService(
  params: GetServiceParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<GetServiceResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ serviceId: validated.id }, 'Fetching service');

  const service = await repositories.servicesRepository.findById(validated.id);

  if (!service) {
    logger.info({ serviceId: validated.id }, 'Service not found');
    return { type: 'not_found' };
  }

  return {
    type: 'success',
    service,
  };
}
