export class Service {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string;
  readonly longDescription: string;
  readonly whatsIncluded: string[];
  readonly whatsNotIncluded: string[];
  readonly typicalDuration: string;
  readonly priceFrom: string;
  readonly imageUrl: string | null;
  readonly isPublished: boolean;
  readonly sortOrder: number;
  readonly userId: string;
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(params: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    longDescription: string;
    whatsIncluded: string[];
    whatsNotIncluded: string[];
    typicalDuration: string;
    priceFrom: string;
    imageUrl: string | null;
    isPublished: boolean;
    sortOrder: number;
    userId: string;
    created_at: Date;
    updated_at: Date;
  }) {
    this.id = params.id;
    this.title = params.title;
    this.slug = params.slug;
    this.shortDescription = params.shortDescription;
    this.longDescription = params.longDescription;
    this.whatsIncluded = params.whatsIncluded;
    this.whatsNotIncluded = params.whatsNotIncluded;
    this.typicalDuration = params.typicalDuration;
    this.priceFrom = params.priceFrom;
    this.imageUrl = params.imageUrl;
    this.isPublished = params.isPublished;
    this.sortOrder = params.sortOrder;
    this.userId = params.userId;
    this.created_at = params.created_at;
    this.updated_at = params.updated_at;
  }
}
