import type { Testimonial } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';

export type ListPublishedTestimonialsResult = { type: 'success'; testimonials: Testimonial[] };

export async function listPublishedTestimonials(
  _params: Record<string, never>,
  { repositories }: UseCaseDependencies,
): Promise<ListPublishedTestimonialsResult> {
  const testimonials = await repositories.testimonialsRepository.findPublished();
  return { type: 'success', testimonials };
}
