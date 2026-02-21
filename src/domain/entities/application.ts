export class Application {
  readonly id: string;
  readonly full_name: string;
  readonly email: string;
  readonly phone: string;
  readonly location_postcode: string;
  readonly role_type: string[];
  readonly availability: string[];
  readonly experience_summary: string;
  readonly right_to_work_uk: boolean;
  readonly dbs_status: string;
  readonly references_contact_details: string;
  readonly cv_file_url: string;
  readonly id_file_url: string | null;
  readonly consent_recruitment_data_processing: boolean;
  readonly status: string;
  readonly internal_notes: string[];
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(params: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    location_postcode: string;
    role_type: string[];
    availability: string[];
    experience_summary: string;
    right_to_work_uk: boolean;
    dbs_status: string;
    references_contact_details: string;
    cv_file_url: string;
    id_file_url: string | null;
    consent_recruitment_data_processing: boolean;
    status: string;
    internal_notes: string[];
    created_at: Date;
    updated_at: Date;
  }) {
    this.id = params.id;
    this.full_name = params.full_name;
    this.email = params.email;
    this.phone = params.phone;
    this.location_postcode = params.location_postcode;
    this.role_type = params.role_type;
    this.availability = params.availability;
    this.experience_summary = params.experience_summary;
    this.right_to_work_uk = params.right_to_work_uk;
    this.dbs_status = params.dbs_status;
    this.references_contact_details = params.references_contact_details;
    this.cv_file_url = params.cv_file_url;
    this.id_file_url = params.id_file_url;
    this.consent_recruitment_data_processing = params.consent_recruitment_data_processing;
    this.status = params.status;
    this.internal_notes = params.internal_notes;
    this.created_at = params.created_at;
    this.updated_at = params.updated_at;
  }
}
