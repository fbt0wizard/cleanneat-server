import { z } from 'zod';

export function makeConfig() {
  const schema = z.object({
    CORS_ORIGIN: z
      .string()
      .transform((val) => val.split(',').map((origin) => origin.trim()))
      .pipe(z.array(z.url()))
      .optional(),
    DATABASE_URL: z.string(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
    PORT: z
      .string()
      .transform((val) => Number.parseInt(val, 10))
      .refine((val) => val >= 1 && val <= 65535, {
        message: 'Port must be between 1 and 65535',
      }),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  });

  const parsedEnv = schema.parse(process.env);

  return {
    corsOrigin: parsedEnv.CORS_ORIGIN,
    DATABASE_URL: parsedEnv.DATABASE_URL,
    env: parsedEnv.NODE_ENV,
    logLevel: parsedEnv.LOG_LEVEL,
    loggerEnabled: parsedEnv.NODE_ENV !== 'test',
    port: parsedEnv.PORT,
    jwtSecret: parsedEnv.JWT_SECRET,
  };
}

export type ApplicationConfig = ReturnType<typeof makeConfig>;
