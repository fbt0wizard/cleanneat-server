import type { UseCaseDependencies } from "@infrastructure/di";

export type ListUsersResult =
  | {
      type: "success";
      users: Array<{
        id: string;
        name: string;
        email: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
      }>;
    }
  | { type: "error" };

export async function listUsers(
  _params: Record<string, never>,
  { logger, repositories }: UseCaseDependencies
): Promise<ListUsersResult> {
  try {
    const users = await repositories.usersRepository.findAll();
    return {
      type: "success",
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        is_active: u.isActive,
        created_at: u.created_at,
        updated_at: u.updated_at,
      })),
    };
  } catch (error) {
    logger.error({ error }, "Failed to list users");
    return { type: "error" };
  }
}
