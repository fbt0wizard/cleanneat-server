import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  userId: z.string().uuid().optional(),
}).optional().default({});

export type ListServicesParams = z.input<typeof paramsSchema>;
export type ListServicesResult = {
  type: 'success';
  services: Array<{ id: string; title: string; slug: string; userId: string }>;
};

export async function listServices(
  params: ListServicesParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<ListServicesResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ userId: validated.userId }, 'Listing services');

  const services = validated.userId
    ? await repositories.servicesRepository.findByUserId(validated.userId)
    : await repositories.servicesRepository.findAll();

  return {
    type: 'success',
    services: services.map((service) => ({
      id: service.id,
      title: service.title,
      slug: service.slug,
      userId: service.userId,
    })),
  };
}
