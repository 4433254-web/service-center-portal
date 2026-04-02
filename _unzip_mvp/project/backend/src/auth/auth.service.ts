import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async login(login: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { login },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const roles = user.roles.map((r) => r.role.name);
    const payload = { sub: user.id, login: user.login, roles };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, login: user.login, roles },
    };
  }
}
