import type { Inquiry } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const paramsSchema = z.object({
  inquiryId: z.string().min(1).max(100),
  userId: z.string().uuid(),
});

export type MarkInquiryReadParams = z.input<typeof paramsSchema>;
export type MarkInquiryReadResult = { type: 'success'; inquiry: Inquiry } | { type: 'not_found' } | { type: 'error' };

export async function markInquiryRead(
  params: MarkInquiryReadParams,
  deps: UseCaseDependencies,
): Promise<MarkInquiryReadResult> {
  const { logger, repositories } = deps;

  const validated = paramsSchema.parse(params);

  const existing = await repositories.inquiriesRepository.findById(validated.inquiryId);
  if (!existing) {
    return { type: 'not_found' };
  }

  try {
    const inquiry = await repositories.inquiriesRepository.updateStatus(validated.inquiryId, 'read');
    if (!inquiry) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'mark_inquiry_read',
        entityType: 'inquiry',
        entityId: inquiry.id,
        details: `Marked inquiry ${inquiry.id} (${inquiry.email}) as read`,
      },
      deps,
    );

    logger.info({ inquiryId: validated.inquiryId, userId: validated.userId }, 'Inquiry marked as read');
    return { type: 'success', inquiry };
  } catch (error) {
    logger.error({ error, inquiryId: validated.inquiryId }, 'Failed to mark inquiry as read');
    return { type: 'error' };
  }
}
