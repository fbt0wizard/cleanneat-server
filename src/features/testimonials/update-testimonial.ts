import type { Testimonial } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const paramsSchema = z.object({
  id: z.string().min(1).max(100),
  userId: z.string().uuid(),
  is_published: z.boolean().optional(),
  status: z.string().min(1).max(50).optional(),
});

export type UpdateTestimonialParams = z.input<typeof paramsSchema>;
export type UpdateTestimonialResult =
  | { type: 'success'; testimonial: Testimonial }
  | { type: 'not_found' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function updateTestimonial(
  params: UpdateTestimonialParams,
  deps: UseCaseDependencies,
): Promise<UpdateTestimonialResult> {
  const { logger, repositories } = deps;

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  if (validated.is_published === undefined && validated.status === undefined) {
    return { type: 'validation_error', message: 'At least one of is_published or status is required' };
  }

  const existing = await repositories.testimonialsRepository.findById(validated.id);
  if (!existing) {
    return { type: 'not_found' };
  }

  try {
    const updates: { is_published?: boolean; status?: string } = {};
    if (validated.is_published !== undefined) updates.is_published = validated.is_published;
    if (validated.status !== undefined) updates.status = validated.status;

    const testimonial = await repositories.testimonialsRepository.update(validated.id, updates);
    if (!testimonial) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'update_testimonial',
        entityType: 'testimonial',
        entityId: testimonial.id,
        details: `Updated testimonial ${testimonial.id}: ${JSON.stringify(updates)}`,
      },
      deps,
    );

    logger.info({ testimonialId: validated.id, updates, userId: validated.userId }, 'Testimonial updated');
    return { type: 'success', testimonial };
  } catch (error) {
    logger.error({ error, testimonialId: validated.id }, 'Failed to update testimonial');
    return { type: 'error' };
  }
}
