import type { Faq } from '../entities';

export interface FaqsRepository {
  create(faq: Faq): Promise<Faq>;
  findById(id: string): Promise<Faq | null>;
  findAll(): Promise<Faq[]>;
  update(id: string, updates: Partial<Omit<Faq, 'id' | 'created_at' | 'updated_at'>>): Promise<Faq | null>;
  delete(id: string): Promise<boolean>;
}
