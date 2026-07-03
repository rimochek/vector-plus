import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { StudentsService } from './students.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile/me')
  getOwnProfile(@CurrentUser() user: AuthUser) {
    return this.studentsService.getOwnProfile(user);
  }

  @Patch('profile/me')
  updateOwnProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentsService.updateOwnProfile(user, dto);
  }
}
