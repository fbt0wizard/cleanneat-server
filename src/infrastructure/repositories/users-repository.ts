import { User } from "@domain/entities";
import type { UsersRepository } from "@domain/repositories";
import {
  Prisma,
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
          is_active: user.isActive,
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

    async findByIds(ids) {
      if (ids.length === 0) return [];
      const records = await db.user.findMany({
        where: { id: { in: ids } },
      });
      return records.map(toEntity);
    },

    async findAll() {
      const records = await db.user.findMany({ orderBy: { created_at: "desc" } });
      return records.map(toEntity);
    },

    async update(id, updates) {
      try {
        const record = await db.user.update({
          where: { id },
          data: {
            ...(updates.isActive !== undefined && { is_active: updates.isActive }),
          },
        });
        return toEntity(record);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          return null;
        }
        throw error;
      }
    },

    async delete(id) {
      try {
        await db.user.delete({ where: { id } });
        return true;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          return false;
        }
        throw error;
      }
    },
  };
}

function toEntity(record: UserModel): User {
  return new User({
    id: record.id,
    name: record.name,
    email: record.email,
    password: record.password,
    isActive: record.is_active,
    created_at: record.created_at,
    updated_at: record.updated_at,
  });
}
