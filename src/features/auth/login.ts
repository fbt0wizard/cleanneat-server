import type { UseCaseDependencies } from "@infrastructure/di";
import { generateToken } from "@infrastructure/auth/jwt";
import { logAction } from "../action-logs/log-action";
import bcrypt from "bcrypt";
import { z } from "zod";

const paramsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginParams = z.input<typeof paramsSchema>;
export type LoginResult =
  | { type: "success"; user: { id: string; name: string; email: string }; token: string }
  | { type: "invalid_credentials" }
  | { type: "error" };

export async function login(
  params: LoginParams,
  { logger, repositories, config }: UseCaseDependencies
): Promise<LoginResult> {
  logger.info({ email: params.email }, "Attempting login");

  const validated = paramsSchema.parse(params);

  try {
    const user = await repositories.usersRepository.findByEmail(
      validated.email
    );

    if (!user) {
      logger.warn(
        { email: validated.email },
        "Login attempted with non-existent email"
      );
      return { type: "invalid_credentials" };
    }

    const passwordMatch = await bcrypt.compare(
      validated.password,
      user.password
    );

    if (!passwordMatch) {
      logger.warn(
        { email: validated.email, userId: user.id },
        "Login attempted with incorrect password"
      );
      return { type: "invalid_credentials" };
    }

    logger.info(
      { userId: user.id, email: user.email },
      "User logged in successfully"
    );

    const token = generateToken(
      { userId: user.id, email: user.email },
      config.jwtSecret,
    );

    await logAction(
      {
        userId: user.id,
        action: "login",
        details: `Logged in as ${user.email}`,
      },
      { logger, repositories, config },
    );

    return {
      type: "success",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  } catch (error) {
    logger.error({ error, email: validated.email }, "Failed to login user");
    return { type: "error" };
  }
}
