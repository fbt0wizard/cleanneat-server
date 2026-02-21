import type { Service } from '../entities';

export interface ServicesRepository {
  create(service: Service): Promise<Service>;
  update(id: string, updates: Partial<Service>): Promise<Service | null>;
  findById(id: string): Promise<Service | null>;
  findBySlug(slug: string): Promise<Service | null>;
  findByUserId(userId: string): Promise<Service[]>;
  findAll(): Promise<Service[]>;
  delete(id: string): Promise<boolean>;
}
