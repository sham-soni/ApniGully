import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsObject, IsArray, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class CreateShopDto {
  @IsUUID() neighborhoodId: string;
  @IsString() @MaxLength(200) name: string;
  @IsString() @MaxLength(100) category: string;
  @IsString() @IsOptional() @MaxLength(2000) description?: string;
  @IsString() @MaxLength(500) address: string;
  @IsString() @IsOptional() phone?: string;
  @IsObject() @IsOptional() hours?: Record<string, { open: string; close: string } | null>;
  @IsArray() @IsOptional() images?: string[];
}

class ShopFiltersDto {
  @IsString() @IsOptional() category?: string;
  @IsBoolean() @Transform(({ value }) => value === 'true') @IsOptional() verified?: boolean;
  @IsNumber() @Type(() => Number) @IsOptional() minRating?: number;
  @IsNumber() @Type(() => Number) @IsOptional() page?: number = 1;
  @IsNumber() @Type(() => Number) @IsOptional() limit?: number = 20;
}

@ApiTags('shops')
@Controller('shops')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a shop' })
  create(@Request() req: any, @Body() dto: CreateShopDto) {
    return this.shopsService.create(req.user.id, dto.neighborhoodId, dto);
  }

  @Get('neighborhood/:neighborhoodId')
  @ApiOperation({ summary: 'Get shops in neighborhood' })
  getShops(@Param('neighborhoodId') id: string, @Query() filters: ShopFiltersDto) {
    return this.shopsService.getShops(id, filters);
  }

  @Get('categories/:neighborhoodId')
  @ApiOperation({ summary: 'Get shop categories' })
  getCategories(@Param('neighborhoodId') id: string) {
    return this.shopsService.getCategories(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shop by ID' })
  findById(@Param('id') id: string) {
    return this.shopsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update shop' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: Partial<CreateShopDto>) {
    return this.shopsService.update(req.user.id, id, dto);
  }
}
