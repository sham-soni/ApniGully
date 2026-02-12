import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole, BuildingType } from '@prisma/client';

export class CreateNeighborhoodDto {
  @ApiProperty({ example: 'Bandra West' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state: string;

  @ApiProperty({ example: '400050' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Invalid pincode' })
  pincode: string;

  @ApiProperty({ example: 19.0596 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 72.8295 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 500, description: 'Radius in meters' })
  @IsNumber()
  @Min(100)
  @Max(5000)
  @IsOptional()
  radius?: number;
}

export class JoinNeighborhoodDto {
  @ApiProperty({ example: 'ABC12345' })
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  inviteCode: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buildingId?: string;

  @ApiPropertyOptional({ example: 'A-101' })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  unit?: string;
}

export class CreateBuildingDto {
  @ApiProperty({ example: 'Sea View Apartments' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '123 Beach Road, Bandra West' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address: string;

  @ApiProperty({ enum: BuildingType, example: 'apartment' })
  @IsEnum(BuildingType)
  type: BuildingType;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  unitCount?: number;
}

export class SearchLocationDto {
  @ApiProperty({ example: 19.0596 })
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ example: 72.8295 })
  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @ApiPropertyOptional({ example: 5, description: 'Search radius in km' })
  @IsNumber()
  @Min(0.5)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  radiusKm?: number;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: UserRole, example: 'verified_resident' })
  @IsEnum(UserRole)
  role: UserRole;
}
