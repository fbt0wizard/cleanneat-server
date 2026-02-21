import type { Faq } from '@domain/entities';

export type FaqResponse = {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  sort_order: number;
};

export function toFaqResponse(faq: Faq): FaqResponse {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    is_published: faq.isPublished,
    sort_order: faq.sortOrder,
  };
}
