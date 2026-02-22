import { Testimonial } from '@domain/entities';
import type { TestimonialsRepository } from '@domain/repositories';
import { Prisma, type PrismaClient, type Testimonial as TestimonialModel } from '@prisma/client';

export function makeTestimonialsRepository(db: PrismaClient): TestimonialsRepository {
  return {
    async create(testimonial) {
      const record = await db.testimonial.create({
        data: {
          id: testimonial.id,
          name_public: testimonial.name_public,
          location_public: testimonial.location_public,
          rating: testimonial.rating,
          text: testimonial.text,
          status: testimonial.status,
          is_published: testimonial.is_published,
        },
      });
      return toEntity(record);
    },

    async findAll() {
      const records = await db.testimonial.findMany({
        orderBy: { created_at: 'desc' },
      });
      return records.map(toEntity);
    },

    async findPublished() {
      const records = await db.testimonial.findMany({
        where: { is_published: true },
        orderBy: { created_at: 'desc' },
      });
      return records.map(toEntity);
    },

    async findById(id) {
      const record = await db.testimonial.findUnique({ where: { id } });
      if (!record) return null;
      return toEntity(record);
    },

    async update(id, updates) {
      try {
        const record = await db.testimonial.update({
          where: { id },
          data: {
            ...(updates.is_published !== undefined && { is_published: updates.is_published }),
            ...(updates.status !== undefined && { status: updates.status }),
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
        await db.testimonial.delete({ where: { id } });
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

function toEntity(record: TestimonialModel): Testimonial {
  return new Testimonial({
    id: record.id,
    name_public: record.name_public,
    location_public: record.location_public,
    rating: record.rating,
    text: record.text,
    status: record.status,
    is_published: record.is_published,
    created_at: record.created_at,
    updated_at: record.updated_at,
  });
}
