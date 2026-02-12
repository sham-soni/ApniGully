import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ChatType } from '@prisma/client';

export class CreateChatDto {
  @ApiProperty()
  @IsUUID()
  participantId: string;

  @ApiPropertyOptional({ enum: ChatType, default: 'direct' })
  @IsEnum(ChatType)
  @IsOptional()
  type?: ChatType;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Hello!' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ enum: ['text', 'image', 'template'], default: 'text' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  templateType?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  @IsOptional()
  images?: string[];
}

export class MessagesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Message ID to load messages before' })
  @IsUUID()
  @IsOptional()
  before?: string;
}

export class SyncMessagesDto {
  @ApiProperty({ type: 'array' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfflineMessageDto)
  messages: OfflineMessageDto[];
}

export class OfflineMessageDto {
  @ApiProperty()
  @IsString()
  localId: string;

  @ApiProperty()
  @IsUUID()
  chatId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
