import type { UseCaseDependencies } from "@infrastructure/di";
import { z } from "zod";
import { logAction } from "../action-logs/log-action";

const paramsSchema = z.object({
  id: z.string().uuid(),
  deactivatedByUserId: z.string().uuid(),
});

export type DeactivateUserParams = z.input<typeof paramsSchema>;
export type DeactivateUserResult =
  | { type: "success"; user: { id: string; name: string; email: string; is_active: boolean } }
  | { type: "not_found" }
  | { type: "already_inactive" }
  | { type: "error" };

export async function deactivateUser(
  params: DeactivateUserParams,
  deps: UseCaseDependencies
): Promise<DeactivateUserResult> {
  const { logger, repositories } = deps;
  const validated = paramsSchema.parse(params);

  logger.info({ userId: validated.id }, "Deactivating user");

  const user = await repositories.usersRepository.findById(validated.id);
  if (!user) {
    return { type: "not_found" };
  }
  if (!user.isActive) {
    return { type: "already_inactive" };
  }

  try {
    const updated = await repositories.usersRepository.update(validated.id, { isActive: false });
    if (!updated) return { type: "not_found" };

    await logAction(
      {
        userId: validated.deactivatedByUserId,
        action: "deactivate_user",
        entityType: "user",
        entityId: updated.id,
        details: `Deactivated user ${updated.email}`,
      },
      deps,
    );

    return {
      type: "success",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        is_active: false,
      },
    };
  } catch (error) {
    logger.error({ error, userId: validated.id }, "Failed to deactivate user");
    return { type: "error" };
  }
}
