import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UnauthorizedException,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
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

  @Post('google')
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.authenticateWithGoogle(dto);
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );
    const { refreshToken: _rt, refreshTokenMaxAgeMs: _ms, ...body } = result;
    return body;
  }

  @Post('google/link')
  @UseGuards(JwtAuthGuard)
  async linkGoogle(
    @CurrentUser() user: AuthUser,
    @Body() dto: GoogleLinkDto,
  ) {
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
