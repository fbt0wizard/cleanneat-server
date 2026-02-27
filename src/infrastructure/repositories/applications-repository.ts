import { Application, type ApplicationInternalNote } from '@domain/entities';
import type { ApplicationsRepository } from '@domain/repositories';
import { type Application as ApplicationModel, Prisma, type PrismaClient } from '@prisma/client';

export function makeApplicationsRepository(db: PrismaClient): ApplicationsRepository {
  return {
    async create(application) {
      const record = await db.application.create({
        data: {
          id: application.id,
          full_name: application.full_name,
          email: application.email,
          phone: application.phone,
          location_postcode: application.location_postcode,
          role_type: application.role_type,
          availability: application.availability,
          experience_summary: application.experience_summary,
          right_to_work_uk: application.right_to_work_uk,
          dbs_status: application.dbs_status,
          references_contact_details: application.references_contact_details,
          cv_file_url: application.cv_file_url,
          id_file_url: application.id_file_url,
          consent_recruitment_data_processing: application.consent_recruitment_data_processing,
          status: application.status,
          internal_notes: application.internal_notes,
        },
      });
      return toEntity(record);
    },

    async findAll() {
      const records = await db.application.findMany({
        orderBy: { created_at: 'desc' },
      });
      return records.map(toEntity);
    },

    async findById(id) {
      const record = await db.application.findUnique({ where: { id } });
      if (!record) return null;
      return toEntity(record);
    },

    async updateStatus(id, status) {
      try {
        const record = await db.application.update({
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

    async updateInternalNotes(id, notes) {
      try {
        const record = await db.application.update({
          where: { id },
          data: { internal_notes: notes },
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

function toEntity(record: ApplicationModel): Application {
  const parsedNotes = Array.isArray(record.internal_notes)
    ? (record.internal_notes as unknown[]).flatMap((item) => {
        if (typeof item === 'string') {
          return [
            {
              text: item,
              writer_name: 'Unknown',
              written_at: record.created_at.toISOString(),
            } satisfies ApplicationInternalNote,
          ];
        }
        if (item && typeof item === 'object') {
          const candidate = item as Partial<ApplicationInternalNote>;
          if (
            typeof candidate.text === 'string' &&
            typeof candidate.writer_name === 'string' &&
            typeof candidate.written_at === 'string'
          ) {
            return [candidate as ApplicationInternalNote];
          }
        }
        return [];
      })
    : [];

  return new Application({
    id: record.id,
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    location_postcode: record.location_postcode,
    role_type: Array.isArray(record.role_type) ? (record.role_type as string[]) : [],
    availability: Array.isArray(record.availability) ? (record.availability as string[]) : [],
    experience_summary: record.experience_summary,
    right_to_work_uk: record.right_to_work_uk,
    dbs_status: record.dbs_status,
    references_contact_details: record.references_contact_details,
    cv_file_url: record.cv_file_url,
    id_file_url: record.id_file_url,
    consent_recruitment_data_processing: record.consent_recruitment_data_processing,
    status: record.status,
    internal_notes: parsedNotes,
    created_at: record.created_at,
    updated_at: record.updated_at,
  });
}
