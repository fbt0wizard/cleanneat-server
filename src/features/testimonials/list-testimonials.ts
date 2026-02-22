import type { Testimonial } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  userId: z.string().uuid(),
});

export type ListTestimonialsParams = z.input<typeof paramsSchema>;
export type ListTestimonialsResult = { type: 'success'; testimonials: Testimonial[] };

export async function listTestimonials(
  params: ListTestimonialsParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<ListTestimonialsResult> {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, 'List testimonials validation failed');
    return { type: 'success', testimonials: [] };
  }

  logger.info({ userId: parsed.data.userId }, 'Listing testimonials');
  const testimonials = await repositories.testimonialsRepository.findAll();
  return { type: 'success', testimonials };
}
