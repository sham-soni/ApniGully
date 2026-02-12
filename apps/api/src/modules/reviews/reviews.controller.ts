import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, IsArray, Min, Max, MaxLength } from 'class-validator';

class CreateReviewDto {
  @IsEnum(['helper', 'shop', 'rental']) targetType: 'helper' | 'shop' | 'rental';
  @IsUUID() targetId: string;
  @IsUUID() @IsOptional() taskId?: string;
  @IsNumber() @Min(1) @Max(5) rating: number;
  @IsString() @MaxLength(2000) @IsOptional() content?: string;
  @IsArray() @IsOptional() images?: string[];
}

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  create(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get('target/:type/:id')
  @ApiOperation({ summary: 'Get reviews for a target' })
  getForTarget(@Param('type') type: string, @Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reviewsService.getReviewsForTarget(type, id, +page, +limit);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my reviews' })
  getMyReviews(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reviewsService.getUserReviews(req.user.id, +page, +limit);
  }
}
