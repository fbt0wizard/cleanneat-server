import type { Application } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const paramsSchema = z.object({
  applicationId: z.string().min(1).max(100),
  noteIndex: z.coerce.number().int().min(0),
  userId: z.string().uuid(),
});

export type DeleteApplicationNoteParams = z.input<typeof paramsSchema>;
export type DeleteApplicationNoteResult =
  | { type: 'success'; application: Application }
  | { type: 'not_found' }
  | { type: 'note_not_found' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function deleteApplicationNote(
  params: DeleteApplicationNoteParams,
  deps: UseCaseDependencies,
): Promise<DeleteApplicationNoteResult> {
  const { logger, repositories } = deps;

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  const application = await repositories.applicationsRepository.findById(validated.applicationId);
  if (!application) {
    return { type: 'not_found' };
  }

  if (validated.noteIndex < 0 || validated.noteIndex >= application.internal_notes.length) {
    return { type: 'note_not_found' };
  }

  const updatedNotes = application.internal_notes.filter((_, index) => index !== validated.noteIndex);

  try {
    const updated = await repositories.applicationsRepository.updateInternalNotes(
      validated.applicationId,
      updatedNotes,
    );
    if (!updated) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'delete_application_note',
        entityType: 'application',
        entityId: updated.id,
        details: `Deleted note index ${validated.noteIndex} from application ${updated.id}`,
      },
      deps,
    );

    logger.info(
      { applicationId: updated.id, noteIndex: validated.noteIndex, userId: validated.userId },
      'Application note deleted',
    );
    return { type: 'success', application: updated };
  } catch (error) {
    logger.error({ error, applicationId: validated.applicationId }, 'Failed to delete application note');
    return { type: 'error' };
  }
}
