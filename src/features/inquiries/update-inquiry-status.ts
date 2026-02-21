import type { Inquiry } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const statusEnum = z.enum(['new', 'read', 'contacted']);

const paramsSchema = z.object({
  inquiryId: z.string().min(1).max(100),
  status: statusEnum,
  userId: z.string().uuid(),
});

export type UpdateInquiryStatusParams = z.input<typeof paramsSchema>;
export type UpdateInquiryStatusResult =
  | { type: 'success'; inquiry: Inquiry }
  | { type: 'not_found' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function updateInquiryStatus(
  params: UpdateInquiryStatusParams,
  deps: UseCaseDependencies,
): Promise<UpdateInquiryStatusResult> {
  const { logger, repositories } = deps;

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  const existing = await repositories.inquiriesRepository.findById(validated.inquiryId);
  if (!existing) {
    return { type: 'not_found' };
  }

  try {
    const inquiry = await repositories.inquiriesRepository.updateStatus(validated.inquiryId, validated.status);
    if (!inquiry) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'update_inquiry_status',
        entityType: 'inquiry',
        entityId: inquiry.id,
        details: `Updated inquiry ${inquiry.id} status to ${validated.status}`,
      },
      deps,
    );

    logger.info(
      { inquiryId: validated.inquiryId, status: validated.status, userId: validated.userId },
      'Inquiry status updated',
    );
    return { type: 'success', inquiry };
  } catch (error) {
    logger.error({ error, inquiryId: validated.inquiryId }, 'Failed to update inquiry status');
    return { type: 'error' };
  }
}
