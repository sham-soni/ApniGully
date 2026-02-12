import { IsString, IsEmail, IsOptional, IsEnum, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Language } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'rahul@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ enum: Language, example: 'en' })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;
}

export class CreateEndorsementDto {
  @ApiProperty({ enum: ['trust', 'skill', 'reliability'], example: 'trust' })
  @IsEnum(['trust', 'skill', 'reliability'])
  type: 'trust' | 'skill' | 'reliability';

  @ApiPropertyOptional({ example: 'Very reliable and trustworthy neighbor' })
  @IsString()
  @IsOptional()
  message?: string;
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Enable push notifications', example: true })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable message notifications', example: true })
  @IsBoolean()
  @IsOptional()
  messageNotifs?: boolean;

  @ApiPropertyOptional({ description: 'Enable post notifications', example: true })
  @IsBoolean()
  @IsOptional()
  postNotifs?: boolean;

  @ApiPropertyOptional({ description: 'Enable safety alert notifications', example: true })
  @IsBoolean()
  @IsOptional()
  safetyAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Enable email digest', example: true })
  @IsBoolean()
  @IsOptional()
  emailDigest?: boolean;

  @ApiPropertyOptional({ description: 'Profile visibility', enum: ['neighbors', 'public'], example: 'neighbors' })
  @IsEnum(['neighbors', 'public'])
  @IsOptional()
  profileVisibility?: string;

  @ApiPropertyOptional({ description: 'Show phone number on profile', example: false })
  @IsBoolean()
  @IsOptional()
  showPhone?: boolean;

  @ApiPropertyOptional({ description: 'Show online status', example: true })
  @IsBoolean()
  @IsOptional()
  showOnlineStatus?: boolean;

  @ApiPropertyOptional({ description: 'Show location on posts', example: true })
  @IsBoolean()
  @IsOptional()
  showLocation?: boolean;

  @ApiPropertyOptional({ description: 'Theme preference', enum: ['light', 'dark', 'system'], example: 'system' })
  @IsEnum(['light', 'dark', 'system'])
  @IsOptional()
  theme?: string;

  @ApiPropertyOptional({ description: 'Language preference', example: 'en' })
  @IsString()
  @IsOptional()
  language?: string;
}

export class BlockUserDto {
  @ApiPropertyOptional({ description: 'Reason for blocking', example: 'Spam messages' })
  @IsString()
  @IsOptional()
  reason?: string;
}
