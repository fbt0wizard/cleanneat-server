import type { Application } from '@domain/entities';

export function toApplicationResponse(application: Application) {
  return {
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
    created_at: application.created_at,
    updated_at: application.updated_at,
  };
}
