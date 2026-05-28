import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthUser) {
    return this.chatService.listConversations(user);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.getOrCreateConversation(user, dto.tutorProfileId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('since') since?: string,
  ) {
    return this.chatService.getMessages(user, id, since);
  }

  @Get('conversations/:id/lessons')
  listLessons(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.chatService.listConversationLessons(user, id);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user, id, dto.content);
  }
}
