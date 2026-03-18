import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import { ExternalService } from '../external/external.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly externalService: ExternalService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const role: Role = dto.role === 'admin' ? Role.admin : Role.user;

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.name);
    return {
      ...tokens,
      access_token: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.name);
    return {
      ...tokens,
      access_token: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, name: true },
      });
      if (!user) throw new UnauthorizedException('Token de refresh inválido');
      const { accessToken } = await this.generateTokens(
        user.id,
        user.email,
        user.role,
        user.name,
      );
      return { accessToken, access_token: accessToken };
    } catch {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  async quickRegister() {
    const password =
      this.configService.get<string>('QUICK_REGISTER_PASSWORD') ?? '123456';
    const hashedPassword = await bcrypt.hash(password, 12);

    // We retry in case the random email already exists (unique constraint)
    for (let attempt = 0; attempt < 5; attempt++) {
      const profile = await this.externalService.getRandomUserProfile();

      // add a suffix on retries to reduce collision probability
      const email =
        attempt === 0
          ? profile.email
          : profile.email.replace('@', `+${Date.now()}@`);

      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) continue;

      const user = await this.prisma.user.create({
        data: {
          name: profile.name,
          email,
          password: hashedPassword,
          role: Role.user,
        },
      });

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.name);
      return {
        ...tokens,
        access_token: tokens.accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      };
    }

    throw new ConflictException('No se pudo crear un usuario rápido. Reintentá.');
  }

  private async generateTokens(
    userId: string,
    email: string,
    role?: Role,
    name?: string,
  ) {
    const payload = { sub: userId, email, role: role ?? undefined, name: name ?? undefined };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h';
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as object, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: expiresIn as never,
      }),
      this.jwtService.signAsync(
        { sub: userId, email } as object,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshExpiresIn as never,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
