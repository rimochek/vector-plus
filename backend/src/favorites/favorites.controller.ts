import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  listFavorites(@CurrentUser() user: AuthUser) {
    return this.favoritesService.listFavorites(user);
  }

  @Get('check/:tutorProfileId')
  checkFavorite(
    @CurrentUser() user: AuthUser,
    @Param('tutorProfileId') tutorProfileId: string,
  ) {
    return this.favoritesService.checkFavorite(user, tutorProfileId);
  }

  @Post(':tutorProfileId')
  addFavorite(
    @CurrentUser() user: AuthUser,
    @Param('tutorProfileId') tutorProfileId: string,
  ) {
    return this.favoritesService.addFavorite(user, tutorProfileId);
  }

  @Delete(':tutorProfileId')
  removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('tutorProfileId') tutorProfileId: string,
  ) {
    return this.favoritesService.removeFavorite(user, tutorProfileId);
  }
}
