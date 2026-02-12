import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsDate,
  IsObject,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { HelperSkill, Language } from '@prisma/client';

class TimeSlotDto {
  @IsString()
  start: string;

  @IsString()
  end: string;
}

class WeeklyScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @IsOptional()
  monday?: TimeSlotDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @IsOptional()
  tuesday?: TimeSlotDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @IsOptional()
  wednesday?: TimeSlotDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @IsOptional()
  thursday?: TimeSlotDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @IsOptional()
  friday?: TimeSlotDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @IsOptional()
  saturday?: TimeSlotDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @IsOptional()
  sunday?: TimeSlotDto[] = [];
}

export class CreateHelperProfileDto {
  @ApiProperty()
  @IsUUID()
  neighborhoodId: string;

  @ApiProperty({ type: [String], enum: HelperSkill, example: ['maid', 'cook'] })
  @IsArray()
  @IsEnum(HelperSkill, { each: true })
  skills: HelperSkill[];

  @ApiProperty({ example: 5, description: 'Years of experience' })
  @IsNumber()
  @Min(0)
  @Max(50)
  experience: number;

  @ApiProperty({ type: [String], enum: Language, example: ['en', 'hi'] })
  @IsArray()
  @IsEnum(Language, { each: true })
  languages: Language[];

  @ApiPropertyOptional({ example: 200 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 8000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyRate?: number;

  @ApiProperty({ type: WeeklyScheduleDto })
  @IsObject()
  @ValidateNested()
  @Type(() => WeeklyScheduleDto)
  availability: WeeklyScheduleDto;

  @ApiPropertyOptional({ example: 'Experienced cook with 10 years in restaurant and home cooking' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  bio?: string;
}

export class UpdateHelperProfileDto {
  @ApiPropertyOptional({ type: [String], enum: HelperSkill })
  @IsArray()
  @IsEnum(HelperSkill, { each: true })
  @IsOptional()
  skills?: HelperSkill[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  experience?: number;

  @ApiPropertyOptional({ type: [String], enum: Language })
  @IsArray()
  @IsEnum(Language, { each: true })
  @IsOptional()
  languages?: Language[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyRate?: number;

  @ApiPropertyOptional({ type: WeeklyScheduleDto })
  @IsObject()
  @ValidateNested()
  @Type(() => WeeklyScheduleDto)
  @IsOptional()
  availability?: WeeklyScheduleDto;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class HelperFiltersDto {
  @ApiPropertyOptional({ type: [String], enum: HelperSkill })
  @IsArray()
  @IsEnum(HelperSkill, { each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  skills?: HelperSkill[];

  @ApiPropertyOptional({ type: [String], enum: Language })
  @IsArray()
  @IsEnum(Language, { each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  languages?: Language[];

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  availableNow?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  verified?: boolean;

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

export class BookingRequestDto {
  @ApiPropertyOptional({ example: 'Need help with daily cooking for a family of 4' })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;
}
