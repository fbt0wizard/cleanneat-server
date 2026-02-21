import { Faq } from '@domain/entities';
import type { FaqsRepository } from '@domain/repositories';
import { Prisma, type PrismaClient, type Faq as FaqModel } from '@prisma/client';

export function makeFaqsRepository(db: PrismaClient): FaqsRepository {
  return {
    async create(faq) {
      const record = await db.faq.create({
        data: {
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          is_published: faq.isPublished,
          sort_order: faq.sortOrder,
        },
      });
      return toEntity(record);
    },

    async findById(id) {
      const record = await db.faq.findUnique({ where: { id } });
      if (!record) return null;
      return toEntity(record);
    },

    async findAll() {
      const records = await db.faq.findMany({
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      });
      return records.map(toEntity);
    },

    async update(id, updates) {
      try {
        const record = await db.faq.update({
          where: { id },
          data: {
            ...(updates.question !== undefined && { question: updates.question }),
            ...(updates.answer !== undefined && { answer: updates.answer }),
            ...(updates.category !== undefined && { category: updates.category }),
            ...(updates.isPublished !== undefined && { is_published: updates.isPublished }),
            ...(updates.sortOrder !== undefined && { sort_order: updates.sortOrder }),
          },
        });
        return toEntity(record);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          return null;
        }
        throw error;
      }
    },

    async delete(id) {
      try {
        await db.faq.delete({ where: { id } });
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

function toEntity(record: FaqModel): Faq {
  return new Faq({
    id: record.id,
    question: record.question,
    answer: record.answer,
    category: record.category,
    isPublished: record.is_published,
    sortOrder: record.sort_order,
    created_at: record.created_at,
    updated_at: record.updated_at,
  });
}
