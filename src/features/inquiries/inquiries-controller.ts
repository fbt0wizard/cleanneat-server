import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { createInquiry } from './create-inquiry';

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
}
