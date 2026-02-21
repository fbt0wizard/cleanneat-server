import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { toApplicationResponse } from './application-response';
import { createApplication } from './create-application';
import { listApplications } from './list-applications';
import { markApplicationRead } from './mark-application-read';
import { updateApplicationStatus } from './update-application-status';

const applicationResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    full_name: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    location_postcode: { type: 'string' },
    role_type: { type: 'array', items: { type: 'string' } },
    availability: { type: 'array', items: { type: 'string' } },
    experience_summary: { type: 'string' },
    right_to_work_uk: { type: 'boolean' },
    dbs_status: { type: 'string' },
    references_contact_details: { type: 'string' },
    cv_file_url: { type: 'string' },
    id_file_url: { type: 'string', nullable: true },
    consent_recruitment_data_processing: { type: 'boolean' },
    status: { type: 'string' },
    internal_notes: { type: 'array', items: { type: 'string' } },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

export default async function applicationsController(fastify: FastifyInstance) {
  // POST /api/v1/applications – public (visitor submits application)
  fastify.route<{ Body: Record<string, unknown> }>({
    method: 'POST',
    url: '/api/v1/applications',
    schema: {
      summary: 'Submit a job application',
      description: 'Public endpoint for visitors to submit a job application. Returns a reference id.',
      tags: ['applications'],
      body: {
        type: 'object',
        required: [
          'full_name',
          'email',
          'phone',
          'location_postcode',
          'role_type',
          'availability',
          'experience_summary',
          'right_to_work_uk',
          'dbs_status',
          'references_contact_details',
          'cv_file_url',
          'consent_recruitment_data_processing',
        ],
        properties: {
          full_name: { type: 'string', maxLength: 255 },
          email: { type: 'string', format: 'email', maxLength: 255 },
          phone: { type: 'string', maxLength: 50 },
          location_postcode: { type: 'string', maxLength: 20 },
          role_type: {
            type: 'array',
            items: { type: 'string', enum: ['self_employed', 'employed', 'part_time', 'full_time'] },
          },
          availability: {
            type: 'array',
            items: { type: 'string', enum: ['weekdays', 'weekends', 'evenings'] },
          },
          experience_summary: { type: 'string', maxLength: 10000 },
          right_to_work_uk: { type: 'boolean' },
          dbs_status: { type: 'string', enum: ['have_dbs', 'need_dbs', 'willing_to_obtain'] },
          references_contact_details: { type: 'string', maxLength: 2000 },
          cv_file_url: { type: 'string', format: 'uri', maxLength: 2000 },
          id_file_url: { type: 'string', format: 'uri', maxLength: 2000 },
          consent_recruitment_data_processing: { type: 'boolean' },
        },
      },
      response: {
        201: {
          description: 'Application submitted',
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        400: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await createApplication(
        request.body as Parameters<typeof createApplication>[0],
        fastify.dependencies,
      );
      return match(result)
        .with({ type: 'success' }, ({ id }) => reply.status(201).send({ id }))
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // GET /api/v1/applications – authenticated (admin list)
  fastify.route({
    method: 'GET',
    url: '/api/v1/applications',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'List all applications',
      description: 'Fetch all job applications. Requires authentication.',
      tags: ['applications'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of applications',
          type: 'object',
          properties: {
            applications: {
              type: 'array',
              items: applicationResponseSchema,
            },
          },
          required: ['applications'],
        },
        401: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (_request, reply) => {
      const result = await listApplications({}, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ applications }) =>
          reply.status(200).send({
            applications: applications.map((a) => ({
              ...toApplicationResponse(a),
              created_at: a.created_at.toISOString(),
              updated_at: a.updated_at.toISOString(),
            })),
          }),
        )
        .exhaustive();
    },
  });

  // PATCH /api/v1/applications/:id/read – authenticated (mark as read, log admin)
  fastify.route<{ Params: { id: string } }>({
    method: 'PATCH',
    url: '/api/v1/applications/:id/read',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Mark application as read',
      description: 'Set application status to read and log the admin who marked it. Requires authentication.',
      tags: ['applications'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      response: {
        200: {
          description: 'Application marked as read',
          type: 'object',
          properties: { application: applicationResponseSchema },
          required: ['application'],
        },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      const result = await markApplicationRead({ applicationId: request.params.id, userId }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ application }) =>
          reply.status(200).send({
            application: {
              ...toApplicationResponse(application),
              created_at: application.created_at.toISOString(),
              updated_at: application.updated_at.toISOString(),
            },
          }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'Application not found', statusCode: 404 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // PATCH /api/v1/applications/:id/status – authenticated (change status, log admin)
  fastify.route<{
    Params: { id: string };
    Body: { status: string };
  }>({
    method: 'PATCH',
    url: '/api/v1/applications/:id/status',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Update application status',
      description: 'Set application status (new, read, contacted) and log the admin. Requires authentication.',
      tags: ['applications'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['new', 'read', 'contacted'] },
        },
      },
      response: {
        200: {
          description: 'Application status updated',
          type: 'object',
          properties: { application: applicationResponseSchema },
          required: ['application'],
        },
        401: { $ref: 'ErrorResponse#' },
        400: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      const result = await updateApplicationStatus(
        {
          applicationId: request.params.id,
          status: request.body.status as 'new' | 'read' | 'contacted',
          userId,
        },
        fastify.dependencies,
      );
      return match(result)
        .with({ type: 'success' }, ({ application }) =>
          reply.status(200).send({
            application: {
              ...toApplicationResponse(application),
              created_at: application.created_at.toISOString(),
              updated_at: application.updated_at.toISOString(),
            },
          }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'Application not found', statusCode: 404 }),
        )
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });
}
