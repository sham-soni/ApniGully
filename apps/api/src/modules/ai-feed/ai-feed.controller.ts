import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIFeedService } from './ai-feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('ai-feed')
@Controller('ai-feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIFeedController {
  constructor(private aiFeedService: AIFeedService) {}

  @Get('personalized/:neighborhoodId')
  @ApiOperation({ summary: 'Get AI-personalized feed' })
  async getPersonalizedFeed(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.aiFeedService.getPersonalizedFeed(req.user.id, neighborhoodId, page, limit);
  }

  @Get('trending/:neighborhoodId')
  @ApiOperation({ summary: 'Get trending posts' })
  async getTrendingPosts(
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('timeframe') timeframe: '1h' | '24h' | '7d' = '24h',
    @Query('limit') limit: number = 10,
  ) {
    return this.aiFeedService.getTrendingPosts(neighborhoodId, timeframe, limit);
  }

  @Post('track/view')
  @ApiOperation({ summary: 'Track post view engagement' })
  async trackView(
    @Request() req: any,
    @Body() body: { postId: string; duration: number; scrollDepth?: number },
  ) {
    return this.aiFeedService.trackEngagement(req.user.id, body.postId, 'view', {
      duration: body.duration,
      scrollDepth: body.scrollDepth,
    });
  }

  @Post('track/interaction')
  @ApiOperation({ summary: 'Track post interaction' })
  async trackInteraction(
    @Request() req: any,
    @Body() body: { postId: string; action: string },
  ) {
    return this.aiFeedService.trackEngagement(req.user.id, body.postId, body.action);
  }

  @Post('track/hide')
  @ApiOperation({ summary: 'Hide post and track' })
  async hidePost(
    @Request() req: any,
    @Body() body: { postId: string; reason?: string },
  ) {
    return this.aiFeedService.hidePost(req.user.id, body.postId, body.reason);
  }

  @Get('interests')
  @ApiOperation({ summary: 'Get user interests' })
  async getUserInterests(@Request() req: any) {
    return this.aiFeedService.getUserInterests(req.user.id);
  }

  @Post('interests/update')
  @ApiOperation({ summary: 'Update user interests manually' })
  async updateInterests(
    @Request() req: any,
    @Body() body: { interests: Array<{ category: string; value: string; score: number }> },
  ) {
    return this.aiFeedService.updateUserInterests(req.user.id, body.interests);
  }

  @Get('recommendations/:neighborhoodId')
  @ApiOperation({ summary: 'Get content recommendations' })
  async getRecommendations(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('type') type: 'posts' | 'helpers' | 'shops' | 'events' = 'posts',
    @Query('limit') limit: number = 5,
  ) {
    return this.aiFeedService.getRecommendations(req.user.id, neighborhoodId, type, limit);
  }

  @Get('digest/:neighborhoodId')
  @ApiOperation({ summary: 'Get personalized daily digest' })
  async getDailyDigest(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
  ) {
    return this.aiFeedService.getDailyDigest(req.user.id, neighborhoodId);
  }

  @Get('similar/:postId')
  @ApiOperation({ summary: 'Get similar posts' })
  async getSimilarPosts(
    @Param('postId') postId: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.aiFeedService.getSimilarPosts(postId, limit);
  }
}
