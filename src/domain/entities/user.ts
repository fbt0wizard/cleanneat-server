export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly isActive: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(params: {
    id: string;
    name: string;
    email: string;
    password: string;
    isActive: boolean;
    created_at: Date;
    updated_at: Date;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.email = params.email;
    this.password = params.password;
    this.isActive = params.isActive;
    this.created_at = params.created_at;
    this.updated_at = params.updated_at;
  }
}
