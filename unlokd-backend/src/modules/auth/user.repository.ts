import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type DbUser = {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  display_name: string;
  is_active: number;
};

export type UserRecord = {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  isActive: boolean;
};

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.prismaService.$queryRaw<DbUser[]>`
      SELECT id, email, username, password_hash, display_name, is_active
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    return rows.length ? this.mapDbUser(rows[0]) : null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const rows = await this.prismaService.$queryRaw<DbUser[]>`
      SELECT id, email, username, password_hash, display_name, is_active
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    return rows.length ? this.mapDbUser(rows[0]) : null;
  }

  async createUser(payload: {
    email: string;
    username: string;
    passwordHash: string;
    displayName: string;
  }): Promise<UserRecord> {
    await this.prismaService.$executeRaw`
      INSERT INTO users (email, username, password_hash, display_name, is_active, created_at, updated_at)
      VALUES (${payload.email}, ${payload.username}, ${payload.passwordHash}, ${payload.displayName}, 1, NOW(), NOW())
    `;

    const user = await this.findByEmail(payload.email);
    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  private mapDbUser(user: DbUser): UserRecord {
    return {
      id: Number(user.id),
      email: user.email,
      username: user.username,
      passwordHash: user.password_hash,
      displayName: user.display_name,
      isActive: user.is_active === 1,
    };
  }
}
