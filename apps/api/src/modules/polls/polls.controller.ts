import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PollsService, CreatePollDto, VoteDto } from './polls.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('polls')
@Controller('polls')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PollsController {
  constructor(private pollsService: PollsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a poll for a post' })
  async createPoll(@Request() req: any, @Body() dto: CreatePollDto) {
    return this.pollsService.createPoll(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get poll by ID' })
  async getPoll(@Request() req: any, @Param('id') id: string) {
    return this.pollsService.getPoll(id, req.user.id);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get poll by post ID' })
  async getPollByPost(@Request() req: any, @Param('postId') postId: string) {
    return this.pollsService.getPollByPostId(postId, req.user.id);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a poll' })
  async vote(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: VoteDto,
  ) {
    return this.pollsService.vote(id, req.user.id, dto.optionIds);
  }

  @Delete(':id/vote')
  @ApiOperation({ summary: 'Remove vote from a poll' })
  async removeVote(@Request() req: any, @Param('id') id: string) {
    return this.pollsService.removeVote(id, req.user.id);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a poll (owner only)' })
  async closePoll(@Request() req: any, @Param('id') id: string) {
    return this.pollsService.closePoll(id, req.user.id);
  }
}
