export class ActionLog {
  readonly id: string;
  readonly userId: string;
  readonly action: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly details: string | null;
  readonly created_at: Date;

  constructor(params: {
    id: string;
    userId: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    details: string | null;
    created_at: Date;
  }) {
    this.id = params.id;
    this.userId = params.userId;
    this.action = params.action;
    this.entityType = params.entityType;
    this.entityId = params.entityId;
    this.details = params.details;
    this.created_at = params.created_at;
  }
}
