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
import { SOSService } from './sos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('sos')
@Controller('sos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SOSController {
  constructor(private sosService: SOSService) {}

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger SOS alert' })
  async triggerSOS(
    @Request() req: any,
    @Body() body: {
      neighborhoodId: string;
      type: 'medical' | 'fire' | 'crime' | 'accident' | 'other';
      latitude: number;
      longitude: number;
      address?: string;
      description?: string;
      audioUrl?: string;
      images?: string[];
    },
  ) {
    return this.sosService.triggerSOS(req.user.id, body);
  }

  @Post(':alertId/respond')
  @ApiOperation({ summary: 'Respond to SOS alert' })
  async respondToSOS(
    @Request() req: any,
    @Param('alertId') alertId: string,
    @Body() body: {
      message?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.sosService.respondToSOS(alertId, req.user.id, body);
  }

  @Put(':alertId/responder/status')
  @ApiOperation({ summary: 'Update responder status' })
  async updateResponderStatus(
    @Request() req: any,
    @Param('alertId') alertId: string,
    @Body() body: { status: 'responding' | 'arrived' | 'helping' },
  ) {
    return this.sosService.updateResponderStatus(alertId, req.user.id, body.status);
  }

  @Post(':alertId/update')
  @ApiOperation({ summary: 'Add SOS update' })
  async addUpdate(
    @Request() req: any,
    @Param('alertId') alertId: string,
    @Body() body: { message: string; type?: string },
  ) {
    return this.sosService.addUpdate(alertId, req.user.id, body.message, body.type);
  }

  @Put(':alertId/resolve')
  @ApiOperation({ summary: 'Resolve SOS alert' })
  async resolveSOS(
    @Request() req: any,
    @Param('alertId') alertId: string,
    @Body() body: { resolution?: string },
  ) {
    return this.sosService.resolveSOS(alertId, req.user.id, body.resolution);
  }

  @Put(':alertId/cancel')
  @ApiOperation({ summary: 'Cancel SOS alert (false alarm)' })
  async cancelSOS(
    @Request() req: any,
    @Param('alertId') alertId: string,
  ) {
    return this.sosService.cancelSOS(alertId, req.user.id);
  }

  @Get('active/:neighborhoodId')
  @ApiOperation({ summary: 'Get active SOS alerts in neighborhood' })
  async getActiveAlerts(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
  ) {
    return this.sosService.getActiveAlerts(neighborhoodId);
  }

  @Get(':alertId')
  @ApiOperation({ summary: 'Get SOS alert details' })
  async getAlert(@Param('alertId') alertId: string) {
    return this.sosService.getAlert(alertId);
  }

  @Get('history/:neighborhoodId')
  @ApiOperation({ summary: 'Get SOS history' })
  async getHistory(
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.sosService.getHistory(neighborhoodId, page, limit);
  }

  // Emergency Contacts
  @Get('contacts')
  @ApiOperation({ summary: 'Get emergency contacts' })
  async getContacts(@Request() req: any) {
    return this.sosService.getEmergencyContacts(req.user.id);
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Add emergency contact' })
  async addContact(
    @Request() req: any,
    @Body() body: {
      name: string;
      phone: string;
      relation: string;
      isPrimary?: boolean;
      canReceiveSOS?: boolean;
    },
  ) {
    return this.sosService.addEmergencyContact(req.user.id, body);
  }

  @Put('contacts/:contactId')
  @ApiOperation({ summary: 'Update emergency contact' })
  async updateContact(
    @Request() req: any,
    @Param('contactId') contactId: string,
    @Body() body: {
      name?: string;
      phone?: string;
      relation?: string;
      isPrimary?: boolean;
      canReceiveSOS?: boolean;
    },
  ) {
    return this.sosService.updateEmergencyContact(req.user.id, contactId, body);
  }

  @Delete('contacts/:contactId')
  @ApiOperation({ summary: 'Delete emergency contact' })
  async deleteContact(
    @Request() req: any,
    @Param('contactId') contactId: string,
  ) {
    return this.sosService.deleteEmergencyContact(req.user.id, contactId);
  }

  @Get('nearby-helpers')
  @ApiOperation({ summary: 'Get nearby helpers who can respond' })
  async getNearbyHelpers(
    @Request() req: any,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('type') type?: string,
  ) {
    return this.sosService.getNearbyHelpers(latitude, longitude, type);
  }
}
