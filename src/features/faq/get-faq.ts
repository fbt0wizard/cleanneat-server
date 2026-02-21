import type { Faq } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export type GetFaqParams = z.input<typeof paramsSchema>;
export type GetFaqResult = { type: 'success'; faq: Faq } | { type: 'not_found' };

export async function getFaq(
  params: GetFaqParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<GetFaqResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ faqId: validated.id }, 'Fetching FAQ');

  const faq = await repositories.faqsRepository.findById(validated.id);
  if (!faq) {
    return { type: 'not_found' };
  }
  return { type: 'success', faq };
}
