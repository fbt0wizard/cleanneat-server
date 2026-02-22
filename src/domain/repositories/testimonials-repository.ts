import type { Testimonial } from '../entities';

export interface TestimonialsRepository {
  create(testimonial: Testimonial): Promise<Testimonial>;
  findAll(): Promise<Testimonial[]>;
  findById(id: string): Promise<Testimonial | null>;
  update(id: string, updates: { is_published?: boolean; status?: string }): Promise<Testimonial | null>;
  delete(id: string): Promise<boolean>;
}
