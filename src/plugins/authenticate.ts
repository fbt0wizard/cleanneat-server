import type { Dependencies } from '@infrastructure/di';
import { verifyToken } from '@infrastructure/auth/jwt';
import type { FastifyError, FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userEmail?: string;
  }
}

interface PluginOptions {
  dependencies: Dependencies;
}

async function authenticatePlugin(fastify: FastifyInstance, options: PluginOptions) {
  const { config, logger } = options.dependencies;

  async function authenticate(request: FastifyRequest) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      const error: FastifyError = new Error('Authorization header is missing') as FastifyError;
      error.statusCode = 401;
      throw error;
    }

    if (!authHeader.startsWith('Bearer ')) {
      const error: FastifyError = new Error('Authorization header must start with Bearer') as FastifyError;
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyToken(token, config.jwtSecret);
      request.userId = payload.userId;
      request.userEmail = payload.email;
    } catch (error) {
      logger.warn({ error }, 'Token verification failed');
      const authError: FastifyError = new Error(
        error instanceof Error ? error.message : 'Invalid token',
      ) as FastifyError;
      authError.statusCode = 401;
      throw authError;
    }
  }

  fastify.decorate('authenticate', authenticate);
}

export default fp(authenticatePlugin, {
  name: 'authenticate-plugin',
  dependencies: ['dependency-injection-plugin'],
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}
