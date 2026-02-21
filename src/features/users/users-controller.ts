import type { FastifyInstance } from "fastify";
import { match } from "ts-pattern";
import { createUser } from "./create-user";
import { listUsers } from "./list-users";

export default async function usersController(fastify: FastifyInstance) {
  fastify.route<{ Body: { name: string; email: string; password: string } }>({
    method: "POST",
    url: "/api/v1/users",
    preHandler: [fastify.authenticate],
    schema: {
      summary: "Create a new user",
      description: "Create a new user. Requires authentication.",
      tags: ["users"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            description: "User full name",
            example: "John Doe",
          },
          email: {
            type: "string",
            format: "email",
            maxLength: 255,
            description: "User email address",
            example: "john.doe@example.com",
          },
          password: {
            type: "string",
            minLength: 8,
            maxLength: 255,
            description: "User password (minimum 8 characters)",
            example: "securePassword123",
          },
        },
      },
      response: {
        201: {
          description: "User created successfully",
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
              },
              required: ["id", "name", "email"],
            },
          },
          required: ["user"],
        },
        409: { $ref: "ErrorResponse#" },
        500: { $ref: "ErrorResponse#" },
      },
    },
    handler: async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ message: "Unauthorized", statusCode: 401 });
      }
      const result = await createUser(
        {
          name: request.body.name,
          email: request.body.email,
          password: request.body.password,
          createdByUserId: userId,
        },
        fastify.dependencies,
      );

      return match(result)
        .with({ type: "success" }, ({ user }) => reply.status(201).send({ user }))
        .with({ type: "email_taken" }, () =>
          reply.status(409).send({ message: "Email already registered", statusCode: 409 }),
        )
        .with({ type: "error" }, () =>
          reply.status(500).send({ message: "Internal server error", statusCode: 500 }),
        )
        .exhaustive();
    },
  });

  fastify.route({
    method: "GET",
    url: "/api/v1/users",
    preHandler: [fastify.authenticate],
    schema: {
      summary: "List all users",
      description: "Fetch all users. Requires authentication.",
      tags: ["users"],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: "List of users",
          type: "object",
          properties: {
            users: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string" },
                  created_at: { type: "string", format: "date-time" },
                  updated_at: { type: "string", format: "date-time" },
                },
                required: ["id", "name", "email", "created_at", "updated_at"],
              },
            },
          },
          required: ["users"],
        },
        401: { $ref: "ErrorResponse#" },
        500: { $ref: "ErrorResponse#" },
      },
    },
    handler: async (request, reply) => {
      const result = await listUsers({}, fastify.dependencies);

      return match(result)
        .with({ type: "success" }, ({ users }) =>
          reply.status(200).send({
            users: users.map((u) => ({
              ...u,
              created_at: u.created_at.toISOString(),
              updated_at: u.updated_at.toISOString(),
            })),
          }),
        )
        .with({ type: "error" }, () =>
          reply.status(500).send({ message: "Internal server error", statusCode: 500 }),
        )
        .exhaustive();
    },
  });
}
