import { User } from "@domain/entities";
import type { UsersRepository } from "@domain/repositories";
import {
  type PrismaClient,
  type User as UserModel,
} from "@prisma/client";
import bcrypt from "bcrypt";

export function makeUsersRepository(db: PrismaClient): UsersRepository {
  return {
    async create(user) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const record = await db.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: hashedPassword,
        },
      });
      return toEntity(record);
    },

    async findByEmail(email) {
      const record = await db.user.findUnique({ where: { email } });
      if (!record) {
        return null;
      }
      return toEntity(record);
    },

    async findById(id) {
      const record = await db.user.findUnique({ where: { id } });
      if (!record) {
        return null;
      }
      return toEntity(record);
    },

    async findAll() {
      const records = await db.user.findMany({ orderBy: { created_at: "desc" } });
      return records.map(toEntity);
    },
  };
}

function toEntity(record: UserModel): User {
  return new User({
    id: record.id,
    name: record.name,
    email: record.email,
    password: record.password,
    created_at: record.created_at,
    updated_at: record.updated_at,
  });
}
