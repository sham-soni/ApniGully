import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional, IsUUID, IsDate, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class CreateOfferDto {
  @IsUUID() shopId: string;
  @IsString() @MaxLength(200) title: string;
  @IsString() @MaxLength(1000) description: string;
  @IsNumber() @Min(1) @Max(100) @IsOptional() discountPercent?: number;
  @Type(() => Date) @IsDate() validFrom: Date;
  @Type(() => Date) @IsDate() validUntil: Date;
}

@ApiTags('offers')
@Controller('offers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an offer' })
  create(@Request() req: any, @Body() dto: CreateOfferDto) {
    return this.offersService.create(req.user.id, dto.shopId, dto);
  }

  @Get('neighborhood/:neighborhoodId')
  @ApiOperation({ summary: 'Get active offers' })
  getActiveOffers(@Param('neighborhoodId') id: string) {
    return this.offersService.getActiveOffers(id);
  }

  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Get shop offers' })
  getShopOffers(@Param('shopId') id: string) {
    return this.offersService.getShopOffers(id);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate offer' })
  deactivate(@Request() req: any, @Param('id') id: string) {
    return this.offersService.deactivate(req.user.id, id);
  }
}
