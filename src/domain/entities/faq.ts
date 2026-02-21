export class Faq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly category: string;
  readonly isPublished: boolean;
  readonly sortOrder: number;
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(params: {
    id: string;
    question: string;
    answer: string;
    category: string;
    isPublished: boolean;
    sortOrder: number;
    created_at: Date;
    updated_at: Date;
  }) {
    this.id = params.id;
    this.question = params.question;
    this.answer = params.answer;
    this.category = params.category;
    this.isPublished = params.isPublished;
    this.sortOrder = params.sortOrder;
    this.created_at = params.created_at;
    this.updated_at = params.updated_at;
  }
}
