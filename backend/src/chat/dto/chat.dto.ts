import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content: string;
}

export class CreateConversationDto {
  @IsUUID()
  tutorProfileId: string;
}

export class PollMessagesQuery {
  @IsOptional()
  @IsString()
  since?: string;
}
