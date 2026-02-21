import { ActionLog } from "@domain/entities";
import type { ActionLogsRepository } from "@domain/repositories";
import type { PrismaClient, ActionLog as ActionLogModel } from "@prisma/client";

export function makeActionLogsRepository(
  db: PrismaClient,
): ActionLogsRepository {
  return {
    async create(log) {
      const record = await db.actionLog.create({
        data: {
          id: log.id,
          userId: log.userId,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          details: log.details,
        },
      });
      return toEntity(record);
    },

    async findByUserId(userId, limit = 100) {
      const records = await db.actionLog.findMany({
        where: { userId },
        orderBy: { created_at: "desc" },
        take: limit,
      });
      return records.map(toEntity);
    },

    async findAll(limit = 100) {
      const records = await db.actionLog.findMany({
        orderBy: { created_at: "desc" },
        take: limit,
      });
      return records.map(toEntity);
    },
  };
}

function toEntity(record: ActionLogModel): ActionLog {
  return new ActionLog({
    id: record.id,
    userId: record.userId,
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    details: record.details,
    created_at: record.created_at,
  });
}
