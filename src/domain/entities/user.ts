export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(params: {
    id: string;
    name: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.email = params.email;
    this.password = params.password;
    this.created_at = params.created_at;
    this.updated_at = params.updated_at;
  }
}
