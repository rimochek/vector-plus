import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UnauthorizedException,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import {
  REFRESH_COOKIE,
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from './auth-cookies';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(createUserDto);
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );
    const { refreshToken: _rt, refreshTokenMaxAgeMs: _ms, ...body } = result;
    return body;
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );
    const { refreshToken: _rt, refreshTokenMaxAgeMs: _ms, ...body } = result;
    return body;
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
      const payload: any = this.jwtService.verify(token);
      const user = await this.authService.getCurrentUser(payload.id);
      if (!user) throw new UnauthorizedException('User not found');
      return { user };
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
