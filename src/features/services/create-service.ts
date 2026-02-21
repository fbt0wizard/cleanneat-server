import { randomUUID } from 'node:crypto';
import { Service } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { logAction } from '../action-logs/log-action';
import { z } from 'zod';

const paramsSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  shortDescription: z.string().min(1).max(500),
  longDescription: z.string().min(1),
  whatsIncluded: z.array(z.string().min(1)).default([]),
  whatsNotIncluded: z.array(z.string().min(1)).default([]),
  typicalDuration: z.string().min(1).max(100),
  priceFrom: z.string().min(1).max(50),
  imageUrl: z.string().url().nullable().default(null),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  userId: z.string().uuid(),
});

export type CreateServiceParams = z.input<typeof paramsSchema>;
export type CreateServiceResult =
  | { type: 'success'; service: Service }
  | { type: 'slug_taken' }
  | { type: 'user_not_found' }
  | { type: 'error' };

export async function createService(
  params: CreateServiceParams,
  deps: UseCaseDependencies,
): Promise<CreateServiceResult> {
  const { logger, repositories } = deps;
  logger.info({ userId: params.userId, slug: params.slug }, 'Creating service');

  const validated = paramsSchema.parse(params);

  // Check if user exists
  const user = await repositories.usersRepository.findById(validated.userId);
  if (!user) {
    logger.warn({ userId: validated.userId }, 'Service creation attempted with non-existent user');
    return { type: 'user_not_found' };
  }

  // Check if slug is already taken
  const existingService = await repositories.servicesRepository.findBySlug(validated.slug);
  if (existingService) {
    logger.warn({ slug: validated.slug }, 'Service creation attempted with existing slug');
    return { type: 'slug_taken' };
  }

  try {
    const service = new Service({
      id: randomUUID(),
      title: validated.title,
      slug: validated.slug,
      shortDescription: validated.shortDescription,
      longDescription: validated.longDescription,
      whatsIncluded: validated.whatsIncluded,
      whatsNotIncluded: validated.whatsNotIncluded,
      typicalDuration: validated.typicalDuration,
      priceFrom: validated.priceFrom,
      imageUrl: validated.imageUrl,
      isPublished: validated.isPublished,
      sortOrder: validated.sortOrder,
      userId: validated.userId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const createdService = await repositories.servicesRepository.create(service);

    logger.info({ serviceId: createdService.id, userId: createdService.userId }, 'Service created successfully');

    await logAction(
      {
        userId: createdService.userId,
        action: 'create_service',
        entityType: 'service',
        entityId: createdService.id,
        details: `Created service "${createdService.title}" (${createdService.slug})`,
      },
      deps,
    );

    return { type: 'success', service: createdService };
  } catch (error) {
    logger.error({ error, userId: validated.userId, slug: validated.slug }, 'Failed to create service');
    return { type: 'error' };
  }
}
