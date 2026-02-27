import type { Inquiry } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const paramsSchema = z.object({
  inquiryId: z.string().min(1).max(100),
  noteIndex: z.coerce.number().int().min(0),
  userId: z.string().uuid(),
});

export type DeleteInquiryNoteParams = z.input<typeof paramsSchema>;
export type DeleteInquiryNoteResult =
  | { type: 'success'; inquiry: Inquiry }
  | { type: 'not_found' }
  | { type: 'note_not_found' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function deleteInquiryNote(
  params: DeleteInquiryNoteParams,
  deps: UseCaseDependencies,
): Promise<DeleteInquiryNoteResult> {
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

  if (validated.noteIndex < 0 || validated.noteIndex >= inquiry.internal_notes.length) {
    return { type: 'note_not_found' };
  }

  const updatedNotes = inquiry.internal_notes.filter((_, index) => index !== validated.noteIndex);

  try {
    const updated = await repositories.inquiriesRepository.updateInternalNotes(validated.inquiryId, updatedNotes);
    if (!updated) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'delete_inquiry_note',
        entityType: 'inquiry',
        entityId: updated.id,
        details: `Deleted note index ${validated.noteIndex} from inquiry ${updated.id}`,
      },
      deps,
    );

    logger.info(
      { inquiryId: updated.id, noteIndex: validated.noteIndex, userId: validated.userId },
      'Inquiry note deleted',
    );
    return { type: 'success', inquiry: updated };
  } catch (error) {
    logger.error({ error, inquiryId: validated.inquiryId }, 'Failed to delete inquiry note');
    return { type: 'error' };
  }
}
