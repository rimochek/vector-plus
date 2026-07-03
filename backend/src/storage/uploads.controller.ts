import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';
import { CompleteUploadDto, PresignUploadDto } from './dto/upload.dto';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('avatar/presign')
  presignAvatar(@CurrentUser() user: AuthUser, @Body() dto: PresignUploadDto) {
    return this.uploadsService.presignAvatar(user, dto);
  }

  @Post('avatar/complete')
  completeAvatar(
    @CurrentUser() user: AuthUser,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.uploadsService.completeAvatar(user, dto.uploadId);
  }

  @Delete('avatar')
  deleteAvatar(@CurrentUser() user: AuthUser) {
    return this.uploadsService.deleteAvatar(user);
  }

  @Post('verification/presign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  presignVerification(
    @CurrentUser() user: AuthUser,
    @Body() dto: PresignUploadDto,
  ) {
    return this.uploadsService.presignVerification(user, dto);
  }

  @Post('verification/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  completeVerification(
    @CurrentUser() user: AuthUser,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.uploadsService.completeVerification(user, dto.uploadId);
  }

  @Get('verification/options')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  getVerificationOptions(@CurrentUser() user: AuthUser) {
    return this.uploadsService.getVerificationOptions(user);
  }

  @Get('verification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  listVerification(@CurrentUser() user: AuthUser) {
    return this.uploadsService.listVerificationDocuments(user);
  }

  @Get('verification/:documentId/download-url')
  getVerificationDownloadUrl(
    @CurrentUser() user: AuthUser,
    @Param('documentId') documentId: string,
  ) {
    return this.uploadsService.getVerificationDownloadUrl(user, documentId);
  }

  @Delete('verification/:documentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  deleteVerificationDocument(
    @CurrentUser() user: AuthUser,
    @Param('documentId') documentId: string,
  ) {
    return this.uploadsService.deleteVerificationDocument(user, documentId);
  }
}
