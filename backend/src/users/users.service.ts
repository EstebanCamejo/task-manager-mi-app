import { Injectable } from '@nestjs/common';
import { Role } from './role.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

@Injectable()
export class UsersService {
  private users: User[] = [];

  async create(input: CreateUserInput): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      ...input,
    };
    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email);
  }
}
