import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { getSettings } from './get-settings';
import { toSettingsResponse } from './settings-response';
import { upsertSettings } from './upsert-settings';

const settingsResponseSchema = {
  type: 'object',
  properties: {
    primary_phone: { type: 'string', nullable: true },
    primary_email: { type: 'string', nullable: true },
    office_hours_text: { type: 'string', nullable: true },
    service_area_text: { type: 'string', nullable: true },
    service_area_postcodes: { type: 'array', items: { type: 'string' }, nullable: true },
    hero_badge_text: { type: 'string', nullable: true },
    hero_headline: { type: 'string', nullable: true },
    hero_headline_highlight: { type: 'string', nullable: true },
    hero_subtext: { type: 'string', nullable: true },
    hero_images: { type: 'array', items: { type: 'string' }, nullable: true },
    social_facebook: { type: 'string', nullable: true },
    social_instagram: { type: 'string', nullable: true },
    social_twitter: { type: 'string', nullable: true },
    social_linkedin: { type: 'string', nullable: true },
    logo_url: { type: 'string', nullable: true },
    favicon_url: { type: 'string', nullable: true },
  },
};

const settingsBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    primary_phone: { type: 'string', maxLength: 50, nullable: true },
    primary_email: { type: 'string', format: 'email', maxLength: 255, nullable: true },
    office_hours_text: { type: 'string', maxLength: 1000, nullable: true },
    service_area_text: { type: 'string', maxLength: 1000, nullable: true },
    service_area_postcodes: { type: 'array', items: { type: 'string', maxLength: 20 }, nullable: true },
    hero_badge_text: { type: 'string', maxLength: 255, nullable: true },
    hero_headline: { type: 'string', maxLength: 500, nullable: true },
    hero_headline_highlight: { type: 'string', maxLength: 255, nullable: true },
    hero_subtext: { type: 'string', maxLength: 2000, nullable: true },
    hero_images: { type: 'array', items: { type: 'string', format: 'uri' }, nullable: true },
    social_facebook: { type: 'string', format: 'uri', maxLength: 500, nullable: true },
    social_instagram: { type: 'string', format: 'uri', maxLength: 500, nullable: true },
    social_twitter: { type: 'string', format: 'uri', maxLength: 500, nullable: true },
    social_linkedin: { type: 'string', format: 'uri', maxLength: 500, nullable: true },
    logo_url: { type: 'string', format: 'uri', maxLength: 500, nullable: true },
    favicon_url: { type: 'string', format: 'uri', maxLength: 500, nullable: true },
  },
};

export default async function settingsController(fastify: FastifyInstance) {
  fastify.route({
    method: 'GET',
    url: '/api/v1/settings',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Get settings',
      description: 'Returns the current settings. Requires authentication.',
      tags: ['settings'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Settings retrieved successfully',
          type: 'object',
          properties: { settings: settingsResponseSchema },
          required: ['settings'],
        },
        404: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (_request, reply) => {
      const result = await getSettings({}, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ settings }) =>
          reply.status(200).send({ settings: toSettingsResponse(settings) }),
        )
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'Settings not found', statusCode: 404 }),
        )
        .exhaustive();
    },
  });

  fastify.route<{
    Body: Record<string, unknown>;
  }>({
    method: 'POST',
    url: '/api/v1/settings',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Create or update settings',
      description:
        'Creates settings if none exist, or updates existing settings. All fields are optional. Requires authentication.',
      tags: ['settings'],
      security: [{ bearerAuth: [] }],
      body: settingsBodySchema,
      response: {
        200: {
          description: 'Settings saved successfully',
          type: 'object',
          properties: { settings: settingsResponseSchema },
          required: ['settings'],
        },
        400: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await upsertSettings(request.body as Parameters<typeof upsertSettings>[0], fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ settings }) =>
          reply.status(200).send({ settings: toSettingsResponse(settings) }),
        )
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () =>
          reply.status(500).send({ message: 'Internal server error', statusCode: 500 }),
        )
        .exhaustive();
    },
  });
}
