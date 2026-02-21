import type { UseCaseDependencies } from "@infrastructure/di";
import { z } from "zod";

const paramsSchema = z.object({
  userId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
});

export type ListActionLogsParams = z.input<typeof paramsSchema>;
export type ListActionLogsResult = {
  type: "success";
  logs: Array<{
    id: string;
    userId: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    details: string | null;
    created_at: string;
  }>;
};

export async function listActionLogs(
  params: ListActionLogsParams,
  { logger, repositories }: UseCaseDependencies,
): Promise<ListActionLogsResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ userId: validated.userId }, "Listing action logs");

  const logs = validated.userId
    ? await repositories.actionLogsRepository.findByUserId(
        validated.userId,
        validated.limit,
      )
    : await repositories.actionLogsRepository.findAll(validated.limit);

  return {
    type: "success",
    logs: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      created_at: log.created_at.toISOString(),
    })),
  };
}
