import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ContactEventType, LeadSource } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { LeadsService } from '../leads/leads.service';
import { CreateLeadDto } from '../leads/dto/lead.dto';

@Controller('public/tutors')
export class PublicLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post(':tutorId/leads')
  @UseGuards(OptionalJwtAuthGuard)
  createLead(
    @Param('tutorId') tutorId: string,
    @Body() dto: CreateLeadDto,
    @CurrentUser() user: AuthUser | undefined,
    @Req() req: Request,
  ) {
    return this.leads.createPublicLead(dto, {
      tutorId,
      source: LeadSource.TUTOR_PROFILE,
      studentUserId: user?.id,
      ipHash: this.leads.hashIp(req.ip),
      userAgent:
        typeof req.headers['user-agent'] === 'string'
          ? req.headers['user-agent']
          : undefined,
    });
  }

  @Post(':tutorId/contact/telegram')
  @UseGuards(OptionalJwtAuthGuard)
  trackTelegramClick(@Param('tutorId') tutorId: string, @Req() req: Request) {
    return this.leads.recordContactClick(
      tutorId,
      ContactEventType.TELEGRAM_CLICK,
      this.leads.hashIp(req.ip),
    );
  }

  @Post(':tutorId/contact/phone')
  @UseGuards(OptionalJwtAuthGuard)
  trackPhoneClick(@Param('tutorId') tutorId: string, @Req() req: Request) {
    return this.leads.recordContactClick(
      tutorId,
      ContactEventType.PHONE_CLICK,
      this.leads.hashIp(req.ip),
    );
  }
}
