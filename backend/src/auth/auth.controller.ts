import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Headers,
  UnauthorizedException,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthDto, GoogleLinkDto } from './dto/google-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  REFRESH_COOKIE,
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from './auth-cookies';
import { RateLimitService } from '../common/services/rate-limit.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private rateLimit: RateLimitService,
  ) {}

  private limit(req: Request, action: string, identity?: string) {
    const key = `${action}:${req.ip}:${identity?.trim().toLowerCase() ?? ''}`;
    this.rateLimit.check(key, 10, 15 * 60 * 1000);
  }

  @Post('google')
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.limit(req, 'google');
    const result = await this.authService.authenticateWithGoogle(dto);
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );
    return {
      message: result.message,
      access_token: result.access_token,
      existingAccount: result.existingAccount,
      user: result.user,
    };
  }

  @Post('google/link')
  @UseGuards(JwtAuthGuard)
  async linkGoogle(@CurrentUser() user: AuthUser, @Body() dto: GoogleLinkDto) {
    return this.authService.linkGoogleAccount(user.id, dto.credential);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) {
      throw new UnauthorizedException('Refresh token required');
    }

    const result = await this.authService.refreshAccessToken(raw);
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );

    return { access_token: result.accessToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.revokeRefreshToken(raw);
    clearRefreshTokenCookie(res);
    return { success: true };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.deleteAccount(user.id);
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.revokeRefreshToken(raw);
    clearRefreshTokenCookie(res);
    return result;
  }

  @Get('me')
  async me(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Malformed Authorization header');
    }

    const token = parts[1];
    try {
      const payload = this.jwtService.verify<{ id: string }>(token);
      const user = await this.authService.getCurrentUser(payload.id);
      if (!user) throw new UnauthorizedException('User not found');
      return { user };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
