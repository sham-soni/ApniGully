import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService, CreateEventDto } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RSVPStatus } from '@prisma/client';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an event for a post' })
  async createEvent(@Request() req: any, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, dto);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events in neighborhood' })
  async getUpcomingEvents(
    @Request() req: any,
    @Query('neighborhoodId') neighborhoodId: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventsService.getUpcomingEvents(
      neighborhoodId,
      req.user.id,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  async getEvent(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.getEvent(id, req.user.id);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get event by post ID' })
  async getEventByPost(@Request() req: any, @Param('postId') postId: string) {
    return this.eventsService.getEventByPostId(postId, req.user.id);
  }

  @Post(':id/rsvp')
  @ApiOperation({ summary: 'RSVP to an event' })
  async rsvp(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: RSVPStatus,
  ) {
    return this.eventsService.rsvp(id, req.user.id, status);
  }

  @Delete(':id/rsvp')
  @ApiOperation({ summary: 'Remove RSVP from event' })
  async removeRsvp(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.removeRsvp(id, req.user.id);
  }
}
