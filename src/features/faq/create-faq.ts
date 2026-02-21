import { randomUUID } from 'node:crypto';
import { Faq } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';

const paramsSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1).max(255),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export type CreateFaqParams = z.input<typeof paramsSchema>;
export type CreateFaqResult = { type: 'success'; faq: Faq } | { type: 'error' };

export async function createFaq(
  params: CreateFaqParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<CreateFaqResult> {
  logger.info({ category: params.category }, 'Creating FAQ');

  const validated = paramsSchema.parse(params);

  try {
    const faq = new Faq({
      id: randomUUID(),
      question: validated.question,
      answer: validated.answer,
      category: validated.category,
      isPublished: validated.isPublished,
      sortOrder: validated.sortOrder,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const created = await repositories.faqsRepository.create(faq);
    logger.info({ faqId: created.id }, 'FAQ created');
    return { type: 'success', faq: created };
  } catch (error) {
    logger.error({ error }, 'Failed to create FAQ');
    return { type: 'error' };
  }
}
