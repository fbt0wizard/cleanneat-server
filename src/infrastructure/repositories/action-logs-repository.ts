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
          user_id: log.userId,
          action: log.action,
          entity_type: log.entityType,
          entity_id: log.entityId,
          details: log.details,
        },
      });
      return toEntity(record);
    },

    async findByUserId(userId, limit = 100) {
      const records = await db.actionLog.findMany({
        where: { user_id: userId },
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
    userId: record.user_id,
    action: record.action,
    entityType: record.entity_type,
    entityId: record.entity_id,
    details: record.details,
    created_at: record.created_at,
  });
}
