import { Service } from '@domain/entities';
import type { ServicesRepository } from '@domain/repositories';
import { Prisma, type PrismaClient, type Service as ServiceModel } from '@prisma/client';

function jsonToStringArray(value: unknown): string[] {
  if (Array.isArray(value) && value.every((x) => typeof x === 'string')) {
    return value;
  }
  return [];
}

export function makeServicesRepository(db: PrismaClient): ServicesRepository {
  return {
    async create(service) {
      const record = await db.service.create({
        data: {
          id: service.id,
          title: service.title,
          slug: service.slug,
          short_description: service.shortDescription,
          long_description: service.longDescription,
          whats_included: service.whatsIncluded as unknown as Prisma.InputJsonValue,
          whats_not_included: service.whatsNotIncluded as unknown as Prisma.InputJsonValue,
          typical_duration: service.typicalDuration,
          price_from: service.priceFrom,
          image_url: service.imageUrl,
          is_published: service.isPublished,
          sort_order: service.sortOrder,
          user_id: service.userId,
        },
      });
      return toEntity(record);
    },

    async update(id, updates) {
      const record = await db.service.update({
        where: { id },
        data: {
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.slug !== undefined && { slug: updates.slug }),
          ...(updates.shortDescription !== undefined && { short_description: updates.shortDescription }),
          ...(updates.longDescription !== undefined && { long_description: updates.longDescription }),
          ...(updates.whatsIncluded !== undefined && {
            whats_included: updates.whatsIncluded as unknown as Prisma.InputJsonValue,
          }),
          ...(updates.whatsNotIncluded !== undefined && {
            whats_not_included: updates.whatsNotIncluded as unknown as Prisma.InputJsonValue,
          }),
          ...(updates.typicalDuration !== undefined && { typical_duration: updates.typicalDuration }),
          ...(updates.priceFrom !== undefined && { price_from: updates.priceFrom }),
          ...(updates.imageUrl !== undefined && { image_url: updates.imageUrl }),
          ...(updates.isPublished !== undefined && { is_published: updates.isPublished }),
          ...(updates.sortOrder !== undefined && { sort_order: updates.sortOrder }),
        },
      });
      return toEntity(record);
    },

    async findById(id) {
      const record = await db.service.findUnique({ where: { id } });
      if (!record) {
        return null;
      }
      return toEntity(record);
    },

    async findBySlug(slug) {
      const record = await db.service.findUnique({ where: { slug } });
      if (!record) {
        return null;
      }
      return toEntity(record);
    },

    async findByUserId(userId) {
      const records = await db.service.findMany({
        where: { user_id: userId },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      });
      return records.map(toEntity);
    },

    async findAll() {
      const records = await db.service.findMany({
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      });
      return records.map(toEntity);
    },

    async delete(id) {
      try {
        await db.service.delete({ where: { id } });
        return true;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          return false;
        }
        throw error;
      }
    },
  };
}

function toEntity(record: ServiceModel): Service {
  return new Service({
    id: record.id,
    title: record.title,
    slug: record.slug,
    shortDescription: record.short_description,
    longDescription: record.long_description,
    whatsIncluded: jsonToStringArray(record.whats_included),
    whatsNotIncluded: jsonToStringArray(record.whats_not_included),
    typicalDuration: record.typical_duration,
    priceFrom: record.price_from,
    imageUrl: record.image_url,
    isPublished: record.is_published,
    sortOrder: record.sort_order,
    userId: record.user_id,
    created_at: record.created_at,
    updated_at: record.updated_at,
  });
}
