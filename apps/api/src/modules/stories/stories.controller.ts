import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('stories')
@Controller('stories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a story' })
  async createStory(
    @Request() req: any,
    @Body() body: {
      neighborhoodId: string;
      type: 'image' | 'video';
      mediaUrl: string;
      thumbnailUrl?: string;
      caption?: string;
      duration?: number;
    },
  ) {
    return this.storiesService.createStory(req.user.id, body);
  }

  @Get('feed/:neighborhoodId')
  @ApiOperation({ summary: 'Get stories feed' })
  async getStoriesFeed(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
  ) {
    return this.storiesService.getStoriesFeed(req.user.id, neighborhoodId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user stories' })
  async getUserStories(@Request() req: any, @Param('userId') userId: string) {
    return this.storiesService.getUserStories(req.user.id, userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my stories' })
  async getMyStories(@Request() req: any) {
    return this.storiesService.getMyStories(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get story by ID' })
  async getStory(@Request() req: any, @Param('id') id: string) {
    return this.storiesService.getStory(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete story' })
  async deleteStory(@Request() req: any, @Param('id') id: string) {
    return this.storiesService.deleteStory(req.user.id, id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Mark story as viewed' })
  async markViewed(@Request() req: any, @Param('id') id: string) {
    return this.storiesService.markViewed(req.user.id, id);
  }

  @Get(':id/viewers')
  @ApiOperation({ summary: 'Get story viewers' })
  async getViewers(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.storiesService.getViewers(req.user.id, id, page, limit);
  }

  @Post(':id/react')
  @ApiOperation({ summary: 'React to story' })
  async reactToStory(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { emoji: string },
  ) {
    return this.storiesService.reactToStory(req.user.id, id, body.emoji);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to story' })
  async replyToStory(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.storiesService.replyToStory(req.user.id, id, body.content);
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Get story replies' })
  async getReplies(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.storiesService.getReplies(req.user.id, id, page, limit);
  }

  // Highlights
  @Post('highlights')
  @ApiOperation({ summary: 'Create highlight' })
  async createHighlight(
    @Request() req: any,
    @Body() body: {
      title: string;
      coverUrl?: string;
      storyIds: string[];
    },
  ) {
    return this.storiesService.createHighlight(req.user.id, body);
  }

  @Get('highlights/my')
  @ApiOperation({ summary: 'Get my highlights' })
  async getMyHighlights(@Request() req: any) {
    return this.storiesService.getMyHighlights(req.user.id);
  }

  @Get('highlights/user/:userId')
  @ApiOperation({ summary: 'Get user highlights' })
  async getUserHighlights(@Param('userId') userId: string) {
    return this.storiesService.getUserHighlights(userId);
  }

  @Put('highlights/:id')
  @ApiOperation({ summary: 'Update highlight' })
  async updateHighlight(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<{
      title: string;
      coverUrl: string;
      storyIds: string[];
    }>,
  ) {
    return this.storiesService.updateHighlight(req.user.id, id, body);
  }

  @Delete('highlights/:id')
  @ApiOperation({ summary: 'Delete highlight' })
  async deleteHighlight(@Request() req: any, @Param('id') id: string) {
    return this.storiesService.deleteHighlight(req.user.id, id);
  }

  @Post(':id/highlight')
  @ApiOperation({ summary: 'Add story to highlight' })
  async addToHighlight(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { highlightId: string },
  ) {
    return this.storiesService.addToHighlight(req.user.id, id, body.highlightId);
  }
}
