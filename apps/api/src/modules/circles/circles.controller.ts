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
import { CirclesService } from './circles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('circles')
@Controller('circles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CirclesController {
  constructor(private circlesService: CirclesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an interest circle' })
  async createCircle(
    @Request() req: any,
    @Body() body: {
      neighborhoodId: string;
      name: string;
      description?: string;
      category: string;
      icon?: string;
      coverImage?: string;
      privacy?: 'public' | 'private' | 'invite_only';
    },
  ) {
    return this.circlesService.createCircle(req.user.id, body);
  }

  @Get('neighborhood/:neighborhoodId')
  @ApiOperation({ summary: 'Get circles in neighborhood' })
  async getCircles(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('category') category?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.circlesService.getCircles(req.user.id, neighborhoodId, category, page, limit);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my circles' })
  async getMyCircles(@Request() req: any) {
    return this.circlesService.getMyCircles(req.user.id);
  }

  @Get('discover/:neighborhoodId')
  @ApiOperation({ summary: 'Discover circles to join' })
  async discoverCircles(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
  ) {
    return this.circlesService.discoverCircles(req.user.id, neighborhoodId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get circle categories' })
  async getCategories() {
    return this.circlesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get circle details' })
  async getCircle(@Request() req: any, @Param('id') id: string) {
    return this.circlesService.getCircle(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update circle' })
  async updateCircle(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      description: string;
      icon: string;
      coverImage: string;
      privacy: 'public' | 'private' | 'invite_only';
    }>,
  ) {
    return this.circlesService.updateCircle(req.user.id, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete circle' })
  async deleteCircle(@Request() req: any, @Param('id') id: string) {
    return this.circlesService.deleteCircle(req.user.id, id);
  }

  // Membership
  @Post(':id/join')
  @ApiOperation({ summary: 'Join a circle' })
  async joinCircle(@Request() req: any, @Param('id') id: string) {
    return this.circlesService.joinCircle(req.user.id, id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a circle' })
  async leaveCircle(@Request() req: any, @Param('id') id: string) {
    return this.circlesService.leaveCircle(req.user.id, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get circle members' })
  async getMembers(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.circlesService.getMembers(id, page, limit);
  }

  @Put(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Request() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: 'admin' | 'moderator' | 'member' },
  ) {
    return this.circlesService.updateMemberRole(req.user.id, id, userId, body.role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from circle' })
  async removeMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.circlesService.removeMember(req.user.id, id, userId);
  }

  // Posts
  @Post(':id/posts')
  @ApiOperation({ summary: 'Create post in circle' })
  async createPost(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      content: string;
      images?: string[];
    },
  ) {
    return this.circlesService.createPost(req.user.id, id, body);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get circle posts' })
  async getPosts(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.circlesService.getPosts(req.user.id, id, page, limit);
  }

  @Put('posts/:postId')
  @ApiOperation({ summary: 'Update post' })
  async updatePost(
    @Request() req: any,
    @Param('postId') postId: string,
    @Body() body: { content: string; images?: string[] },
  ) {
    return this.circlesService.updatePost(req.user.id, postId, body);
  }

  @Delete('posts/:postId')
  @ApiOperation({ summary: 'Delete post' })
  async deletePost(@Request() req: any, @Param('postId') postId: string) {
    return this.circlesService.deletePost(req.user.id, postId);
  }

  @Post('posts/:postId/like')
  @ApiOperation({ summary: 'Like/unlike post' })
  async likePost(@Request() req: any, @Param('postId') postId: string) {
    return this.circlesService.toggleLike(req.user.id, postId);
  }

  @Post('posts/:postId/pin')
  @ApiOperation({ summary: 'Pin/unpin post' })
  async pinPost(@Request() req: any, @Param('postId') postId: string) {
    return this.circlesService.togglePin(req.user.id, postId);
  }

  // Comments
  @Post('posts/:postId/comments')
  @ApiOperation({ summary: 'Add comment to post' })
  async addComment(
    @Request() req: any,
    @Param('postId') postId: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.circlesService.addComment(req.user.id, postId, body);
  }

  @Get('posts/:postId/comments')
  @ApiOperation({ summary: 'Get post comments' })
  async getComments(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.circlesService.getComments(postId, page, limit);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete comment' })
  async deleteComment(@Request() req: any, @Param('commentId') commentId: string) {
    return this.circlesService.deleteComment(req.user.id, commentId);
  }

  // Events
  @Post(':id/events')
  @ApiOperation({ summary: 'Create circle event' })
  async createEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      title: string;
      description?: string;
      location?: string;
      isOnline?: boolean;
      onlineLink?: string;
      startsAt: string;
      endsAt?: string;
      maxAttendees?: number;
    },
  ) {
    return this.circlesService.createEvent(req.user.id, id, body);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get circle events' })
  async getEvents(
    @Param('id') id: string,
    @Query('upcoming') upcoming: boolean = true,
  ) {
    return this.circlesService.getEvents(id, upcoming);
  }
}
