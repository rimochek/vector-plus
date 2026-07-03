import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { TutorsService } from './tutors.service';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';

type UploadedFilePayload = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

@Controller('tutors')
export class TutorsController {
  constructor(private tutorsService: TutorsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  listTutors(
    @CurrentUser() user?: AuthUser,
    @Query('formats') formats?: string,
  ) {
    return this.tutorsService.listTutors(user?.id, formats);
  }

  @Get('dashboard/overview')
  @UseGuards(JwtAuthGuard)
  dashboardOverview(@CurrentUser() user: AuthUser) {
    return this.tutorsService.getDashboardOverview(user);
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  ownProfile(@CurrentUser() user: AuthUser) {
    return this.tutorsService.getOwnProfile(user);
  }

  @Patch('profile/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  updateOwnProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateTutorProfileDto,
  ) {
    return this.tutorsService.updateOwnProfile(user, dto);
  }

  @Post('profile/me/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  submitApplication(@CurrentUser() user: AuthUser) {
    return this.tutorsService.submitApplication(user);
  }

  @Post('profile/me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: UploadedFilePayload,
  ) {
    return this.tutorsService.uploadAvatar(user, file);
  }

  @Post('profile/me/verification')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FileInterceptor('file'))
  uploadVerification(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: UploadedFilePayload,
    @Body('documentType') documentType: string,
  ) {
    return this.tutorsService.uploadVerificationDocument(
      user,
      file,
      documentType?.trim() || 'other',
    );
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getTutor(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | undefined,
    @Req() req: Request,
  ) {
    return this.tutorsService.getTutor(id, {
      viewerUserId: user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
