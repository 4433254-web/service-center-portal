import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import configuration from './config/configuration';
import validate from './config/env.validation';

import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { DevicesModule } from './devices/devices.module';
import { OrdersModule } from './orders/orders.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { FilesModule } from './files/files.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { LocationsModule } from './locations/locations.module';

import { JwtGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    DevicesModule,
    OrdersModule,
    AuditModule,
    HealthModule,
    FilesModule,
    DashboardModule,
    DocumentsModule,
    LocationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
