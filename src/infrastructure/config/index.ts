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
    // Mail (optional – if not set, credential emails are skipped)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z
      .string()
      .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
      .optional(),
    SMTP_SECURE: z
      .string()
      .optional()
      .transform((val) => val === 'true' || val === '1'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().email().optional(),
    MAIL_FROM_NAME: z.string().optional(),
    // Upload (optional – defaults to ./uploads; PUBLIC_URL used for returned file URLs)
    UPLOAD_DIR: z.string().optional().default('uploads'),
    PUBLIC_URL: z.string().url().optional(),
  });

  const parsedEnv = schema.parse(process.env);

  const mail =
    parsedEnv.SMTP_HOST && parsedEnv.MAIL_FROM
      ? {
          host: parsedEnv.SMTP_HOST,
          port: 587,
          // port: parsedEnv.SMTP_PORT ?? 587,
          secure: true,
          // secure: parsedEnv.SMTP_SECURE ?? false,
          user: parsedEnv.SMTP_USER ?? undefined,
          pass: parsedEnv.SMTP_PASS ?? undefined,
          from: parsedEnv.MAIL_FROM,
          fromName: parsedEnv.MAIL_FROM_NAME ?? 'Clean Neat',
        }
      : null;

  return {
    corsOrigin: parsedEnv.CORS_ORIGIN,
    DATABASE_URL: parsedEnv.DATABASE_URL,
    env: parsedEnv.NODE_ENV,
    logLevel: parsedEnv.LOG_LEVEL,
    loggerEnabled: parsedEnv.NODE_ENV !== 'test',
    port: parsedEnv.PORT,
    jwtSecret: parsedEnv.JWT_SECRET,
    mail,
    uploadDir: parsedEnv.UPLOAD_DIR,
    publicUrl: parsedEnv.PUBLIC_URL ?? null,
  };
}

export type ApplicationConfig = ReturnType<typeof makeConfig>;
