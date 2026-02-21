import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { login } from './login';

export default async function authController(fastify: FastifyInstance) {
  fastify.route<{ Body: { email: string; password: string } }>({
    method: 'POST',
    url: '/api/v1/login',
    schema: {
      summary: 'Login with email and password',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com',
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'securePassword123',
          },
        },
      },
      response: {
        200: {
          description: 'Login successful',
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
            token: { type: 'string' },
          },
          required: ['user', 'token'],
        },
        401: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const result = await login(
        {
          email: request.body.email,
          password: request.body.password,
        },
        fastify.dependencies,
      );

      return match(result)
        .with({ type: 'success' }, ({ user, token }) => reply.status(200).send({ user, token }))
        .with({ type: 'invalid_credentials' }, () =>
          reply.status(401).send({ message: 'Invalid email or password', statusCode: 401 }),
        )
        .with({ type: 'error' }, () =>
          reply.status(500).send({ message: 'Internal server error', statusCode: 500 }),
        )
        .exhaustive();
    },
  });
}
