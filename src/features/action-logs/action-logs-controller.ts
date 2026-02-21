import type { FastifyInstance } from "fastify";
import { match } from "ts-pattern";
import { listActionLogs } from "./list-action-logs";

export default async function actionLogsController(fastify: FastifyInstance) {
  fastify.route<{
    Querystring: { user_id?: string; limit?: number };
  }>({
    method: "GET",
    url: "/api/v1/action-logs",
    preHandler: [fastify.authenticate],
    schema: {
      summary: "List action logs",
      description:
        "List actions performed by users. Authenticated users can filter by their own user_id or list all (admin).",
      tags: ["action-logs"],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          user_id: { type: "string", format: "uuid" },
          limit: { type: "integer", minimum: 1, maximum: 500, default: 100 },
        },
      },
      response: {
        200: {
          description: "Action logs",
          type: "object",
          properties: {
            logs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  userId: { type: "string" },
                  user_name: { type: "string" },
                  user_email: { type: "string" },
                  action: { type: "string" },
                  entityType: { type: "string", nullable: true },
                  entityId: { type: "string", nullable: true },
                  details: { type: "string", nullable: true },
                  created_at: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        401: { $ref: "ErrorResponse#" },
      },
    },
    handler: async (request, reply) => {
      const result = await listActionLogs(
        {
          userId: request.query.user_id,
          limit: request.query.limit,
        },
        fastify.dependencies
      );

      return match(result)
        .with({ type: "success" }, ({ logs }) =>
          reply.status(200).send({ logs })
        )
        .exhaustive();
    },
  });
}
