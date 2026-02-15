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
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePostDto,
  UpdatePostDto,
  FeedFiltersDto,
  CreateCommentDto,
  ReactionDto,
  SyncPostsDto,
} from './dto/posts.dto';
import { PaginationDto } from '../users/dto/users.dto';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  async create(@Request() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.create(req.user.id, dto.neighborhoodId, dto);
  }

  @Get('feed/:neighborhoodId')
  @ApiOperation({ summary: 'Get neighborhood feed' })
  async getFeed(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
    @Query() filters: FeedFiltersDto,
  ) {
    return this.postsService.getFeed(req.user.id, neighborhoodId, filters);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved posts' })
  async getSavedPosts(@Request() req: any, @Query() query: PaginationDto) {
    return this.postsService.getSavedPosts(req.user.id, query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  async findById(@Request() req: any, @Param('id') id: string) {
    return this.postsService.findById(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  async delete(@Request() req: any, @Param('id') id: string) {
    const isModerator = req.user.memberships?.some(
      (m: any) => ['admin', 'moderator'].includes(m.role),
    );
    return this.postsService.delete(req.user.id, id, isModerator);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get post comments' })
  async getComments(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.postsService.getComments(id, query.page, query.limit);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment' })
  async addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(req.user.id, id, dto.content, dto.parentId);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(@Request() req: any, @Param('commentId') commentId: string) {
    const isModerator = req.user.memberships?.some(
      (m: any) => ['admin', 'moderator'].includes(m.role),
    );
    return this.postsService.deleteComment(req.user.id, commentId, isModerator);
  }

  @Post(':id/react')
  @ApiOperation({ summary: 'Add or toggle reaction' })
  async react(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReactionDto,
  ) {
    return this.postsService.addReaction(req.user.id, id, dto.type);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save or unsave a post' })
  async save(@Request() req: any, @Param('id') id: string) {
    return this.postsService.savePost(req.user.id, id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync offline posts' })
  async syncOffline(@Request() req: any, @Body() dto: SyncPostsDto) {
    return this.postsService.syncOfflinePosts(req.user.id, dto.posts);
  }
}
