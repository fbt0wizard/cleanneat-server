import type { Faq } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  category: z.string().min(1).max(255).optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdateFaqParams = z.input<typeof paramsSchema>;
export type UpdateFaqResult =
  | { type: 'success'; faq: Faq }
  | { type: 'not_found' }
  | { type: 'error' };

export async function updateFaq(
  params: UpdateFaqParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<UpdateFaqResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ faqId: validated.id }, 'Updating FAQ');

  const existing = await repositories.faqsRepository.findById(validated.id);
  if (!existing) {
    return { type: 'not_found' };
  }

  try {
    const { id, ...updates } = validated;
    const updated = await repositories.faqsRepository.update(id, updates);
    if (!updated) return { type: 'not_found' };
    return { type: 'success', faq: updated };
  } catch (error) {
    logger.error({ error, faqId: validated.id }, 'Failed to update FAQ');
    return { type: 'error' };
  }
}
