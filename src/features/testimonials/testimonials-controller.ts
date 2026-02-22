import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { createTestimonial } from './create-testimonial';
import { deleteTestimonial } from './delete-testimonial';
import { listPublishedTestimonials } from './list-published-testimonials';
import { listTestimonials } from './list-testimonials';
import { updateTestimonial } from './update-testimonial';

const testimonialResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name_public: { type: 'string' },
    location_public: { type: 'string' },
    rating: { type: 'integer' },
    text: { type: 'string' },
    status: { type: 'string' },
    is_published: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

function toTestimonialResponse(t: {
  id: string;
  name_public: string;
  location_public: string;
  rating: number;
  text: string;
  status: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: t.id,
    name_public: t.name_public,
    location_public: t.location_public,
    rating: t.rating,
    text: t.text,
    status: t.status,
    is_published: t.is_published,
  };
}

export default async function testimonialsController(fastify: FastifyInstance) {
  // POST /api/v1/testimonials – public (visitor submits testimonial)
  fastify.route<{ Body: Record<string, unknown> }>({
    method: 'POST',
    url: '/api/v1/testimonials',
    schema: {
      summary: 'Submit a testimonial',
      description: 'Public endpoint for visitors to submit a testimonial. Stored as pending and unpublished.',
      tags: ['testimonials'],
      body: {
        type: 'object',
        required: ['name_public', 'location_public', 'rating', 'text'],
        properties: {
          name_public: { type: 'string', maxLength: 255 },
          location_public: { type: 'string', maxLength: 255 },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          text: { type: 'string', maxLength: 5000 },
        },
      },
      response: {
        201: {
          description: 'Testimonial submitted',
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        400: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await createTestimonial(
        request.body as Parameters<typeof createTestimonial>[0],
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

  // GET /api/v1/testimonials/public – public (published only)
  fastify.route({
    method: 'GET',
    url: '/api/v1/testimonials/public',
    schema: {
      summary: 'List published testimonials',
      description: 'Public endpoint. Returns only published testimonials for display on the site.',
      tags: ['testimonials'],
      response: {
        200: {
          description: 'List of published testimonials',
          type: 'object',
          properties: {
            testimonials: {
              type: 'array',
              items: testimonialResponseSchema,
            },
          },
          required: ['testimonials'],
        },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (_request, reply) => {
      const result = await listPublishedTestimonials({}, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ testimonials }) =>
          reply.status(200).send({
            testimonials: testimonials.map((t) => ({
              ...toTestimonialResponse(t),
              created_at: t.created_at.toISOString(),
              updated_at: t.updated_at.toISOString(),
            })),
          }),
        )
        .exhaustive();
    },
  });

  // GET /api/v1/testimonials – authenticated (admin list all)
  fastify.route({
    method: 'GET',
    url: '/api/v1/testimonials',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'List all testimonials',
      description: 'Fetch all testimonials. Requires authentication.',
      tags: ['testimonials'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of testimonials',
          type: 'object',
          properties: {
            testimonials: {
              type: 'array',
              items: testimonialResponseSchema,
            },
          },
          required: ['testimonials'],
        },
        401: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      const result = await listTestimonials({ userId }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ testimonials }) =>
          reply.status(200).send({
            testimonials: testimonials.map((t) => ({
              ...toTestimonialResponse(t),
              created_at: t.created_at.toISOString(),
              updated_at: t.updated_at.toISOString(),
            })),
          }),
        )
        .exhaustive();
    },
  });

  // PATCH /api/v1/testimonials/:id – authenticated (publish/unpublish or status)
  fastify.route<{
    Params: { id: string };
    Body: { is_published?: boolean; status?: string };
  }>({
    method: 'PATCH',
    url: '/api/v1/testimonials/:id',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Update testimonial',
      description: 'Set is_published and/or status. Requires authentication.',
      tags: ['testimonials'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      body: {
        type: 'object',
        properties: {
          is_published: { type: 'boolean' },
          status: { type: 'string', maxLength: 50 },
        },
      },
      response: {
        200: {
          description: 'Testimonial updated',
          type: 'object',
          properties: { testimonial: testimonialResponseSchema },
          required: ['testimonial'],
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
      const { is_published, status } = request.body ?? {};
      if (is_published === undefined && status === undefined) {
        return reply.status(400).send({
          message: 'At least one of is_published or status is required',
          statusCode: 400,
        });
      }
      const result = await updateTestimonial(
        { id: request.params.id, userId, is_published, status },
        fastify.dependencies,
      );
      return match(result)
        .with({ type: 'success' }, ({ testimonial }) =>
          reply.status(200).send({
            testimonial: {
              ...toTestimonialResponse(testimonial),
              created_at: testimonial.created_at.toISOString(),
              updated_at: testimonial.updated_at.toISOString(),
            },
          }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'Testimonial not found', statusCode: 404 }),
        )
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // DELETE /api/v1/testimonials/:id – authenticated
  fastify.route<{ Params: { id: string } }>({
    method: 'DELETE',
    url: '/api/v1/testimonials/:id',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Delete testimonial',
      description: 'Delete a testimonial. Requires authentication.',
      tags: ['testimonials'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      response: {
        204: { description: 'Testimonial deleted' },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      const result = await deleteTestimonial({ id: request.params.id, userId }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, () => reply.status(204).send())
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'Testimonial not found', statusCode: 404 }),
        )
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });
}
