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
    user_name: string;
    user_email: string;
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

  const userIds = [...new Set(logs.map((log) => log.userId))];
  const users = await repositories.usersRepository.findByIds(userIds);
  const userMap = new Map(users.map((u) => [u.id, { name: u.name, email: u.email }]));

  return {
    type: "success",
    logs: logs.map((log) => {
      const user = userMap.get(log.userId);
      return {
        id: log.id,
        userId: log.userId,
        user_name: user?.name ?? "",
        user_email: user?.email ?? "",
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        created_at: log.created_at.toISOString(),
      };
    }),
  };
}
