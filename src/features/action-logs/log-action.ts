import { randomUUID } from "node:crypto";
import { ActionLog } from "@domain/entities";
import type { UseCaseDependencies } from "@infrastructure/di";
import { z } from "zod";

const paramsSchema = z.object({
  userId: z.string().uuid(),
  action: z.string().min(1).max(100),
  entityType: z.string().max(50).nullable().optional(),
  entityId: z.string().max(255).nullable().optional(),
  details: z.string().nullable().optional(),
});

export type LogActionParams = z.input<typeof paramsSchema>;

/**
 * Records an action performed by a user. Does not throw; failures are logged only
 * so the main flow is never broken by logging.
 */
export async function logAction(
  params: LogActionParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<void> {
  try {
    const validated = paramsSchema.parse(params);

    const log = new ActionLog({
      id: randomUUID(),
      userId: validated.userId,
      action: validated.action,
      entityType: validated.entityType ?? null,
      entityId: validated.entityId ?? null,
      details: validated.details ?? null,
      created_at: new Date(),
    });

    await repositories.actionLogsRepository.create(log);
  } catch (error) {
    logger.warn({ error, action: params.action }, "Failed to write action log");
  }
}
