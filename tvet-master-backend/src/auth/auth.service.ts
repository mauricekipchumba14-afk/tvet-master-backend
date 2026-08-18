import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      role: user.role,
      institutionId: user.institutionId,
      email: user.email,
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        institutionId: user.institutionId,
      },
    };
  }

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'trainer';
    institutionId: string;
    phone?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        institutionId: data.institutionId,
        phone: data.phone,
      },
    });
    return this.login(data.email, data.password);
  }
}
