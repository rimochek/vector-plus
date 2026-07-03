import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { RejectTutorDto } from './dto/reject-tutor.dto';
import { ReviewVerificationDocumentDto } from './dto/review-verification-document.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('tutors')
  listTutors(
    @Query('status') status?: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ALL',
  ) {
    return this.adminService.listTutorApplications(status ?? 'SUBMITTED');
  }

  @Get('tutors/:id')
  getTutor(@Param('id') id: string) {
    return this.adminService.getTutorApplication(id);
  }

  @Post('tutors/:id/approve')
  approveTutor(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.adminService.approveTutor(admin, id);
  }

  @Post('tutors/:id/reject')
  rejectTutor(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectTutorDto,
  ) {
    return this.adminService.rejectTutor(admin, id, dto.reason);
  }

  @Post('verification-documents/:id/review')
  reviewDocument(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDocumentDto,
  ) {
    return this.adminService.reviewVerificationDocument(
      admin,
      id,
      dto.status,
      dto.rejectionReason,
    );
  }

  @Get('verification-documents/:id/download')
  downloadDocument(@Param('id') id: string) {
    return this.adminService.getVerificationDocumentDownload(id);
  }
}
