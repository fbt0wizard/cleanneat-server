import { Inquiry } from '@domain/entities';
import type { InquiriesRepository } from '@domain/repositories';
import { type Inquiry as InquiryModel, Prisma, type PrismaClient } from '@prisma/client';

export function makeInquiriesRepository(db: PrismaClient): InquiriesRepository {
  return {
    async create(inquiry) {
      const record = await db.inquiry.create({
        data: {
          id: inquiry.id,
          requester_type: inquiry.requester_type,
          full_name: inquiry.full_name,
          email: inquiry.email,
          phone: inquiry.phone,
          preferred_contact_method: inquiry.preferred_contact_method,
          address_line: inquiry.address_line,
          postcode: inquiry.postcode,
          service_type: inquiry.service_type,
          property_type: inquiry.property_type,
          bedrooms: inquiry.bedrooms,
          bathrooms: inquiry.bathrooms,
          preferred_start_date: inquiry.preferred_start_date,
          frequency: inquiry.frequency,
          cleaning_scope_notes: inquiry.cleaning_scope_notes,
          access_needs_or_preferences: inquiry.access_needs_or_preferences,
          consent_to_contact: inquiry.consent_to_contact,
          consent_data_processing: inquiry.consent_data_processing,
          status: inquiry.status,
          internal_notes: inquiry.internal_notes,
        },
      });
      return toEntity(record);
    },

    async findAll() {
      const records = await db.inquiry.findMany({
        orderBy: { created_at: 'desc' },
      });
      return records.map(toEntity);
    },

    async findById(id) {
      const record = await db.inquiry.findUnique({ where: { id } });
      if (!record) return null;
      return toEntity(record);
    },

    async updateStatus(id, status) {
      try {
        const record = await db.inquiry.update({
          where: { id },
          data: { status },
        });
        return toEntity(record);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          return null;
        }
        throw error;
      }
    },
  };
}

function toEntity(record: InquiryModel): Inquiry {
  return new Inquiry({
    id: record.id,
    requester_type: record.requester_type,
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    preferred_contact_method: record.preferred_contact_method,
    address_line: record.address_line,
    postcode: record.postcode,
    service_type: Array.isArray(record.service_type) ? (record.service_type as string[]) : [],
    property_type: record.property_type,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    preferred_start_date: record.preferred_start_date,
    frequency: record.frequency,
    cleaning_scope_notes: record.cleaning_scope_notes,
    access_needs_or_preferences: record.access_needs_or_preferences,
    consent_to_contact: record.consent_to_contact,
    consent_data_processing: record.consent_data_processing,
    status: record.status,
    internal_notes: Array.isArray(record.internal_notes) ? (record.internal_notes as string[]) : [],
    created_at: record.created_at,
    updated_at: record.updated_at,
  });
}
