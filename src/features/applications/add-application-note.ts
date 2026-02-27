import type { Application, ApplicationInternalNote } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const paramsSchema = z.object({
  applicationId: z.string().min(1).max(100),
  note: z.string().min(1).max(5000),
  userId: z.string().uuid(),
});

export type AddApplicationNoteParams = z.input<typeof paramsSchema>;
export type AddApplicationNoteResult =
  | { type: 'success'; application: Application }
  | { type: 'not_found' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function addApplicationNote(
  params: AddApplicationNoteParams,
  deps: UseCaseDependencies,
): Promise<AddApplicationNoteResult> {
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

  const writer = await repositories.usersRepository.findById(validated.userId);
  const writerName = writer?.name ?? 'Unknown';
  const note: ApplicationInternalNote = {
    text: validated.note,
    writer_name: writerName,
    written_at: new Date().toISOString(),
  };

  try {
    const updated = await repositories.applicationsRepository.updateInternalNotes(validated.applicationId, [
      ...application.internal_notes,
      note,
    ]);
    if (!updated) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'add_application_note',
        entityType: 'application',
        entityId: updated.id,
        details: `Added note to application ${updated.id}`,
      },
      deps,
    );

    logger.info({ applicationId: updated.id, userId: validated.userId }, 'Application note added');
    return { type: 'success', application: updated };
  } catch (error) {
    logger.error({ error, applicationId: validated.applicationId }, 'Failed to add application note');
    return { type: 'error' };
  }
}
