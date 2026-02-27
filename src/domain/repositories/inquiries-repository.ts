import type { Inquiry, InquiryInternalNote } from '../entities';

export interface InquiriesRepository {
  create(inquiry: Inquiry): Promise<Inquiry>;
  findAll(): Promise<Inquiry[]>;
  findById(id: string): Promise<Inquiry | null>;
  updateStatus(id: string, status: string): Promise<Inquiry | null>;
  updateInternalNotes(id: string, notes: InquiryInternalNote[]): Promise<Inquiry | null>;
}
