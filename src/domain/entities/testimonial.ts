export class Testimonial {
  readonly id: string;
  readonly name_public: string;
  readonly location_public: string;
  readonly rating: number;
  readonly text: string;
  readonly status: string;
  readonly is_published: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(params: {
    id: string;
    name_public: string;
    location_public: string;
    rating: number;
    text: string;
    status: string;
    is_published: boolean;
    created_at: Date;
    updated_at: Date;
  }) {
    this.id = params.id;
    this.name_public = params.name_public;
    this.location_public = params.location_public;
    this.rating = params.rating;
    this.text = params.text;
    this.status = params.status;
    this.is_published = params.is_published;
    this.created_at = params.created_at;
    this.updated_at = params.updated_at;
  }
}
