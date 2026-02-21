import type { Application } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const statusEnum = z.enum(['new', 'read', 'contacted']);

const paramsSchema = z.object({
  applicationId: z.string().min(1).max(100),
  status: statusEnum,
  userId: z.string().uuid(),
});

export type UpdateApplicationStatusParams = z.input<typeof paramsSchema>;
export type UpdateApplicationStatusResult =
  | { type: 'success'; application: Application }
  | { type: 'not_found' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function updateApplicationStatus(
  params: UpdateApplicationStatusParams,
  deps: UseCaseDependencies,
): Promise<UpdateApplicationStatusResult> {
  const { logger, repositories } = deps;

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  const existing = await repositories.applicationsRepository.findById(validated.applicationId);
  if (!existing) {
    return { type: 'not_found' };
  }

  try {
    const application = await repositories.applicationsRepository.updateStatus(
      validated.applicationId,
      validated.status,
    );
    if (!application) return { type: 'not_found' };

    await logAction(
      {
        userId: validated.userId,
        action: 'update_application_status',
        entityType: 'application',
        entityId: application.id,
        details: `Updated application ${application.id} status to ${validated.status}`,
      },
      deps,
    );

    logger.info(
      { applicationId: validated.applicationId, status: validated.status, userId: validated.userId },
      'Application status updated',
    );
    return { type: 'success', application };
  } catch (error) {
    logger.error({ error, applicationId: validated.applicationId }, 'Failed to update application status');
    return { type: 'error' };
  }
}
