import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import type { Dependencies } from '@infrastructure/di';
import type { FastifyInstance } from 'fastify';
import actionLogsController from './features/action-logs/action-logs-controller';
import authController from './features/auth/auth-controller';
import faqController from './features/faq/faq-controller';
import inquiriesController from './features/inquiries/inquiries-controller';
import servicesController from './features/services/services-controller';
import settingsController from './features/settings/settings-controller';
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

  fastify.addHook('onClose', async () => {
    await dependencies.dispose();
  });

  // Register CORS first for proper preflight handling
  await fastify.register(Cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, etc.)
      if (!origin) {
        cb(null, true);
        return;
      }

      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        const fullOrigin = origin.toLowerCase();

        // Define allowed patterns
        const allowedPatterns = [
          // All base44.app subdomains (preview, staging, production, etc.)
          (origin: string) => origin.endsWith('.base44.app'),

          // Specific exact matches
          (origin: string) => origin === 'https://clean-neat-home.base44.app',
          (origin: string) => origin === 'http://localhost:5173',
          (origin: string) => origin === 'https://api.cleanneat.co.uk',
          (origin: string) => origin === 'https://cleanneat.co.uk',
          (origin: string) => origin === 'https://www.cleanneat.co.uk',

          // Allow any localhost with any port (for development)
          (_origin: string) => hostname === 'localhost',

          // Allow any .cleanneat.co.uk subdomain
          (_origin: string) => hostname.endsWith('.cleanneat.co.uk') || hostname === 'cleanneat.co.uk',
        ];

        // Check if any pattern matches
        const isAllowed = allowedPatterns.some((pattern) => pattern(fullOrigin));

        if (isAllowed) {
          // Important: echo back the specific origin, not '*'
          cb(null, origin);
        } else {
          cb(new Error('Not allowed by CORS'), false);
        }
      } catch (_err) {
        // If URL parsing fails, reject
        cb(new Error('Invalid origin'), false);
      }
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false,
    maxAge: 86400, // Cache preflight results for 24 hours
  });

  await fastify.register(dependencyInjectionPlugin, { dependencies });
  await fastify.register(authenticatePlugin, { dependencies });

  // Helmet after CORS to avoid header conflicts
  await fastify.register(Helmet, {
    global: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Important for CORS
  });

  if (!isProduction) {
    await fastify.register(swaggerPlugin);
  }

  await fastify.register(rateLimitPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(healthPlugin);
  await fastify.register(authController);
  await fastify.register(usersController);
  await fastify.register(servicesController);
  await fastify.register(faqController);
  await fastify.register(inquiriesController);
  await fastify.register(settingsController);
  await fastify.register(actionLogsController);

  return fastify;
}
