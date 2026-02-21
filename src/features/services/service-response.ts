import type { Service } from '@domain/entities';

export type ServiceResponse = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  long_description: string;
  whats_included: string[];
  whats_not_included: string[];
  typical_duration: string;
  price_from: string;
  image_url: string | null;
  is_published: boolean;
  sort_order: number;
  user_id: string;
};

export function toServiceResponse(service: Service): ServiceResponse {
  return {
    id: service.id,
    title: service.title,
    slug: service.slug,
    short_description: service.shortDescription,
    long_description: service.longDescription,
    whats_included: service.whatsIncluded,
    whats_not_included: service.whatsNotIncluded,
    typical_duration: service.typicalDuration,
    price_from: service.priceFrom,
    image_url: service.imageUrl,
    is_published: service.isPublished,
    sort_order: service.sortOrder,
    user_id: service.userId,
  };
}
