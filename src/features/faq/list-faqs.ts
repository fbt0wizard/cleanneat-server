import type { Faq } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';

export type ListFaqsResult = { type: 'success'; faqs: Faq[] };

export async function listFaqs(
  _params: Record<string, never>,
  { logger, repositories }: UseCaseDependencies,
): Promise<ListFaqsResult> {
  logger.info('Listing FAQs');

  const faqs = await repositories.faqsRepository.findAll();
  return { type: 'success', faqs };
}
