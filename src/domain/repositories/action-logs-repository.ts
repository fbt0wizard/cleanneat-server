import type { ActionLog } from "../entities";

export interface ActionLogsRepository {
  create(log: ActionLog): Promise<ActionLog>;
  findByUserId(userId: string, limit?: number): Promise<ActionLog[]>;
  findAll(limit?: number): Promise<ActionLog[]>;
}
