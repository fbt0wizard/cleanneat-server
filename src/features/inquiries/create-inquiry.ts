import { Inquiry } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const requesterTypeEnum = z.enum(['client', 'family', 'advocate', 'support_worker', 'commissioner', 'other']);
const preferredContactEnum = z.enum(['phone', 'email']);
const serviceTypeEnum = z.enum(['regular', 'deep', 'kitchen_bath', 'move_in_out', 'other']);
const propertyTypeEnum = z.enum(['flat', 'house', 'other']);
const frequencyEnum = z.enum(['one_off', 'weekly', 'fortnightly', 'monthly']);

const bodySchema = z.object({
  requester_type: requesterTypeEnum,
  full_name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().min(1).max(50),
  preferred_contact_method: preferredContactEnum,
  address_line: z.string().min(1).max(500),
  postcode: z.string().min(1).max(20),
  service_type: z.array(serviceTypeEnum).min(1),
  property_type: propertyTypeEnum,
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  preferred_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  frequency: frequencyEnum,
  cleaning_scope_notes: z.string().min(1).max(5000),
  access_needs_or_preferences: z.string().max(2000).optional(),
  consent_to_contact: z.boolean(),
  consent_data_processing: z.boolean(),
});

export type CreateInquiryParams = z.input<typeof bodySchema>;
export type CreateInquiryResult =
  | { type: 'success'; id: string }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function createInquiry(
  params: CreateInquiryParams,
  deps: UseCaseDependencies,
): Promise<CreateInquiryResult> {
  const { logger, repositories, mailer } = deps;

  const parsed = bodySchema.safeParse(params);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, 'Inquiry validation failed');
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  const inquiryId = `inq_${nanoid()}`;
  const now = new Date();

  try {
    const inquiry = new Inquiry({
      id: inquiryId,
      requester_type: validated.requester_type,
      full_name: validated.full_name,
      email: validated.email,
      phone: validated.phone,
      preferred_contact_method: validated.preferred_contact_method,
      address_line: validated.address_line,
      postcode: validated.postcode,
      service_type: validated.service_type,
      property_type: validated.property_type,
      bedrooms: validated.bedrooms,
      bathrooms: validated.bathrooms,
      preferred_start_date: validated.preferred_start_date ?? null,
      frequency: validated.frequency,
      cleaning_scope_notes: validated.cleaning_scope_notes,
      access_needs_or_preferences: validated.access_needs_or_preferences ?? null,
      consent_to_contact: validated.consent_to_contact,
      consent_data_processing: validated.consent_data_processing,
      status: 'new',
      internal_notes: [],
      created_at: now,
      updated_at: now,
    });

    await repositories.inquiriesRepository.create(inquiry);

    logger.info({ inquiryId, email: validated.email, full_name: validated.full_name }, 'Quote request submitted');

    try {
      await mailer.sendInquiryConfirmation(validated.email, validated.full_name, inquiryId);
    } catch (error_) {
      const err = error_ instanceof Error ? error_ : new Error(String(error_));
      logger.warn(
        { err: err.message, inquiryId, email: validated.email },
        'Inquiry confirmation email failed; inquiry already saved',
      );
      // Still return success – inquiry is stored; email is best-effort for this flow
    }

    return { type: 'success', id: inquiryId };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error({ err: { message: err.message, name: err.name }, email: validated.email }, 'Failed to create inquiry');
    return { type: 'error' };
  }
}
