import type { Inquiry } from '@domain/entities';

export function toInquiryResponse(inquiry: Inquiry) {
  return {
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
  };
}
