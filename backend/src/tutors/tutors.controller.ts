import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TutorsService } from './tutors.service';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Controller('tutors')
export class TutorsController {
  constructor(private tutorsService: TutorsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  listTutors(@CurrentUser() user?: AuthUser) {
    return this.tutorsService.listTutors(user?.id);
  }

  @Get(':id')
  getTutor(@Param('id') id: string) {
    return this.tutorsService.getTutor(id);
  }
}
