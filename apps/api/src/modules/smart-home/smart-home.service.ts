import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Supported device types
const DEVICE_TYPES = [
  'light',
  'fan',
  'ac',
  'tv',
  'door_lock',
  'camera',
  'thermostat',
  'switch',
  'sensor',
  'speaker',
  'geyser',
  'refrigerator',
  'washing_machine',
  'curtain',
] as const;

type DeviceType = (typeof DEVICE_TYPES)[number];

// Supported integrations
const INTEGRATIONS = [
  'google_home',
  'amazon_alexa',
  'apple_homekit',
  'smartthings',
  'tuya',
  'mi_home',
  'philips_hue',
  'tplink_kasa',
] as const;

type Integration = (typeof INTEGRATIONS)[number];

@Injectable()
export class SmartHomeService {
  constructor(private prisma: PrismaService) {}

  // Link smart home integration
  async linkIntegration(
    userId: string,
    data: {
      provider: string;
      accessToken: string;
      refreshToken?: string;
      expiresAt?: string;
    },
  ) {
    if (!INTEGRATIONS.includes(data.provider as Integration)) {
      throw new BadRequestException(`Provider ${data.provider} is not supported`);
    }

    // Check for existing integration
    const existing = await this.prisma.smartHomeIntegration.findFirst({
      where: { userId, provider: data.provider },
    });

    if (existing) {
      // Update existing integration
      return this.prisma.smartHomeIntegration.update({
        where: { id: existing.id },
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          isActive: true,
        },
      });
    }

    return this.prisma.smartHomeIntegration.create({
      data: {
        userId,
        provider: data.provider,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  // Unlink integration
  async unlinkIntegration(userId: string, integrationId: string) {
    const integration = await this.prisma.smartHomeIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    if (integration.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    await this.prisma.smartHomeIntegration.delete({
      where: { id: integrationId },
    });

    // Also remove devices from this integration
    await this.prisma.smartDevice.deleteMany({
      where: { integrationId },
    });

    return { success: true };
  }

  // Get user's integrations
  async getIntegrations(userId: string) {
    return this.prisma.smartHomeIntegration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        isActive: true,
        lastSynced: true,
        createdAt: true,
        _count: { select: { devices: true } },
      },
    });
  }

  // Sync devices from integration
  async syncDevices(userId: string, integrationId: string) {
    const integration = await this.prisma.smartHomeIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    if (integration.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // In production, this would call the provider's API to get devices
    // Mock implementation - fetch devices from provider
    const discoveredDevices = await this.discoverDevicesFromProvider(integration);

    // Upsert devices
    for (const device of discoveredDevices) {
      await this.prisma.smartDevice.upsert({
        where: {
          integrationId_externalId: {
            integrationId,
            externalId: device.externalId,
          },
        },
        update: {
          name: device.name,
          type: device.type,
          room: device.room,
          capabilities: device.capabilities,
          isOnline: device.isOnline,
        },
        create: {
          userId,
          integrationId,
          externalId: device.externalId,
          name: device.name,
          type: device.type,
          room: device.room,
          capabilities: device.capabilities,
          isOnline: device.isOnline,
        },
      });
    }

    // Update last synced
    await this.prisma.smartHomeIntegration.update({
      where: { id: integrationId },
      data: { lastSynced: new Date() },
    });

    return { success: true, devicesFound: discoveredDevices.length };
  }

  // Mock device discovery
  private async discoverDevicesFromProvider(integration: any): Promise<any[]> {
    // In production, call actual provider APIs
    // This is a mock implementation
    return [];
  }

  // Get user's devices
  async getDevices(userId: string, room?: string, type?: string) {
    const where: any = { userId };
    if (room) where.room = room;
    if (type) where.type = type;

    return this.prisma.smartDevice.findMany({
      where,
      include: {
        integration: { select: { provider: true } },
      },
      orderBy: [{ room: 'asc' }, { name: 'asc' }],
    });
  }

  // Get device details
  async getDevice(userId: string, deviceId: string) {
    const device = await this.prisma.smartDevice.findUnique({
      where: { id: deviceId },
      include: {
        integration: { select: { id: true, provider: true } },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Get current state (in production, fetch from provider)
    const state = await this.getDeviceState(device);

    return {
      ...device,
      state,
    };
  }

  // Get device state from provider
  private async getDeviceState(device: any): Promise<any> {
    // In production, call provider API to get current state
    // Mock implementation
    return device.currentState || { power: 'off' };
  }

  // Control device
  async controlDevice(
    userId: string,
    deviceId: string,
    command: {
      action: string;
      value?: any;
    },
  ) {
    const device = await this.prisma.smartDevice.findUnique({
      where: { id: deviceId },
      include: { integration: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (!device.isOnline) {
      throw new BadRequestException('Device is offline');
    }

    // Validate command against device capabilities
    const capabilities = device.capabilities as string[];
    if (!capabilities.includes(command.action)) {
      throw new BadRequestException(`Device does not support action: ${command.action}`);
    }

    // In production, send command to provider API
    const success = await this.sendCommandToProvider(device, command);

    if (success) {
      // Update local state
      const newState = this.calculateNewState(device.currentState as any, command);
      await this.prisma.smartDevice.update({
        where: { id: deviceId },
        data: { currentState: newState },
      });

      // Log the action
      await this.prisma.smartDeviceLog.create({
        data: {
          deviceId,
          userId,
          action: command.action,
          value: command.value,
          success: true,
        },
      });

      return { success: true, newState };
    }

    throw new BadRequestException('Failed to control device');
  }

  // Send command to provider
  private async sendCommandToProvider(device: any, command: any): Promise<boolean> {
    // In production, call provider API
    // Mock implementation - always succeed
    return true;
  }

  // Calculate new state based on command
  private calculateNewState(currentState: any, command: any): any {
    const newState = { ...currentState };

    switch (command.action) {
      case 'power':
        newState.power = command.value;
        break;
      case 'brightness':
        newState.brightness = command.value;
        break;
      case 'color':
        newState.color = command.value;
        break;
      case 'temperature':
        newState.temperature = command.value;
        break;
      case 'speed':
        newState.speed = command.value;
        break;
      case 'mode':
        newState.mode = command.value;
        break;
      case 'lock':
        newState.locked = command.value;
        break;
    }

    return newState;
  }

  // Create automation
  async createAutomation(
    userId: string,
    data: {
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
    // Verify all devices belong to user
    const deviceIds = data.actions.map(a => a.deviceId);
    const devices = await this.prisma.smartDevice.findMany({
      where: { id: { in: deviceIds }, userId },
    });

    if (devices.length !== deviceIds.length) {
      throw new ForbiddenException('Some devices do not belong to you');
    }

    return this.prisma.smartAutomation.create({
      data: {
        userId,
        name: data.name,
        trigger: data.trigger,
        actions: data.actions,
        isActive: data.isActive ?? true,
      },
    });
  }

  // Get automations
  async getAutomations(userId: string) {
    return this.prisma.smartAutomation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Update automation
  async updateAutomation(userId: string, automationId: string, data: any) {
    const automation = await this.prisma.smartAutomation.findUnique({
      where: { id: automationId },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    if (automation.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.smartAutomation.update({
      where: { id: automationId },
      data,
    });
  }

  // Delete automation
  async deleteAutomation(userId: string, automationId: string) {
    const automation = await this.prisma.smartAutomation.findUnique({
      where: { id: automationId },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    if (automation.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    await this.prisma.smartAutomation.delete({
      where: { id: automationId },
    });

    return { success: true };
  }

  // Trigger automation manually
  async triggerAutomation(userId: string, automationId: string) {
    const automation = await this.prisma.smartAutomation.findUnique({
      where: { id: automationId },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    if (automation.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const actions = automation.actions as any[];
    const results = [];

    for (const action of actions) {
      if (action.delay) {
        await new Promise(resolve => setTimeout(resolve, action.delay));
      }

      try {
        const result = await this.controlDevice(userId, action.deviceId, action.command);
        results.push({ deviceId: action.deviceId, success: true, result });
      } catch (error) {
        results.push({ deviceId: action.deviceId, success: false, error: error.message });
      }
    }

    // Update last triggered
    await this.prisma.smartAutomation.update({
      where: { id: automationId },
      data: { lastTriggered: new Date() },
    });

    return { success: true, results };
  }

  // Create scene (group of device states)
  async createScene(
    userId: string,
    data: {
      name: string;
      icon?: string;
      devices: Array<{
        deviceId: string;
        state: any;
      }>;
    },
  ) {
    // Verify all devices belong to user
    const deviceIds = data.devices.map(d => d.deviceId);
    const devices = await this.prisma.smartDevice.findMany({
      where: { id: { in: deviceIds }, userId },
    });

    if (devices.length !== deviceIds.length) {
      throw new ForbiddenException('Some devices do not belong to you');
    }

    return this.prisma.smartScene.create({
      data: {
        userId,
        name: data.name,
        icon: data.icon,
        devices: data.devices,
      },
    });
  }

  // Get scenes
  async getScenes(userId: string) {
    return this.prisma.smartScene.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  // Activate scene
  async activateScene(userId: string, sceneId: string) {
    const scene = await this.prisma.smartScene.findUnique({
      where: { id: sceneId },
    });

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    if (scene.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const devices = scene.devices as any[];
    const results = [];

    for (const deviceConfig of devices) {
      try {
        // Set each device to its scene state
        const device = await this.prisma.smartDevice.findUnique({
          where: { id: deviceConfig.deviceId },
        });

        if (device && device.isOnline) {
          // In production, send all state changes to provider
          await this.prisma.smartDevice.update({
            where: { id: deviceConfig.deviceId },
            data: { currentState: deviceConfig.state },
          });
          results.push({ deviceId: deviceConfig.deviceId, success: true });
        } else {
          results.push({ deviceId: deviceConfig.deviceId, success: false, error: 'Device offline' });
        }
      } catch (error) {
        results.push({ deviceId: deviceConfig.deviceId, success: false, error: error.message });
      }
    }

    return { success: true, results };
  }

  // Delete scene
  async deleteScene(userId: string, sceneId: string) {
    const scene = await this.prisma.smartScene.findUnique({
      where: { id: sceneId },
    });

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    if (scene.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    await this.prisma.smartScene.delete({
      where: { id: sceneId },
    });

    return { success: true };
  }

  // Get rooms
  async getRooms(userId: string) {
    const devices = await this.prisma.smartDevice.findMany({
      where: { userId },
      select: { room: true },
      distinct: ['room'],
    });

    return devices.map(d => d.room).filter(Boolean);
  }

  // Get device logs
  async getDeviceLogs(userId: string, deviceId: string, page: number, limit: number) {
    const device = await this.prisma.smartDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.smartDeviceLog.findMany({
        where: { deviceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.smartDeviceLog.count({ where: { deviceId } }),
    ]);

    return {
      data: logs,
      pagination: { page, limit, total, hasMore: skip + logs.length < total },
    };
  }

  // Get supported providers
  getSupportedProviders() {
    const providerInfo: Record<string, { name: string; logo: string; features: string[] }> = {
      google_home: {
        name: 'Google Home',
        logo: 'https://example.com/google-home.png',
        features: ['voice_control', 'routines', 'remote_access'],
      },
      amazon_alexa: {
        name: 'Amazon Alexa',
        logo: 'https://example.com/alexa.png',
        features: ['voice_control', 'routines', 'skills'],
      },
      apple_homekit: {
        name: 'Apple HomeKit',
        logo: 'https://example.com/homekit.png',
        features: ['siri_control', 'scenes', 'automations'],
      },
      smartthings: {
        name: 'Samsung SmartThings',
        logo: 'https://example.com/smartthings.png',
        features: ['automations', 'scenes', 'wide_compatibility'],
      },
      tuya: {
        name: 'Tuya Smart',
        logo: 'https://example.com/tuya.png',
        features: ['affordable_devices', 'wide_range'],
      },
      mi_home: {
        name: 'Mi Home',
        logo: 'https://example.com/mi-home.png',
        features: ['xiaomi_ecosystem', 'automations'],
      },
      philips_hue: {
        name: 'Philips Hue',
        logo: 'https://example.com/hue.png',
        features: ['smart_lighting', 'color_control', 'scenes'],
      },
      tplink_kasa: {
        name: 'TP-Link Kasa',
        logo: 'https://example.com/kasa.png',
        features: ['smart_plugs', 'smart_switches', 'energy_monitoring'],
      },
    };

    return INTEGRATIONS.map(id => ({
      id,
      ...providerInfo[id],
    }));
  }

  // Get device types
  getDeviceTypes() {
    const typeInfo: Record<string, { name: string; icon: string; capabilities: string[] }> = {
      light: { name: 'Light', icon: 'lightbulb', capabilities: ['power', 'brightness', 'color'] },
      fan: { name: 'Fan', icon: 'fan', capabilities: ['power', 'speed'] },
      ac: { name: 'Air Conditioner', icon: 'ac', capabilities: ['power', 'temperature', 'mode'] },
      tv: { name: 'Television', icon: 'tv', capabilities: ['power', 'volume', 'channel'] },
      door_lock: { name: 'Door Lock', icon: 'lock', capabilities: ['lock'] },
      camera: { name: 'Camera', icon: 'camera', capabilities: ['stream', 'record'] },
      thermostat: { name: 'Thermostat', icon: 'thermostat', capabilities: ['temperature', 'mode'] },
      switch: { name: 'Smart Switch', icon: 'switch', capabilities: ['power'] },
      sensor: { name: 'Sensor', icon: 'sensor', capabilities: ['read'] },
      speaker: { name: 'Speaker', icon: 'speaker', capabilities: ['power', 'volume', 'play'] },
      geyser: { name: 'Geyser', icon: 'water-heater', capabilities: ['power', 'temperature'] },
      refrigerator: { name: 'Refrigerator', icon: 'fridge', capabilities: ['temperature', 'mode'] },
      washing_machine: { name: 'Washing Machine', icon: 'washer', capabilities: ['power', 'mode', 'schedule'] },
      curtain: { name: 'Smart Curtain', icon: 'curtain', capabilities: ['open', 'close', 'position'] },
    };

    return DEVICE_TYPES.map(id => ({
      id,
      ...typeInfo[id],
    }));
  }

  // Energy monitoring
  async getEnergyUsage(userId: string, period: 'day' | 'week' | 'month') {
    const devices = await this.prisma.smartDevice.findMany({
      where: {
        userId,
        capabilities: { has: 'energy_monitoring' },
      },
    });

    // In production, aggregate actual energy data from device logs
    // Mock implementation
    return {
      period,
      totalKwh: 0,
      cost: 0,
      devices: devices.map(d => ({
        deviceId: d.id,
        name: d.name,
        kwh: 0,
      })),
    };
  }
}
