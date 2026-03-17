import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from './role.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true },
    });
    return user ? this.mapToUser(user) : undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });
    return user ? this.mapToUser(user) : undefined;
  }

  private mapToUser(row: { id: string; name: string; email: string; role: string }): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as Role,
    };
  }
}
