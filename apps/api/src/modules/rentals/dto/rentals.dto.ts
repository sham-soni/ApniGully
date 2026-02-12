import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsDate,
  Min,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { PropertyType, FurnishingType, ListingStatus, ContactPreference } from '@prisma/client';

export class CreateRentalDto {
  @ApiProperty()
  @IsUUID()
  neighborhoodId: string;

  @ApiProperty({ enum: PropertyType, example: 'apartment' })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiPropertyOptional({ example: '2BHK' })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  bhk?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  depositAmount: number;

  @ApiProperty({ enum: FurnishingType, example: 'semi_furnished' })
  @IsEnum(FurnishingType)
  furnishing: FurnishingType;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  availableFrom: Date;

  @ApiPropertyOptional({ example: 850 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  area?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  totalFloors?: number;

  @ApiPropertyOptional({ type: [String], example: ['parking', 'gym', 'security'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({ enum: ContactPreference, default: 'chat' })
  @IsEnum(ContactPreference)
  @IsOptional()
  contactPreference?: ContactPreference;

  @ApiProperty({ example: 'Spacious 2BHK in prime location with great view' })
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

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  tags?: string[];
}

export class UpdateRentalDto {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  rentAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  availableFrom?: Date;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;
}

export class RentalFiltersDto {
  @ApiPropertyOptional({ enum: PropertyType })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @ApiPropertyOptional()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  minRent?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxRent?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bhk?: string;

  @ApiPropertyOptional({ enum: FurnishingType })
  @IsEnum(FurnishingType)
  @IsOptional()
  furnishing?: FurnishingType;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  availableNow?: boolean;

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

export class ScheduleVisitDto {
  @ApiProperty({ example: 'I would like to visit on Saturday afternoon' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  message: string;
}
