import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  createBooking(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user, dto);
  }

  @Get('tutor')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  listTutorBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.listTutorBookings(user);
  }

  @Get('student')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  listStudentBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.listStudentBookings(user);
  }

  @Get(':id')
  getBooking(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.getBooking(user, id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  approveBooking(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.approveBooking(user, id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  rejectBooking(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.rejectBooking(user, id);
  }

  @Patch(':id/cancel')
  cancelBooking(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(user, id, dto);
  }

  @Patch(':id/reschedule')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  rescheduleBooking(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingsService.rescheduleBooking(user, id, dto);
  }
}
