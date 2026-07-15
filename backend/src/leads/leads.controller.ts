import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { LeadStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { LeadsService } from './leads.service';
import { UpdateLeadStatusDto } from './dto/lead.dto';

@Controller('tutors/me/leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TUTOR)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get('metrics')
  getMetrics(@CurrentUser() user: AuthUser) {
    return this.leads.getLeadMetrics(user);
  }

  @Get()
  listLeads(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: LeadStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leads.listMyLeads(user, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':leadId')
  getLead(@CurrentUser() user: AuthUser, @Param('leadId') leadId: string) {
    return this.leads.getMyLead(user, leadId);
  }

  @Patch(':leadId/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('leadId') leadId: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leads.updateLeadStatus(user, leadId, dto.status);
  }
}
