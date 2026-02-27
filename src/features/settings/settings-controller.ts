import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { getSettings } from './get-settings';
import { getWhoWeSupport } from './get-who-we-support';
import { toSettingsResponse } from './settings-response';
import { upsertSettings } from './upsert-settings';
import { upsertWhoWeSupport } from './upsert-who-we-support';

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

const whoWeSupportSchema = {
  type: 'object',
  properties: {
    section_title: { type: 'string' },
    section_intro: { type: 'string' },
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['label', 'description'],
      },
    },
  },
  required: ['section_title', 'section_intro', 'groups'],
};

export default async function settingsController(fastify: FastifyInstance) {
  // GET /api/v1/settings/public – unauthenticated (for landing page, footer, etc.)
  fastify.route({
    method: 'GET',
    url: '/api/v1/settings/public',
    schema: {
      summary: 'Get settings (public)',
      description: 'Returns all settings data. No authentication required. Use for public-facing pages.',
      tags: ['settings'],
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
        .with({ type: 'success' }, ({ settings }) => reply.status(200).send({ settings: toSettingsResponse(settings) }))
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'Settings not found', statusCode: 404 }))
        .exhaustive();
    },
  });

  fastify.route({
    method: 'GET',
    url: '/api/v1/settings/who-we-support',
    schema: {
      summary: 'Get who we support content',
      description: 'Returns who-we-support section content.',
      tags: ['settings'],
      response: {
        200: whoWeSupportSchema,
        404: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (_request, reply) => {
      const result = await getWhoWeSupport({}, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ who_we_support }) => reply.status(200).send(who_we_support))
        .with({ type: 'not_found' }, () =>
          reply.status(404).send({ message: 'Who we support settings not found', statusCode: 404 }),
        )
        .exhaustive();
    },
  });

  fastify.route({
    method: 'GET',
    url: '/api/v1/settings',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Get settings (admin)',
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
        .with({ type: 'success' }, ({ settings }) => reply.status(200).send({ settings: toSettingsResponse(settings) }))
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'Settings not found', statusCode: 404 }))
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
        .with({ type: 'success' }, ({ settings }) => reply.status(200).send({ settings: toSettingsResponse(settings) }))
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  fastify.route<{
    Body: Record<string, unknown>;
  }>({
    method: 'PATCH',
    url: '/api/v1/settings/who-we-support',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Create or update who we support content',
      description: 'Creates who-we-support settings when missing, otherwise updates existing data.',
      tags: ['settings'],
      security: [{ bearerAuth: [] }],
      body: {
        ...whoWeSupportSchema,
        additionalProperties: false,
      },
      response: {
        200: whoWeSupportSchema,
        400: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await upsertWhoWeSupport(
        request.body as Parameters<typeof upsertWhoWeSupport>[0],
        fastify.dependencies,
      );
      return match(result)
        .with({ type: 'success' }, ({ who_we_support }) => reply.status(200).send(who_we_support))
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });
}
