import type { Inquiry } from '../entities';

export interface InquiriesRepository {
  create(inquiry: Inquiry): Promise<Inquiry>;
}
