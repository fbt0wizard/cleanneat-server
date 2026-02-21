import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import type { Dependencies } from '@infrastructure/di';
import type { FastifyInstance } from 'fastify';
import actionLogsController from './features/action-logs/action-logs-controller';
import authController from './features/auth/auth-controller';
import servicesController from './features/services/services-controller';
import usersController from './features/users/users-controller';
import authenticatePlugin from './plugins/authenticate';
import dependencyInjectionPlugin from './plugins/dependency-injection';
import errorHandlerPlugin from './plugins/error-handler';
import healthPlugin from './plugins/health';
import rateLimitPlugin from './plugins/rate-limit';
import swaggerPlugin from './plugins/swagger';

export async function app(fastify: FastifyInstance, dependencies: Dependencies) {
  const { config } = dependencies;
  const isProduction = config.env === 'production';
  const allowedOrigins = [
    'https://preview--clean-neat-home.base44.app',
    'https://clean-neat-home.base44.app',
    'http://localhost:5173',
  ];
  const corsOrigin = config.corsOrigin ?? allowedOrigins;

  fastify.addHook('onClose', async () => {
    await dependencies.dispose();
  });

  await fastify.register(dependencyInjectionPlugin, { dependencies });
  await fastify.register(authenticatePlugin, { dependencies });
  await fastify.register(Helmet, { global: true });
  await fastify.register(Cors, { origin: corsOrigin });

  if (!isProduction) {
    await fastify.register(swaggerPlugin);
  }

  await fastify.register(rateLimitPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(healthPlugin);
  await fastify.register(authController);
  await fastify.register(usersController);
  await fastify.register(servicesController);
  await fastify.register(actionLogsController);

  return fastify;
}
