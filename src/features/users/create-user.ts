import { randomBytes, randomUUID } from 'node:crypto';
import { User } from '@domain/entities';
import type { UseCaseDependencies } from '@infrastructure/di';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const SAFE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
const DEFAULT_PASSWORD_LENGTH = 16;

function generateRandomPassword(length = DEFAULT_PASSWORD_LENGTH): string {
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SAFE_ALPHABET[bytes[i]! % SAFE_ALPHABET.length];
  }
  return result;
}

const paramsSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  createdByUserId: z.string().uuid(),
});

export type CreateUserParams = z.input<typeof paramsSchema>;
export type CreateUserResult =
  | { type: 'success'; user: { id: string; name: string; email: string } }
  | { type: 'email_taken' }
  | { type: 'email_failed' }
  | { type: 'error' };

export async function createUser(params: CreateUserParams, deps: UseCaseDependencies): Promise<CreateUserResult> {
  const { logger, repositories } = deps;
  logger.info({ email: params.email, createdByUserId: params.createdByUserId }, 'Creating new user');

  const validated = paramsSchema.parse(params);

  const existingUser = await repositories.usersRepository.findByEmail(validated.email);
  if (existingUser) {
    logger.warn({ email: validated.email }, 'Create user attempted with existing email');
    return { type: 'email_taken' };
  }

  try {
    const password = generateRandomPassword();

    const user = new User({
      id: randomUUID(),
      name: validated.name,
      email: validated.email,
      password,
      isActive: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const createdUser = await repositories.usersRepository.create(user);

    logger.info({ userId: createdUser.id, email: createdUser.email }, 'User created successfully');

    await logAction(
      {
        userId: validated.createdByUserId,
        action: 'create_user',
        entityType: 'user',
        entityId: createdUser.id,
        details: `Created user ${createdUser.email}`,
      },
      deps,
    );

    try {
      await deps.mailer.sendUserCredentials(createdUser.email, createdUser.name, createdUser.email, password);
    } catch (error_) {
      await repositories.usersRepository.delete(createdUser.id);
      logger.error(
        {
          err: error_,
          errorMessage: error_.message,
          errorCode: error_.code,
          errorCommand: error_.command,
          errorResponse: error_.response,
          errorResponseCode: error_.responseCode,
          userId: createdUser.id,
          email: createdUser.email,
        },
        'Credentials email failed - detailed error',
      );
      return { type: 'email_failed' };
    }

    return {
      type: 'success',
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      },
    };
  } catch (error) {
    logger.error({ error, email: validated.email }, 'Failed to create user');
    return { type: 'error' };
  }
}
