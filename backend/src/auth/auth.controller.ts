import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('signup')
  signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
      const user = await this.authService.getById(payload.id);
      if (!user) throw new UnauthorizedException('User not found');
      // hide sensitive fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user as any;
      return { user: safeUser };
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
