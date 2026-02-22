import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const paramsSchema = z.object({
  id: z.string().min(1).max(100),
  userId: z.string().uuid(),
});

export type DeleteTestimonialParams = z.input<typeof paramsSchema>;
export type DeleteTestimonialResult =
  | { type: 'success' }
  | { type: 'not_found' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function deleteTestimonial(
  params: DeleteTestimonialParams,
  deps: UseCaseDependencies,
): Promise<DeleteTestimonialResult> {
  const { logger, repositories } = deps;

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  const existing = await repositories.testimonialsRepository.findById(validated.id);
  if (!existing) {
    return { type: 'not_found' };
  }

  try {
    const deleted = await repositories.testimonialsRepository.delete(validated.id);
    if (!deleted) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'delete_testimonial',
        entityType: 'testimonial',
        entityId: validated.id,
        details: `Deleted testimonial ${validated.id}`,
      },
      deps,
    );

    logger.info({ testimonialId: validated.id, userId: validated.userId }, 'Testimonial deleted');
    return { type: 'success' };
  } catch (error) {
    logger.error({ error, testimonialId: validated.id }, 'Failed to delete testimonial');
    return { type: 'error' };
  }
}
