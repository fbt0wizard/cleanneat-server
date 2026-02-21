import type { Application } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const paramsSchema = z.object({
  applicationId: z.string().min(1).max(100),
  userId: z.string().uuid(),
});

export type MarkApplicationReadParams = z.input<typeof paramsSchema>;
export type MarkApplicationReadResult =
  | { type: 'success'; application: Application }
  | { type: 'not_found' }
  | { type: 'error' };

export async function markApplicationRead(
  params: MarkApplicationReadParams,
  deps: UseCaseDependencies,
): Promise<MarkApplicationReadResult> {
  const { logger, repositories } = deps;

  const validated = paramsSchema.parse(params);

  const existing = await repositories.applicationsRepository.findById(validated.applicationId);
  if (!existing) {
    return { type: 'not_found' };
  }

  try {
    const application = await repositories.applicationsRepository.updateStatus(validated.applicationId, 'read');
    if (!application) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'mark_application_read',
        entityType: 'application',
        entityId: application.id,
        details: `Marked application ${application.id} (${application.email}) as read`,
      },
      deps,
    );

    logger.info({ applicationId: validated.applicationId, userId: validated.userId }, 'Application marked as read');
    return { type: 'success', application };
  } catch (error) {
    logger.error({ error, applicationId: validated.applicationId }, 'Failed to mark application as read');
    return { type: 'error' };
  }
}
