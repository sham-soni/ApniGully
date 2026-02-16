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
import { LiveLocationService } from './live-location.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('live-location')
@Controller('live-location')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LiveLocationController {
  constructor(private liveLocationService: LiveLocationService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start sharing live location' })
  async startSharing(
    @Request() req: any,
    @Body() body: {
      purpose: 'safe_walk' | 'meetup' | 'emergency' | 'delivery';
      latitude: number;
      longitude: number;
      sharedWith: string[];
      durationMinutes?: number;
    },
  ) {
    return this.liveLocationService.startSharing(req.user.id, body);
  }

  @Put(':sessionId/update')
  @ApiOperation({ summary: 'Update live location' })
  async updateLocation(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() body: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
    },
  ) {
    return this.liveLocationService.updateLocation(req.user.id, sessionId, body);
  }

  @Put(':sessionId/stop')
  @ApiOperation({ summary: 'Stop sharing live location' })
  async stopSharing(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveLocationService.stopSharing(req.user.id, sessionId);
  }

  @Put(':sessionId/extend')
  @ApiOperation({ summary: 'Extend sharing duration' })
  async extendSharing(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() body: { additionalMinutes: number },
  ) {
    return this.liveLocationService.extendSharing(req.user.id, sessionId, body.additionalMinutes);
  }

  @Post(':sessionId/add-viewer')
  @ApiOperation({ summary: 'Add someone to view your location' })
  async addViewer(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() body: { userId: string },
  ) {
    return this.liveLocationService.addViewer(req.user.id, sessionId, body.userId);
  }

  @Delete(':sessionId/remove-viewer/:viewerId')
  @ApiOperation({ summary: 'Remove viewer from your location sharing' })
  async removeViewer(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Param('viewerId') viewerId: string,
  ) {
    return this.liveLocationService.removeViewer(req.user.id, sessionId, viewerId);
  }

  @Get('my-active')
  @ApiOperation({ summary: 'Get my active sharing sessions' })
  async getMyActiveSessions(@Request() req: any) {
    return this.liveLocationService.getActiveSessions(req.user.id);
  }

  @Get('shared-with-me')
  @ApiOperation({ summary: 'Get locations shared with me' })
  async getSharedWithMe(@Request() req: any) {
    return this.liveLocationService.getLocationsSharedWithMe(req.user.id);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get live location session' })
  async getSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveLocationService.getSession(req.user.id, sessionId);
  }

  @Get(':sessionId/history')
  @ApiOperation({ summary: 'Get location history for session' })
  async getHistory(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Query('limit') limit: number = 100,
  ) {
    return this.liveLocationService.getLocationHistory(req.user.id, sessionId, limit);
  }

  @Post('safe-walk/start')
  @ApiOperation({ summary: 'Start safe walk (auto-share with emergency contacts)' })
  async startSafeWalk(
    @Request() req: any,
    @Body() body: {
      latitude: number;
      longitude: number;
      destination?: { lat: number; lng: number; address: string };
      estimatedArrival?: number;
    },
  ) {
    return this.liveLocationService.startSafeWalk(req.user.id, body);
  }

  @Post('safe-walk/:sessionId/arrived')
  @ApiOperation({ summary: 'Mark safe arrival' })
  async markSafeArrival(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.liveLocationService.markSafeArrival(req.user.id, sessionId);
  }
}
