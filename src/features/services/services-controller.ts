import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { createService } from './create-service';
import { deleteService } from './delete-service';
import { getService } from './get-service';
import { listServices } from './list-services';
import { updateService } from './update-service';

export default async function servicesController(fastify: FastifyInstance) {
  // POST /api/v1/services - Create service
  fastify.route<{
    Body: {
      title: string;
      slug: string;
      short_description: string;
      long_description: string;
      whats_included?: string[];
      whats_not_included?: string[];
      typical_duration: string;
      price_from: string;
      image_url?: string | null;
      is_published?: boolean;
      sort_order?: number;
    };
  }>({
    method: 'POST',
    url: '/api/v1/services',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Create a new service',
      tags: ['services'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'slug', 'short_description', 'long_description', 'typical_duration', 'price_from'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          slug: { type: 'string', minLength: 1, maxLength: 255 },
          short_description: { type: 'string', minLength: 1, maxLength: 500 },
          long_description: { type: 'string', minLength: 1 },
          whats_included: { type: 'array', items: { type: 'string' } },
          whats_not_included: { type: 'array', items: { type: 'string' } },
          typical_duration: { type: 'string', minLength: 1, maxLength: 100 },
          price_from: { type: 'string', minLength: 1, maxLength: 50 },
          image_url: { type: 'string', format: 'uri', nullable: true },
          is_published: { type: 'boolean' },
          sort_order: { type: 'integer' },
        },
      },
      response: {
        201: {
          description: 'Service created successfully',
          type: 'object',
          properties: {
            service: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                slug: { type: 'string' },
                userId: { type: 'string' },
              },
            },
          },
        },
        401: { $ref: 'ErrorResponse#' },
        400: { $ref: 'ErrorResponse#' },
        409: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      }

      const result = await createService(
        {
          title: request.body.title,
          slug: request.body.slug,
          shortDescription: request.body.short_description,
          longDescription: request.body.long_description,
          whatsIncluded: request.body.whats_included ?? [],
          whatsNotIncluded: request.body.whats_not_included ?? [],
          typicalDuration: request.body.typical_duration,
          priceFrom: request.body.price_from,
          imageUrl: request.body.image_url ?? null,
          isPublished: request.body.is_published ?? false,
          sortOrder: request.body.sort_order ?? 0,
          userId: request.userId,
        },
        fastify.dependencies,
      );

      return match(result)
        .with({ type: 'success' }, ({ service }) =>
          reply.status(201).send({
            service: {
              id: service.id,
              title: service.title,
              slug: service.slug,
              userId: service.userId,
            },
          }),
        )
        .with({ type: 'slug_taken' }, () =>
          reply.status(409).send({ message: 'Slug already taken', statusCode: 409 }),
        )
        .with({ type: 'user_not_found' }, () =>
          reply.status(404).send({ message: 'User not found', statusCode: 404 }),
        )
        .with({ type: 'error' }, () =>
          reply.status(500).send({ message: 'Internal server error', statusCode: 500 }),
        )
        .exhaustive();
    },
  });

  // GET /api/v1/services - List all services (optionally filtered by user_id)
  fastify.route<{ Querystring: { user_id?: string } }>({
    method: 'GET',
    url: '/api/v1/services',
    schema: {
      summary: 'List all services',
      tags: ['services'],
      querystring: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          description: 'Services retrieved successfully',
          type: 'object',
          properties: {
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  slug: { type: 'string' },
                  userId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const result = await listServices(
        { userId: request.query.user_id },
        fastify.dependencies,
      );

      return match(result)
        .with({ type: 'success' }, ({ services }) => reply.status(200).send({ services }))
        .exhaustive();
    },
  });

  // GET /api/v1/services/:id - Get service by ID
  fastify.route<{ Params: { id: string } }>({
    method: 'GET',
    url: '/api/v1/services/:id',
    schema: {
      summary: 'Get service by ID',
      tags: ['services'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          description: 'Service retrieved successfully',
          type: 'object',
          properties: {
            service: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                slug: { type: 'string' },
                userId: { type: 'string' },
              },
            },
          },
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await getService({ id: request.params.id }, fastify.dependencies);

      return match(result)
        .with({ type: 'success' }, ({ service }) =>
          reply.status(200).send({
            service: {
              id: service.id,
              title: service.title,
              slug: service.slug,
              userId: service.userId,
            },
          }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'Service not found', statusCode: 404 }),
        )
        .exhaustive();
    },
  });

  // PUT /api/v1/services/:id - Update service
  fastify.route<{
    Params: { id: string };
    Body: {
      title?: string;
      slug?: string;
      short_description?: string;
      long_description?: string;
      whats_included?: string[];
      whats_not_included?: string[];
      typical_duration?: string;
      price_from?: string;
      image_url?: string | null;
      is_published?: boolean;
      sort_order?: number;
    };
  }>({
    method: 'PUT',
    url: '/api/v1/services/:id',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Update service',
      tags: ['services'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          slug: { type: 'string', minLength: 1, maxLength: 255 },
          short_description: { type: 'string', minLength: 1, maxLength: 500 },
          long_description: { type: 'string', minLength: 1 },
          whats_included: { type: 'array', items: { type: 'string' } },
          whats_not_included: { type: 'array', items: { type: 'string' } },
          typical_duration: { type: 'string', minLength: 1, maxLength: 100 },
          price_from: { type: 'string', minLength: 1, maxLength: 50 },
          image_url: { type: 'string', format: 'uri', nullable: true },
          is_published: { type: 'boolean' },
          sort_order: { type: 'integer' },
        },
      },
      response: {
        200: {
          description: 'Service updated successfully',
          type: 'object',
          properties: {
            service: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                slug: { type: 'string' },
                userId: { type: 'string' },
              },
            },
          },
        },
        401: { $ref: 'ErrorResponse#' },
        403: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        409: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      }

      // Check if user owns the service
      const existingService = await fastify.dependencies.repositories.servicesRepository.findById(
        request.params.id,
      );
      if (!existingService) {
        return reply.status(404).send({ message: 'Service not found', statusCode: 404 });
      }
      if (existingService.userId !== request.userId) {
        return reply.status(403).send({ message: 'Forbidden: You can only update your own services', statusCode: 403 });
      }

      const result = await updateService(
        {
          id: request.params.id,
          ...(request.body.title !== undefined && { title: request.body.title }),
          ...(request.body.slug !== undefined && { slug: request.body.slug }),
          ...(request.body.short_description !== undefined && {
            shortDescription: request.body.short_description,
          }),
          ...(request.body.long_description !== undefined && {
            longDescription: request.body.long_description,
          }),
          ...(request.body.whats_included !== undefined && { whatsIncluded: request.body.whats_included }),
          ...(request.body.whats_not_included !== undefined && {
            whatsNotIncluded: request.body.whats_not_included,
          }),
          ...(request.body.typical_duration !== undefined && {
            typicalDuration: request.body.typical_duration,
          }),
          ...(request.body.price_from !== undefined && { priceFrom: request.body.price_from }),
          ...(request.body.image_url !== undefined && { imageUrl: request.body.image_url }),
          ...(request.body.is_published !== undefined && { isPublished: request.body.is_published }),
          ...(request.body.sort_order !== undefined && { sortOrder: request.body.sort_order }),
        },
        fastify.dependencies,
      );

      return match(result)
        .with({ type: 'success' }, ({ service }) =>
          reply.status(200).send({
            service: {
              id: service.id,
              title: service.title,
              slug: service.slug,
              userId: service.userId,
            },
          }),
        )
        .with({ type: 'slug_taken' }, () =>
          reply.status(409).send({ message: 'Slug already taken', statusCode: 409 }),
        )
        .with({ type: 'error' }, () =>
          reply.status(500).send({ message: 'Internal server error', statusCode: 500 }),
        )
        .exhaustive();
    },
  });

  // DELETE /api/v1/services/:id - Delete service
  fastify.route<{ Params: { id: string } }>({
    method: 'DELETE',
    url: '/api/v1/services/:id',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Delete service',
      tags: ['services'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          description: 'Service deleted successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: { $ref: 'ErrorResponse#' },
        403: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      }

      // Check if user owns the service
      const existingService = await fastify.dependencies.repositories.servicesRepository.findById(
        request.params.id,
      );
      if (!existingService) {
        return reply.status(404).send({ message: 'Service not found', statusCode: 404 });
      }
      if (existingService.userId !== request.userId) {
        return reply.status(403).send({ message: 'Forbidden: You can only delete your own services', statusCode: 403 });
      }

      const result = await deleteService({ id: request.params.id }, fastify.dependencies);

      return match(result)
        .with({ type: 'success' }, () =>
          reply.status(200).send({ message: 'Service deleted successfully' }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'Service not found', statusCode: 404 }),
        )
        .with({ type: 'error' }, () =>
          reply.status(500).send({ message: 'Internal server error', statusCode: 500 }),
        )
        .exhaustive();
    },
  });
}
