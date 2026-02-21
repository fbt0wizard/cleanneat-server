import fs from 'node:fs';
import path from 'node:path';
import Multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';
import { match } from 'ts-pattern';
import { uploadFile } from './upload-file';

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

async function streamToBuffer(stream: AsyncIterable<Buffer>, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    total += chunk.length;
    if (total > maxBytes) throw new Error('FILE_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function uploadController(fastify: FastifyInstance) {
  const { config } = fastify.dependencies;
  const uploadDir = path.join(process.cwd(), config.uploadDir);

  await fastify.register(Multipart, {
    limits: {
      fileSize: MAX_SIZE_BYTES,
      files: 1,
    },
  });

  // Protected uploads: only authenticated users can read files. Path is /uploads (no /api/v1).
  fastify.route<{ Params: { filename: string } }>({
    method: 'GET',
    url: '/uploads/:filename',
    preHandler: [fastify.authenticate],
    schema: {
      summary: 'Get uploaded file',
      description: 'Serve an uploaded file. Requires authentication. Path: /uploads/:filename (no /api/v1).',
      tags: ['upload'],
      params: {
        type: 'object',
        required: ['filename'],
        properties: { filename: { type: 'string' } },
      },
      response: {
        200: { description: 'File content' },
        401: { $ref: 'ErrorResponse#' },
        404: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const { filename } = request.params;
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return reply.status(400).send({ message: 'Invalid filename', statusCode: 400 });
      }
      const filePath = path.join(uploadDir, filename);
      try {
        const stat = await fs.promises.stat(filePath);
        if (!stat.isFile()) return reply.status(404).send({ message: 'Not found', statusCode: 404 });
      } catch {
        return reply.status(404).send({ message: 'Not found', statusCode: 404 });
      }
      const ext = path.extname(filename).slice(1).toLowerCase();
      const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
      return reply.type(mime).send(fs.createReadStream(filePath));
    },
  });

  fastify.route({
    method: 'POST',
    url: '/api/v1/upload',
    schema: {
      summary: 'Upload a file',
      description:
        'Upload a single file (PDF or image: JPEG, PNG, GIF, WebP). Max 20MB. Send as multipart/form-data with a file field. File is validated by content (magic bytes), not extension. Returns the URL to the stored file.',
      tags: ['upload'],
      consumes: ['multipart/form-data'],
      // No body schema: multipart is handled by @fastify/multipart; validating body would fail (body is not JSON).
      response: {
        201: {
          description: 'File uploaded',
          type: 'object',
          properties: { url: { type: 'string', format: 'uri' } },
          required: ['url'],
        },
        400: { $ref: 'ErrorResponse#' },
        413: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
    handler: async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          message: 'No file uploaded. Send a multipart form with a file field.',
          statusCode: 400,
        });
      }

      let buffer: Buffer;
      try {
        buffer = await streamToBuffer(data.file, MAX_SIZE_BYTES);
      } catch (err) {
        if (err instanceof Error && err.message === 'FILE_TOO_LARGE') {
          return reply.status(413).send({
            message: 'File must not exceed 20MB',
            statusCode: 413,
          });
        }
        throw err;
      }

      const baseUrl = config.publicUrl ?? `${request.protocol}://${request.headers.host ?? request.hostname}`;
      const result = await uploadFile(
        { buffer: new Uint8Array(buffer), originalFilename: data.filename },
        fastify.dependencies,
      );

      return match(result)
        .with({ type: 'success' }, ({ filename }) => {
          const url = `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
          return reply.status(201).send({ url });
        })
        .with({ type: 'file_too_large' }, ({ message }) => reply.status(413).send({ message, statusCode: 413 }))
        .with({ type: 'invalid_file_type' }, ({ message }) => reply.status(400).send({ message, statusCode: 400 }))
        .with({ type: 'error' }, () => reply.status(500).send({ message: 'Internal server error', statusCode: 500 }))
        .exhaustive();
    },
  });
}
