import type { Application } from '../entities';

export interface ApplicationsRepository {
  create(application: Application): Promise<Application>;
  findAll(): Promise<Application[]>;
  findById(id: string): Promise<Application | null>;
  updateStatus(id: string, status: string): Promise<Application | null>;
}
