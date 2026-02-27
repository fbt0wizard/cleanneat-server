import type { Inquiry, InquiryInternalNote } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const paramsSchema = z.object({
  inquiryId: z.string().min(1).max(100),
  note: z.string().min(1).max(5000),
  userId: z.string().uuid(),
});

export type AddInquiryNoteParams = z.input<typeof paramsSchema>;
export type AddInquiryNoteResult =
  | { type: 'success'; inquiry: Inquiry }
  | { type: 'not_found' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function addInquiryNote(
  params: AddInquiryNoteParams,
  deps: UseCaseDependencies,
): Promise<AddInquiryNoteResult> {
  const { logger, repositories } = deps;

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  const inquiry = await repositories.inquiriesRepository.findById(validated.inquiryId);
  if (!inquiry) {
    return { type: 'not_found' };
  }

  const writer = await repositories.usersRepository.findById(validated.userId);
  const writerName = writer?.name ?? 'Unknown';
  const note: InquiryInternalNote = {
    text: validated.note,
    writer_name: writerName,
    written_at: new Date().toISOString(),
  };

  try {
    const updated = await repositories.inquiriesRepository.updateInternalNotes(validated.inquiryId, [
      ...inquiry.internal_notes,
      note,
    ]);
    if (!updated) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'add_inquiry_note',
        entityType: 'inquiry',
        entityId: updated.id,
        details: `Added note to inquiry ${updated.id}`,
      },
      deps,
    );

    logger.info({ inquiryId: updated.id, userId: validated.userId }, 'Inquiry note added');
    return { type: 'success', inquiry: updated };
  } catch (error) {
    logger.error({ error, inquiryId: validated.inquiryId }, 'Failed to add inquiry note');
    return { type: 'error' };
  }
}
