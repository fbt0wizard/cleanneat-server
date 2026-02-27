import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { changePassword } from './change-password';
import { createUser } from './create-user';
import { deactivateUser } from './deactivate-user';
import { deleteUser } from './delete-user';
import { listUsers } from './list-users';
import { reactivateUser } from './reactivate-user';

export default async function usersController(fastify: FastifyInstance) {
  fastify.route<{ Body: { name: string; email: string } }>({
    method: 'POST',
    url: '/api/v1/users',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Create a new user',
      description:
        'Create a new user with a randomly generated password. Credentials are sent to the user by email. Requires authentication.',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'User full name',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            description: 'User email address (credentials will be sent here)',
            example: 'john.doe@example.com',
          },
        },
      },
      response: {
        201: {
          description: 'User created successfully',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
              required: ['id', 'name', 'email'],
            },
          },
          required: ['user'],
        },
        409: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      }
      const result = await createUser(
        {
          name: request.body.name,
          email: request.body.email,
          createdByUserId: userId,
        },
        fastify.dependencies,
      );

      return match(result)
        .with({ type: 'success' }, ({ user }) => reply.status(201).send({ user }))
        .with({ type: 'email_taken' }, () =>
          reply.status(409).send({ message: 'Email already registered', statusCode: 409 }),
        )
        .with({ type: 'email_failed' }, () =>
          reply.status(503).send({
            message: 'Could not deliver credentials email; user was not created',
            statusCode: 503,
          }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  fastify.route({
    method: 'GET',
    url: '/api/v1/users',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'List all users',
      description: 'Fetch all users. Requires authentication.',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of users',
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  is_active: { type: 'boolean' },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'name', 'email', 'is_active', 'created_at', 'updated_at'],
              },
            },
          },
          required: ['users'],
        },
        401: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await listUsers({}, fastify.dependencies);

      return match(result)
        .with({ type: 'success' }, ({ users }) =>
          reply.status(200).send({
            users: users.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              is_active: u.is_active,
              created_at: u.created_at.toISOString(),
              updated_at: u.updated_at.toISOString(),
            })),
          }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // PATCH /api/v1/users/me/password
  fastify.route<{ Body: { old_password: string; new_password: string } }>({
    method: 'PATCH',
    url: '/api/v1/users/me/password',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Change my password',
      description:
        'Change the password for the currently authenticated user. Requires current password and a strong new password.',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['old_password', 'new_password'],
        properties: {
          old_password: {
            type: 'string',
            minLength: 1,
            description: 'Current password',
          },
          new_password: {
            type: 'string',
            minLength: 12,
            description:
              'New password (min 12 chars, must include uppercase, lowercase, number, and special character)',
          },
        },
      },
      response: {
        200: {
          description: 'Password changed successfully',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
          required: ['message'],
        },
        400: { $ref: 'ErrorResponse#' },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      }

      const result = await changePassword(
        {
          userId,
          old_password: request.body.old_password,
          new_password: request.body.new_password,
        },
        fastify.dependencies,
      );

      return match(result)
        .with({ type: 'success' }, () => reply.status(200).send({ message: 'Password changed successfully' }))
        .with({ type: 'invalid_old_password' }, () =>
          reply.status(400).send({ message: 'Current password is incorrect', statusCode: 400 }),
        )
        .with({ type: 'same_password' }, () =>
          reply.status(400).send({
            message: 'New password must be different from current password',
            statusCode: 400,
          }),
        )
        .with({ type: 'validation_error' }, ({ message }) =>
          reply.status(400).send({ message: `Validation failed: ${message}`, statusCode: 400 }),
        )
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'User not found', statusCode: 404 }))
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // DELETE /api/v1/users/:id
  fastify.route<{ Params: { id: string } }>({
    method: 'DELETE',
    url: '/api/v1/users/:id',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Delete a user',
      description: 'Permanently delete a user. Requires authentication.',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: {
          description: 'User deleted successfully',
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      }
      const result = await deleteUser({ id: request.params.id, deletedByUserId: userId }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, () => reply.status(200).send({ message: 'User deleted successfully' }))
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'User not found', statusCode: 404 }))
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // POST /api/v1/users/:id/deactivate
  fastify.route<{ Params: { id: string } }>({
    method: 'POST',
    url: '/api/v1/users/:id/deactivate',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Deactivate a user',
      description: 'Deactivate a user. Deactivated users cannot log in. Requires authentication.',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: {
          description: 'User deactivated successfully',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                is_active: { type: 'boolean' },
              },
              required: ['id', 'name', 'email', 'is_active'],
            },
          },
          required: ['user'],
        },
        400: { $ref: 'ErrorResponse#' },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      }
      const result = await deactivateUser({ id: request.params.id, deactivatedByUserId: userId }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ user }) => reply.status(200).send({ user }))
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'User not found', statusCode: 404 }))
        .with({ type: 'already_inactive' }, () =>
          reply.status(400).send({
            message: 'User is already deactivated',
            statusCode: 400,
          }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });

  // POST /api/v1/users/:id/reactivate
  fastify.route<{ Params: { id: string } }>({
    method: 'POST',
    url: '/api/v1/users/:id/reactivate',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Reactivate a user',
      description: 'Reactivate a deactivated user so they can log in again. Requires authentication.',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: {
          description: 'User reactivated successfully',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                is_active: { type: 'boolean' },
              },
              required: ['id', 'name', 'email', 'is_active'],
            },
          },
          required: ['user'],
        },
        400: { $ref: 'ErrorResponse#' },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized', statusCode: 401 });
      }
      const result = await reactivateUser({ id: request.params.id, reactivatedByUserId: userId }, fastify.dependencies);
      return match(result)
        .with({ type: 'success' }, ({ user }) => reply.status(200).send({ user }))
        .with({ type: 'not_found' }, () => reply.status(404).send({ message: 'User not found', statusCode: 404 }))
        .with({ type: 'already_active' }, () =>
          reply.status(400).send({
            message: 'User is already active',
            statusCode: 400,
          }),
        )
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });
}
