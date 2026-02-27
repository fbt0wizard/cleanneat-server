import type { User } from '../entities';

export interface UsersRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  findAll(): Promise<User[]>;
  update(id: string, updates: { isActive?: boolean }): Promise<User | null>;
  updatePassword(id: string, newPassword: string): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
