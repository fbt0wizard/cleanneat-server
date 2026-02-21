import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { createFaq } from './create-faq';
import { deleteFaq } from './delete-faq';
import { getFaq } from './get-faq';
import { toFaqResponse } from './faq-response';
import { listFaqs } from './list-faqs';
import { updateFaq } from './update-faq';

const faqResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    question: { type: 'string' },
    answer: { type: 'string' },
    category: { type: 'string' },
    is_published: { type: 'boolean' },
    sort_order: { type: 'integer' },
  },
  required: ['id', 'question', 'answer', 'category', 'is_published', 'sort_order'],
};

export default async function faqController(fastify: FastifyInstance) {
  // GET /api/v1/faqs - List all FAQs
  fastify.route({
    method: 'GET',
    url: '/api/v1/faqs',
    schema: {
      summary: 'List all FAQs',
      tags: ['faqs'],
      response: {
        200: {
          description: 'FAQs retrieved successfully',
          type: 'object',
          properties: {
            faqs: {
              type: 'array',
              items: faqResponseSchema,
            },
          },
          required: ['faqs'],
        },
      },
    },
    handler: async (request, reply) => {
      const result = await listFaqs({}, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ faqs }) =>
          reply.status(200).send({ faqs: faqs.map(toFaqResponse) }),
        )
        .exhaustive();
    },
  });

  // GET /api/v1/faqs/:id - Get FAQ by ID
  fastify.route<{ Params: { id: string } }>({
    method: 'GET',
    url: '/api/v1/faqs/:id',
    schema: {
      summary: 'Get FAQ by ID',
      tags: ['faqs'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: {
          description: 'FAQ retrieved successfully',
          type: 'object',
          properties: { faq: faqResponseSchema },
          required: ['faq'],
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await getFaq({ id: request.params.id }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ faq }) =>
          reply.status(200).send({ faq: toFaqResponse(faq) }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'FAQ not found', statusCode: 404 }),
        )
        .exhaustive();
    },
  });

  // POST /api/v1/faqs - Create FAQ (authenticated)
  fastify.route<{
    Body: {
      question: string;
      answer: string;
      category: string;
      is_published?: boolean;
      sort_order?: number;
    };
  }>({
    method: 'POST',
    url: '/api/v1/faqs',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Create a new FAQ',
      tags: ['faqs'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['question', 'answer', 'category'],
        properties: {
          question: { type: 'string', minLength: 1 },
          answer: { type: 'string', minLength: 1 },
          category: { type: 'string', minLength: 1, maxLength: 255 },
          is_published: { type: 'boolean' },
          sort_order: { type: 'integer' },
        },
      },
      response: {
        201: {
          description: 'FAQ created successfully',
          type: 'object',
          properties: { faq: faqResponseSchema },
          required: ['faq'],
        },
        401: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await createFaq(
        {
          question: request.body.question,
          answer: request.body.answer,
          category: request.body.category,
          isPublished: request.body.is_published ?? false,
          sortOrder: request.body.sort_order ?? 0,
        },
        fastify.dependencies,
      );
      return match(result)
        .with({ type: 'success' }, ({ faq }) =>
          reply.status(201).send({ faq: toFaqResponse(faq) }),
        )
        .with({ type: 'error' }, () =>
          reply.status(500).send({ message: 'Internal server error', statusCode: 500 }),
        )
        .exhaustive();
    },
  });

  // PUT /api/v1/faqs/:id - Update FAQ (authenticated)
  fastify.route<{
    Params: { id: string };
    Body: {
      question?: string;
      answer?: string;
      category?: string;
      is_published?: boolean;
      sort_order?: number;
    };
  }>({
    method: 'PUT',
    url: '/api/v1/faqs/:id',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Update FAQ',
      tags: ['faqs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      body: {
        type: 'object',
        properties: {
          question: { type: 'string', minLength: 1 },
          answer: { type: 'string', minLength: 1 },
          category: { type: 'string', minLength: 1, maxLength: 255 },
          is_published: { type: 'boolean' },
          sort_order: { type: 'integer' },
        },
      },
      response: {
        200: {
          description: 'FAQ updated successfully',
          type: 'object',
          properties: { faq: faqResponseSchema },
          required: ['faq'],
        },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await updateFaq(
        {
          id: request.params.id,
          ...(request.body.question !== undefined && { question: request.body.question }),
          ...(request.body.answer !== undefined && { answer: request.body.answer }),
          ...(request.body.category !== undefined && { category: request.body.category }),
          ...(request.body.is_published !== undefined && { isPublished: request.body.is_published }),
          ...(request.body.sort_order !== undefined && { sortOrder: request.body.sort_order }),
        },
        fastify.dependencies,
      );
      return match(result)
        .with({ type: 'success' }, ({ faq }) =>
          reply.status(200).send({ faq: toFaqResponse(faq) }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'FAQ not found', statusCode: 404 }),
        )
        .with({ type: 'error' }, () =>
          reply.status(500).send({ message: 'Internal server error', statusCode: 500 }),
        )
        .exhaustive();
    },
  });

  // DELETE /api/v1/faqs/:id - Delete FAQ (authenticated)
  fastify.route<{ Params: { id: string } }>({
    method: 'DELETE',
    url: '/api/v1/faqs/:id',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Delete FAQ',
      tags: ['faqs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: {
          description: 'FAQ deleted successfully',
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await deleteFaq({ id: request.params.id }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, () =>
          reply.status(200).send({ message: 'FAQ deleted successfully' }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'FAQ not found', statusCode: 404 }),
        )
        .with({ type: 'error' }, () =>
          reply.status(500).send({ message: 'Internal server error', statusCode: 500 }),
        )
        .exhaustive();
    },
  });
}
