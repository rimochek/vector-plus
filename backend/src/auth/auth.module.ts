import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleAuthService } from './google-auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminRoleModule } from '../admin/admin-role.module';
import { RateLimitService } from '../common/services/rate-limit.service';

@Module({
  imports: [
    PrismaModule,
    AdminRoleModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'dev_secret',
        signOptions: {
          expiresIn:
            Number(configService.get<string>('JWT_ACCESS_EXPIRATION')) || 900,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleAuthService, RateLimitService],
  exports: [AuthService, GoogleAuthService, JwtModule],
})
export class AuthModule {}
