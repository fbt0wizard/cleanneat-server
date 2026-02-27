import type { UseCaseDependencies } from '@infrastructure/di';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { logAction } from '../action-logs/log-action';

const strongPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const paramsSchema = z.object({
  userId: z.string().uuid(),
  old_password: z.string().min(1),
  new_password: strongPasswordSchema,
});

export type ChangePasswordParams = z.input<typeof paramsSchema>;
export type ChangePasswordResult =
  | { type: 'success' }
  | { type: 'not_found' }
  | { type: 'invalid_old_password' }
  | { type: 'same_password' }
  | { type: 'validation_error'; message: string }
  | { type: 'error' };

export async function changePassword(
  params: ChangePasswordParams,
  deps: UseCaseDependencies,
): Promise<ChangePasswordResult> {
  const { logger, repositories } = deps;

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return { type: 'validation_error', message: parsed.error.message };
  }
  const validated = parsed.data;

  if (validated.old_password === validated.new_password) {
    return { type: 'same_password' };
  }

  const user = await repositories.usersRepository.findById(validated.userId);
  if (!user) {
    return { type: 'not_found' };
  }

  const oldPasswordMatches = await bcrypt.compare(validated.old_password, user.password);
  if (!oldPasswordMatches) {
    return { type: 'invalid_old_password' };
  }

  try {
    const updated = await repositories.usersRepository.updatePassword(validated.userId, validated.new_password);
    if (!updated) {
      return { type: 'not_found' };
    }

    await logAction(
      {
        userId: validated.userId,
        action: 'change_password',
        entityType: 'user',
        entityId: validated.userId,
        details: 'User changed their own password',
      },
      deps,
    );

    logger.info({ userId: validated.userId }, 'User password changed');
    return { type: 'success' };
  } catch (error) {
    logger.error({ error, userId: validated.userId }, 'Failed to change user password');
    return { type: 'error' };
  }
}
