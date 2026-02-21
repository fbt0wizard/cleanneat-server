import { Application } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const roleTypeEnum = z.enum(['self_employed', 'employed', 'part_time', 'full_time']);
const availabilityEnum = z.enum(['weekdays', 'weekends', 'evenings']);
const dbsStatusEnum = z.enum(['have_dbs', 'need_dbs', 'willing_to_obtain']);

const bodySchema = z.object({
  full_name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().min(1).max(50),
  location_postcode: z.string().min(1).max(20),
  role_type: z.array(roleTypeEnum).min(1),
  availability: z.array(availabilityEnum).min(1),
  experience_summary: z.string().min(1).max(10000),
  right_to_work_uk: z.boolean(),
  dbs_status: dbsStatusEnum,
  references_contact_details: z.string().min(1).max(2000),
  cv_file_url: z.string().url().max(2000),
  id_file_url: z.string().url().max(2000).optional(),
  consent_recruitment_data_processing: z.boolean(),
});

export type CreateApplicationParams = z.input<typeof bodySchema>;
export type CreateApplicationResult =
  | { type: 'success'; id: string }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function createApplication(
  params: CreateApplicationParams,
  deps: UseCaseDependencies,
): Promise<CreateApplicationResult> {
  const { logger, repositories, mailer } = deps;

  const parsed = bodySchema.safeParse(params);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, 'Application validation failed');
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  const applicationId = `app_${nanoid()}`;
  const now = new Date();

  try {
    const application = new Application({
      id: applicationId,
      full_name: validated.full_name,
      email: validated.email,
      phone: validated.phone,
      location_postcode: validated.location_postcode,
      role_type: validated.role_type,
      availability: validated.availability,
      experience_summary: validated.experience_summary,
      right_to_work_uk: validated.right_to_work_uk,
      dbs_status: validated.dbs_status,
      references_contact_details: validated.references_contact_details,
      cv_file_url: validated.cv_file_url,
      id_file_url: validated.id_file_url ?? null,
      consent_recruitment_data_processing: validated.consent_recruitment_data_processing,
      status: 'new',
      internal_notes: [],
      created_at: now,
      updated_at: now,
    });

    await repositories.applicationsRepository.create(application);

    logger.info({ applicationId, email: validated.email, full_name: validated.full_name }, 'Job application submitted');

    try {
      await mailer.sendApplicationConfirmation(validated.email, validated.full_name, applicationId);
    } catch (error_) {
      const err = error_ instanceof Error ? error_ : new Error(String(error_));
      logger.warn(
        { err: err.message, applicationId, email: validated.email },
        'Application confirmation email failed; application already saved',
      );
    }

    return { type: 'success', id: applicationId };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      { err: { message: err.message, name: err.name }, email: validated.email },
      'Failed to create application',
    );
    return { type: 'error' };
  }
}
