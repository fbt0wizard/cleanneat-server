import { Testimonial } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const bodySchema = z.object({
  name_public: z.string().min(1).max(255),
  location_public: z.string().min(1).max(255),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(5000),
});

export type CreateTestimonialParams = z.input<typeof bodySchema>;
export type CreateTestimonialResult =
  | { type: 'success'; id: string }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function createTestimonial(
  params: CreateTestimonialParams,
  deps: UseCaseDependencies,
): Promise<CreateTestimonialResult> {
  const { logger, repositories } = deps;

  const parsed = bodySchema.safeParse(params);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, 'Testimonial validation failed');
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  const id = `test_${nanoid()}`;
  const now = new Date();

  try {
    const testimonial = new Testimonial({
      id,
      name_public: validated.name_public,
      location_public: validated.location_public,
      rating: validated.rating,
      text: validated.text,
      status: 'pending',
      is_published: false,
      created_at: now,
      updated_at: now,
    });

    await repositories.testimonialsRepository.create(testimonial);
    logger.info({ testimonialId: id }, 'Testimonial created');
    return { type: 'success', id };
  } catch (error) {
    logger.error({ error, testimonialId: id }, 'Failed to create testimonial');
    return { type: 'error' };
  }
}
