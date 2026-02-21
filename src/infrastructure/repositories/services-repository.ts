import { Service } from '@domain/entities';
import type { ServicesRepository } from '@domain/repositories';
import { Prisma, type PrismaClient, type Service as ServiceModel } from '@prisma/client';

export function makeServicesRepository(db: PrismaClient): ServicesRepository {
  return {
    async create(service) {
      const record = await db.service.create({
        data: {
          id: service.id,
          title: service.title,
          slug: service.slug,
          shortDescription: service.shortDescription,
          longDescription: service.longDescription,
          whatsIncluded: service.whatsIncluded,
          whatsNotIncluded: service.whatsNotIncluded,
          typicalDuration: service.typicalDuration,
          priceFrom: service.priceFrom,
          imageUrl: service.imageUrl,
          isPublished: service.isPublished,
          sortOrder: service.sortOrder,
          userId: service.userId,
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
          ...(updates.shortDescription !== undefined && { shortDescription: updates.shortDescription }),
          ...(updates.longDescription !== undefined && { longDescription: updates.longDescription }),
          ...(updates.whatsIncluded !== undefined && { whatsIncluded: updates.whatsIncluded }),
          ...(updates.whatsNotIncluded !== undefined && { whatsNotIncluded: updates.whatsNotIncluded }),
          ...(updates.typicalDuration !== undefined && { typicalDuration: updates.typicalDuration }),
          ...(updates.priceFrom !== undefined && { priceFrom: updates.priceFrom }),
          ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
          ...(updates.isPublished !== undefined && { isPublished: updates.isPublished }),
          ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
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
        where: { userId },
        orderBy: [{ sortOrder: 'asc' }, { created_at: 'desc' }],
      });
      return records.map(toEntity);
    },

    async findAll() {
      const records = await db.service.findMany({
        orderBy: [{ sortOrder: 'asc' }, { created_at: 'desc' }],
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
    shortDescription: record.shortDescription,
    longDescription: record.longDescription,
    whatsIncluded: record.whatsIncluded,
    whatsNotIncluded: record.whatsNotIncluded,
    typicalDuration: record.typicalDuration,
    priceFrom: record.priceFrom,
    imageUrl: record.imageUrl,
    isPublished: record.isPublished,
    sortOrder: record.sortOrder,
    userId: record.userId,
    created_at: record.created_at,
    updated_at: record.updated_at,
  });
}
