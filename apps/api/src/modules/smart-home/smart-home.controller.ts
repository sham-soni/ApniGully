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
import { SmartHomeService } from './smart-home.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('smart-home')
@Controller('smart-home')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SmartHomeController {
  constructor(private smartHomeService: SmartHomeService) {}

  // Integrations
  @Post('integrations')
  @ApiOperation({ summary: 'Link smart home integration' })
  async linkIntegration(
    @Request() req: any,
    @Body() body: {
      provider: string;
      accessToken: string;
      refreshToken?: string;
      expiresAt?: string;
    },
  ) {
    return this.smartHomeService.linkIntegration(req.user.id, body);
  }

  @Get('integrations')
  @ApiOperation({ summary: 'Get linked integrations' })
  async getIntegrations(@Request() req: any) {
    return this.smartHomeService.getIntegrations(req.user.id);
  }

  @Delete('integrations/:id')
  @ApiOperation({ summary: 'Unlink integration' })
  async unlinkIntegration(@Request() req: any, @Param('id') id: string) {
    return this.smartHomeService.unlinkIntegration(req.user.id, id);
  }

  @Post('integrations/:id/sync')
  @ApiOperation({ summary: 'Sync devices from integration' })
  async syncDevices(@Request() req: any, @Param('id') id: string) {
    return this.smartHomeService.syncDevices(req.user.id, id);
  }

  // Devices
  @Get('devices')
  @ApiOperation({ summary: 'Get all devices' })
  async getDevices(
    @Request() req: any,
    @Query('room') room?: string,
    @Query('type') type?: string,
  ) {
    return this.smartHomeService.getDevices(req.user.id, room, type);
  }

  @Get('devices/:id')
  @ApiOperation({ summary: 'Get device details' })
  async getDevice(@Request() req: any, @Param('id') id: string) {
    return this.smartHomeService.getDevice(req.user.id, id);
  }

  @Post('devices/:id/control')
  @ApiOperation({ summary: 'Control device' })
  async controlDevice(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      action: string;
      value?: any;
    },
  ) {
    return this.smartHomeService.controlDevice(req.user.id, id, body);
  }

  @Get('devices/:id/logs')
  @ApiOperation({ summary: 'Get device logs' })
  async getDeviceLogs(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.smartHomeService.getDeviceLogs(req.user.id, id, page, limit);
  }

  // Automations
  @Post('automations')
  @ApiOperation({ summary: 'Create automation' })
  async createAutomation(
    @Request() req: any,
    @Body() body: {
      name: string;
      trigger: {
        type: 'time' | 'device' | 'location' | 'manual';
        time?: string;
        deviceId?: string;
        condition?: any;
        locationTrigger?: 'enter' | 'leave';
        locationId?: string;
      };
      actions: Array<{
        deviceId: string;
        command: { action: string; value?: any };
        delay?: number;
      }>;
      isActive?: boolean;
    },
  ) {
    return this.smartHomeService.createAutomation(req.user.id, body);
  }

  @Get('automations')
  @ApiOperation({ summary: 'Get automations' })
  async getAutomations(@Request() req: any) {
    return this.smartHomeService.getAutomations(req.user.id);
  }

  @Put('automations/:id')
  @ApiOperation({ summary: 'Update automation' })
  async updateAutomation(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.smartHomeService.updateAutomation(req.user.id, id, body);
  }

  @Delete('automations/:id')
  @ApiOperation({ summary: 'Delete automation' })
  async deleteAutomation(@Request() req: any, @Param('id') id: string) {
    return this.smartHomeService.deleteAutomation(req.user.id, id);
  }

  @Post('automations/:id/trigger')
  @ApiOperation({ summary: 'Trigger automation manually' })
  async triggerAutomation(@Request() req: any, @Param('id') id: string) {
    return this.smartHomeService.triggerAutomation(req.user.id, id);
  }

  // Scenes
  @Post('scenes')
  @ApiOperation({ summary: 'Create scene' })
  async createScene(
    @Request() req: any,
    @Body() body: {
      name: string;
      icon?: string;
      devices: Array<{
        deviceId: string;
        state: any;
      }>;
    },
  ) {
    return this.smartHomeService.createScene(req.user.id, body);
  }

  @Get('scenes')
  @ApiOperation({ summary: 'Get scenes' })
  async getScenes(@Request() req: any) {
    return this.smartHomeService.getScenes(req.user.id);
  }

  @Post('scenes/:id/activate')
  @ApiOperation({ summary: 'Activate scene' })
  async activateScene(@Request() req: any, @Param('id') id: string) {
    return this.smartHomeService.activateScene(req.user.id, id);
  }

  @Delete('scenes/:id')
  @ApiOperation({ summary: 'Delete scene' })
  async deleteScene(@Request() req: any, @Param('id') id: string) {
    return this.smartHomeService.deleteScene(req.user.id, id);
  }

  // Rooms
  @Get('rooms')
  @ApiOperation({ summary: 'Get rooms' })
  async getRooms(@Request() req: any) {
    return this.smartHomeService.getRooms(req.user.id);
  }

  // Reference data
  @Get('providers')
  @ApiOperation({ summary: 'Get supported providers' })
  async getSupportedProviders() {
    return this.smartHomeService.getSupportedProviders();
  }

  @Get('device-types')
  @ApiOperation({ summary: 'Get device types' })
  async getDeviceTypes() {
    return this.smartHomeService.getDeviceTypes();
  }

  // Energy
  @Get('energy')
  @ApiOperation({ summary: 'Get energy usage' })
  async getEnergyUsage(
    @Request() req: any,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.smartHomeService.getEnergyUsage(req.user.id, period);
  }
}
