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
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateAvailabilityRuleDto,
  CreateAvailabilitySlotDto,
  GenerateSlotsDto,
  SaveWeeklyScheduleDto,
} from './dto/availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Post('rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  createRule(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAvailabilityRuleDto,
  ) {
    return this.availabilityService.createRule(user, dto);
  }

  @Get('rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  listRules(@CurrentUser() user: AuthUser) {
    return this.availabilityService.listRules(user);
  }

  @Get('weekly-schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  getWeeklySchedule(@CurrentUser() user: AuthUser) {
    return this.availabilityService.getWeeklySchedule(user);
  }

  @Post('weekly-schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  saveWeeklySchedule(
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveWeeklyScheduleDto,
  ) {
    return this.availabilityService.saveWeeklySchedule(user, dto);
  }

  @Delete('rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  deleteRule(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.availabilityService.deleteRule(user, id);
  }

  @Post('slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  createSlot(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAvailabilitySlotDto,
  ) {
    return this.availabilityService.createSlot(user, dto);
  }

  @Post('slots/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  generateSlots(
    @CurrentUser() user: AuthUser,
    @Body() dto: GenerateSlotsDto,
  ) {
    return this.availabilityService.generateSlotsFromRules(
      user,
      dto.weeksAhead ?? 4,
    );
  }

  @Get('slots/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  listMySlots(@CurrentUser() user: AuthUser) {
    return this.availabilityService.listTutorSlots(user);
  }

  @Get('tutors/:tutorProfileId/slots')
  listPublicSlots(@Param('tutorProfileId') tutorProfileId: string) {
    return this.availabilityService.listPublicSlots(tutorProfileId);
  }
}
