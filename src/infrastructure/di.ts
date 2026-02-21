import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { makeConfig } from "./config";
import { makeLogger } from "./logger";
import { makeActionLogsRepository } from "./repositories/action-logs-repository";
import { makeServicesRepository } from "./repositories/services-repository";
import { makeUsersRepository } from "./repositories/users-repository";

export async function makeDependencies() {
  const config = makeConfig();
  const logger = makeLogger(config);
  const adapter = new PrismaMariaDb(config.DATABASE_URL);
  const db = new PrismaClient({
    adapter,
    log: [
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
  });

  db.$on("error", (e) =>
    logger.error({ target: e.target, message: e.message }, "Prisma error")
  );
  db.$on("warn", (e) =>
    logger.warn({ target: e.target, message: e.message }, "Prisma warning")
  );

  await db.$connect();

  const usersRepository = makeUsersRepository(db);
  const servicesRepository = makeServicesRepository(db);
  const actionLogsRepository = makeActionLogsRepository(db);

  return {
    config,
    db,
    logger,
    repositories: {
      usersRepository,
      servicesRepository,
      actionLogsRepository,
    },
    dispose: async () => {
      await db.$disconnect();
    },
  };
}

export type Dependencies = Awaited<ReturnType<typeof makeDependencies>>;

export type UseCaseDependencies = Pick<Dependencies, "logger" | "repositories" | "config">;
