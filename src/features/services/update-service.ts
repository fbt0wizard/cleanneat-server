import type { Service } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { logAction } from '../action-logs/log-action';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  shortDescription: z.string().min(1).max(500).optional(),
  longDescription: z.string().min(1).optional(),
  whatsIncluded: z.array(z.string().min(1)).optional(),
  whatsNotIncluded: z.array(z.string().min(1)).optional(),
  typicalDuration: z.string().min(1).max(100).optional(),
  priceFrom: z.string().min(1).max(50).optional(),
  imageUrl: z.string().url().nullable().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdateServiceParams = z.input<typeof paramsSchema>;
export type UpdateServiceResult =
  | { type: 'success'; service: Service }
  | { type: 'not_found' }
  | { type: 'slug_taken' }
  | { type: 'error' };

export async function updateService(
  params: UpdateServiceParams,
  deps: UseCaseDependencies,
): Promise<UpdateServiceResult> {
  const { logger, repositories } = deps;
  logger.info({ serviceId: params.id }, 'Updating service');

  const validated = paramsSchema.parse(params);

  // Check if service exists
  const existingService = await repositories.servicesRepository.findById(validated.id);
  if (!existingService) {
    logger.warn({ serviceId: validated.id }, 'Update attempted on non-existent service');
    return { type: 'not_found' };
  }

  // Check if slug is being changed and if new slug is taken
  if (validated.slug && validated.slug !== existingService.slug) {
    const slugService = await repositories.servicesRepository.findBySlug(validated.slug);
    if (slugService) {
      logger.warn({ slug: validated.slug }, 'Update attempted with existing slug');
      return { type: 'slug_taken' };
    }
  }

  try {
    const updatedService = await repositories.servicesRepository.update(validated.id, validated);

    if (!updatedService) {
      return { type: 'not_found' };
    }

    logger.info({ serviceId: updatedService.id }, 'Service updated successfully');

    await logAction(
      {
        userId: updatedService.userId,
        action: 'update_service',
        entityType: 'service',
        entityId: updatedService.id,
        details: `Updated service "${updatedService.title}" (${updatedService.slug})`,
      },
      deps,
    );

    return {
      type: 'success',
      service: updatedService,
    };
  } catch (error) {
    logger.error({ error, serviceId: validated.id }, 'Failed to update service');
    return { type: 'error' };
  }
}
