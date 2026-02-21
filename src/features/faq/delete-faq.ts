import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteFaqParams = z.input<typeof paramsSchema>;
export type DeleteFaqResult = { type: 'success' } | { type: 'not_found' } | { type: 'error' };

export async function deleteFaq(
  params: DeleteFaqParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<DeleteFaqResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ faqId: validated.id }, 'Deleting FAQ');

  const existing = await repositories.faqsRepository.findById(validated.id);
  if (!existing) {
    return { type: 'not_found' };
  }

  try {
    const deleted = await repositories.faqsRepository.delete(validated.id);
    return deleted ? { type: 'success' } : { type: 'not_found' };
  } catch (error) {
    logger.error({ error, faqId: validated.id }, 'Failed to delete FAQ');
    return { type: 'error' };
  }
}
