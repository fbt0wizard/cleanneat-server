import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { createInquiry } from './create-inquiry';
import { toInquiryResponse } from './inquiry-response';
import { listInquiries } from './list-inquiries';
import { markInquiryRead } from './mark-inquiry-read';
import { updateInquiryStatus } from './update-inquiry-status';

const inquiryResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    requester_type: { type: 'string' },
    full_name: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    preferred_contact_method: { type: 'string' },
    address_line: { type: 'string' },
    postcode: { type: 'string' },
    service_type: { type: 'array', items: { type: 'string' } },
    property_type: { type: 'string' },
    bedrooms: { type: 'integer' },
    bathrooms: { type: 'integer' },
    preferred_start_date: { type: 'string', nullable: true },
    frequency: { type: 'string' },
    cleaning_scope_notes: { type: 'string' },
    access_needs_or_preferences: { type: 'string', nullable: true },
    consent_to_contact: { type: 'boolean' },
    consent_data_processing: { type: 'boolean' },
    status: { type: 'string' },
    internal_notes: { type: 'array', items: { type: 'string' } },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

export default async function inquiriesController(fastify: FastifyInstance) {
  fastify.route<{
    Body: Record<string, unknown>;
  }>({
    method: 'POST',
    url: '/api/v1/inquiries',
    schema: {
      summary: 'Submit a quote request',
      description:
        'Public endpoint for visitors to submit a cleaning quote request. Sends a confirmation email and returns a reference id.',
      tags: ['inquiries'],
      body: {
        type: 'object',
        required: [
          'requester_type',
          'full_name',
          'email',
          'phone',
          'preferred_contact_method',
          'address_line',
          'postcode',
          'service_type',
          'property_type',
          'bedrooms',
          'bathrooms',
          'frequency',
          'cleaning_scope_notes',
          'consent_to_contact',
          'consent_data_processing',
        ],
        properties: {
          requester_type: {
            type: 'string',
            enum: ['client', 'family', 'advocate', 'support_worker', 'commissioner', 'other'],
          },
          full_name: { type: 'string', maxLength: 255 },
          email: { type: 'string', format: 'email', maxLength: 255 },
          phone: { type: 'string', maxLength: 50 },
          preferred_contact_method: { type: 'string', enum: ['phone', 'email'] },
          address_line: { type: 'string', maxLength: 500 },
          postcode: { type: 'string', maxLength: 20 },
          service_type: {
            type: 'array',
            items: { type: 'string', enum: ['regular', 'deep', 'kitchen_bath', 'move_in_out', 'other'] },
          },
          property_type: { type: 'string', enum: ['flat', 'house', 'other'] },
          bedrooms: { type: 'integer', minimum: 0 },
          bathrooms: { type: 'integer', minimum: 0 },
          preferred_start_date: { type: 'string', format: 'date' },
          frequency: { type: 'string', enum: ['one_off', 'weekly', 'fortnightly', 'monthly'] },
          cleaning_scope_notes: { type: 'string', maxLength: 5000 },
          access_needs_or_preferences: { type: 'string', maxLength: 2000 },
          consent_to_contact: { type: 'boolean' },
          consent_data_processing: { type: 'boolean' },
        },
      },
      response: {
        201: {
          description: 'Quote request submitted',
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        400: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await createInquiry(request.body as Parameters<typeof createInquiry>[0], fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ id }) => reply.status(201).send({ id }))
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // GET /api/v1/inquiries – authenticated (admin list)
  fastify.route({
    method: 'GET',
    url: '/api/v1/inquiries',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'List all inquiries',
      description: 'Fetch all quote requests (inquiries). Requires authentication.',
      tags: ['inquiries'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of inquiries',
          type: 'object',
          properties: {
            inquiries: {
              type: 'array',
              items: inquiryResponseSchema,
            },
          },
          required: ['inquiries'],
        },
        401: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (_request, reply) => {
      const result = await listInquiries({}, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ inquiries }) =>
          reply.status(200).send({
            inquiries: inquiries.map((i) => ({
              ...toInquiryResponse(i),
              created_at: i.created_at.toISOString(),
              updated_at: i.updated_at.toISOString(),
            })),
          }),
        )
        .exhaustive();
    },
  });

  // PATCH /api/v1/inquiries/:id/read – authenticated (mark as read, log admin)
  fastify.route<{ Params: { id: string } }>({
    method: 'PATCH',
    url: '/api/v1/inquiries/:id/read',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Mark inquiry as read',
      description: 'Set inquiry status to read and log the admin who marked it. Requires authentication.',
      tags: ['inquiries'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      response: {
        200: {
          description: 'Inquiry marked as read',
          type: 'object',
          properties: { inquiry: inquiryResponseSchema },
          required: ['inquiry'],
        },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      const result = await markInquiryRead({ inquiryId: request.params.id, userId }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ inquiry }) =>
          reply.status(200).send({
            inquiry: {
              ...toInquiryResponse(inquiry),
              created_at: inquiry.created_at.toISOString(),
              updated_at: inquiry.updated_at.toISOString(),
            },
          }),
        )
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'Inquiry not found', statusCode: 404 }))
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // PATCH /api/v1/inquiries/:id/status – authenticated (change status, log admin)
  fastify.route<{
    Params: { id: string };
    Body: { status: string };
  }>({
    method: 'PATCH',
    url: '/api/v1/inquiries/:id/status',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Update inquiry status',
      description: 'Set inquiry status (new, read, contacted) and log the admin. Requires authentication.',
      tags: ['inquiries'],
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
          description: 'Inquiry status updated',
          type: 'object',
          properties: { inquiry: inquiryResponseSchema },
          required: ['inquiry'],
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
      const result = await updateInquiryStatus(
        {
          inquiryId: request.params.id,
          status: request.body.status as 'new' | 'read' | 'contacted',
          userId,
        },
        fastify.dependencies,
      );
      return match(result)
        .with({ type: 'success' }, ({ inquiry }) =>
          reply.status(200).send({
            inquiry: {
              ...toInquiryResponse(inquiry),
              created_at: inquiry.created_at.toISOString(),
              updated_at: inquiry.updated_at.toISOString(),
            },
          }),
        )
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'Inquiry not found', statusCode: 404 }))
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });
}
