import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { PostType, Visibility, ReactionType } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty()
  @IsUUID()
  neighborhoodId: string;

  @ApiProperty({ enum: PostType, example: 'announcement' })
  @IsEnum(PostType)
  type: PostType;

  @ApiPropertyOptional({ example: 'Looking for a plumber' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Need a plumber urgently for bathroom leak' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ type: [String], example: ['plumber', 'urgent'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ enum: Visibility, default: 'neighborhood' })
  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  targetGroupIds?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  @IsOptional()
  approximateAddress?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  syncStatus?: string;
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;
}

export class FeedFiltersDto {
  @ApiPropertyOptional({ type: [String], enum: PostType })
  @IsArray()
  @IsEnum(PostType, { each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  type?: PostType[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  tags?: string[];

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  buildingId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isUrgent?: boolean;

  @ApiPropertyOptional({ enum: ['recent', 'nearby', 'trending'], default: 'recent' })
  @IsEnum(['recent', 'nearby', 'trending'])
  @IsOptional()
  sortBy?: 'recent' | 'nearby' | 'trending' = 'recent';

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Thanks for sharing!' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class ReactionDto {
  @ApiProperty({ enum: ReactionType, example: 'like' })
  @IsEnum(ReactionType)
  type: ReactionType;
}

export class SyncPostsDto {
  @ApiProperty({ type: 'array' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfflinePostDto)
  posts: OfflinePostDto[];
}

export class OfflinePostDto extends CreatePostDto {
  @ApiProperty()
  @IsString()
  localId: string;
}
