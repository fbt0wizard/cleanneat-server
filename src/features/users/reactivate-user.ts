import type { UseCaseDependencies } from "@infrastructure/di";
import { z } from "zod";
import { logAction } from "../action-logs/log-action";

const paramsSchema = z.object({
  id: z.string().uuid(),
  reactivatedByUserId: z.string().uuid(),
});

export type ReactivateUserParams = z.input<typeof paramsSchema>;
export type ReactivateUserResult =
  | { type: "success"; user: { id: string; name: string; email: string; is_active: boolean } }
  | { type: "not_found" }
  | { type: "already_active" }
  | { type: "error" };

export async function reactivateUser(
  params: ReactivateUserParams,
  deps: UseCaseDependencies
): Promise<ReactivateUserResult> {
  const { logger, repositories } = deps;
  const validated = paramsSchema.parse(params);

  logger.info({ userId: validated.id }, "Reactivating user");

  const user = await repositories.usersRepository.findById(validated.id);
  if (!user) {
    return { type: "not_found" };
  }
  if (user.isActive) {
    return { type: "already_active" };
  }

  try {
    const updated = await repositories.usersRepository.update(validated.id, { isActive: true });
    if (!updated) return { type: "not_found" };

    await logAction(
      {
        userId: validated.reactivatedByUserId,
        action: "reactivate_user",
        entityType: "user",
        entityId: updated.id,
        details: `Reactivated user ${updated.email}`,
      },
      deps,
    );

    return {
      type: "success",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        is_active: true,
      },
    };
  } catch (error) {
    logger.error({ error, userId: validated.id }, "Failed to reactivate user");
    return { type: "error" };
  }
}
