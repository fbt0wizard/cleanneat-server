import type { Inquiry } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';

export type ListInquiriesResult = { type: 'success'; inquiries: Inquiry[] };

export async function listInquiries(
  _params: Record<string, never>,
  { logger, repositories }: UseCaseDependencies,
): Promise<ListInquiriesResult> {
  logger.info('Listing inquiries');

  const inquiries = await repositories.inquiriesRepository.findAll();
  return { type: 'success', inquiries };
}
