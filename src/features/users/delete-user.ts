import type { UseCaseDependencies } from "@infrastructure/di";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid(),
  deletedByUserId: z.string().uuid(),
});

export type DeleteUserParams = z.input<typeof paramsSchema>;
export type DeleteUserResult =
  | { type: "success" }
  | { type: "not_found" }
  | { type: "error" };

export async function deleteUser(
  params: DeleteUserParams,
  { logger, repositories }: UseCaseDependencies
): Promise<DeleteUserResult> {
  const validated = paramsSchema.parse(params);

  logger.info({ userId: validated.id, deletedBy: validated.deletedByUserId }, "Deleting user");

  const user = await repositories.usersRepository.findById(validated.id);
  if (!user) {
    return { type: "not_found" };
  }

  try {
    const deleted = await repositories.usersRepository.delete(validated.id);
    return deleted ? { type: "success" } : { type: "not_found" };
  } catch (error) {
    logger.error({ error, userId: validated.id }, "Failed to delete user");
    return { type: "error" };
  }
}
