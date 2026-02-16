import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { SOSStatus } from '@prisma/client';

@Injectable()
export class SOSService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  async triggerSOS(
    userId: string,
    data: {
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
    // Verify user is member of neighborhood
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId: data.neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You must be a member of this neighborhood');
    }

    // Create SOS alert
    const alert = await this.prisma.sOSAlert.create({
      data: {
        userId,
        neighborhoodId: data.neighborhoodId,
        type: data.type,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        description: data.description,
        audioUrl: data.audioUrl,
        images: data.images || [],
        status: 'active',
      },
      include: {
        responders: true,
      },
    });

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true, avatar: true },
    });

    // Notify nearby members
    await this.notifyNearbyMembers(alert, user);

    // Notify emergency contacts
    await this.notifyEmergencyContacts(userId, alert);

    return {
      ...alert,
      user,
    };
  }

  private async notifyNearbyMembers(alert: any, user: any) {
    // Get all active members in the neighborhood
    const members = await this.prisma.membership.findMany({
      where: {
        neighborhoodId: alert.neighborhoodId,
        isActive: true,
        userId: { not: alert.userId },
      },
      select: { userId: true },
    });

    // Create notifications for all members
    const notifications = members.map(member => ({
      userId: member.userId,
      type: 'sos_alert',
      title: `🆘 Emergency: ${this.getSOSTypeLabel(alert.type)}`,
      body: `${user.name} needs help! ${alert.address || 'Tap for location'}`,
      data: {
        alertId: alert.id,
        type: alert.type,
        latitude: alert.latitude,
        longitude: alert.longitude,
      },
    }));

    await this.prisma.notification.createMany({
      data: notifications,
    });

    // In production: Send push notifications
  }

  private getSOSTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      medical: 'Medical Emergency',
      fire: 'Fire Emergency',
      crime: 'Crime/Safety',
      accident: 'Accident',
      other: 'Emergency',
    };
    return labels[type] || 'Emergency';
  }

  private async notifyEmergencyContacts(userId: string, alert: any) {
    const contacts = await this.prisma.emergencyContact.findMany({
      where: { userId, canReceiveSOS: true },
    });

    // In production: Send SMS/call to emergency contacts
    // For now, just log
    console.log(`Notifying ${contacts.length} emergency contacts for SOS ${alert.id}`);
  }

  async respondToSOS(
    alertId: string,
    userId: string,
    data: { message?: string; latitude?: number; longitude?: number },
  ) {
    const alert = await this.prisma.sOSAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('SOS alert not found');
    }

    if (alert.status !== 'active') {
      throw new BadRequestException('This SOS is no longer active');
    }

    if (alert.userId === userId) {
      throw new BadRequestException('You cannot respond to your own SOS');
    }

    // Check if already responding
    const existing = await this.prisma.sOSResponder.findUnique({
      where: { alertId_userId: { alertId, userId } },
    });

    if (existing) {
      throw new BadRequestException('You are already responding to this SOS');
    }

    // Create responder record
    const responder = await this.prisma.sOSResponder.create({
      data: {
        alertId,
        userId,
        status: 'responding',
        message: data.message,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });

    // Update responder count
    await this.prisma.sOSAlert.update({
      where: { id: alertId },
      data: {
        responderCount: { increment: 1 },
        status: 'responded',
      },
    });

    // Award karma for responding
    await this.gamificationService.onSOSRespond(userId, alertId);

    // Notify the person who triggered SOS
    const responderUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: alert.userId,
        type: 'sos_response',
        title: 'Help is on the way!',
        body: `${responderUser?.name} is responding to your SOS`,
        data: { alertId, responderId: userId },
      },
    });

    return responder;
  }

  async updateResponderStatus(alertId: string, userId: string, status: 'responding' | 'arrived' | 'helping') {
    const responder = await this.prisma.sOSResponder.findUnique({
      where: { alertId_userId: { alertId, userId } },
    });

    if (!responder) {
      throw new NotFoundException('You are not responding to this SOS');
    }

    const updateData: any = { status };
    if (status === 'arrived') {
      updateData.arrivedAt = new Date();
    }

    return this.prisma.sOSResponder.update({
      where: { id: responder.id },
      data: updateData,
    });
  }

  async addUpdate(alertId: string, userId: string, message: string, type?: string) {
    const alert = await this.prisma.sOSAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('SOS alert not found');
    }

    // Only alert creator or responders can add updates
    const isCreator = alert.userId === userId;
    const isResponder = await this.prisma.sOSResponder.findUnique({
      where: { alertId_userId: { alertId, userId } },
    });

    if (!isCreator && !isResponder) {
      throw new ForbiddenException('Only the alert creator or responders can add updates');
    }

    return this.prisma.sOSUpdate.create({
      data: {
        alertId,
        userId,
        message,
        type: type || 'status_update',
      },
    });
  }

  async resolveSOS(alertId: string, userId: string, resolution?: string) {
    const alert = await this.prisma.sOSAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('SOS alert not found');
    }

    if (alert.userId !== userId) {
      throw new ForbiddenException('Only the alert creator can resolve it');
    }

    // Update alert
    const updated = await this.prisma.sOSAlert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
      },
    });

    // Add resolution update
    if (resolution) {
      await this.prisma.sOSUpdate.create({
        data: {
          alertId,
          userId,
          message: resolution,
          type: 'resolution',
        },
      });
    }

    // Notify responders
    const responders = await this.prisma.sOSResponder.findMany({
      where: { alertId },
      select: { userId: true },
    });

    if (responders.length > 0) {
      await this.prisma.notification.createMany({
        data: responders.map(r => ({
          userId: r.userId,
          type: 'sos_resolved',
          title: 'SOS Resolved',
          body: `The emergency has been resolved. Thank you for responding!`,
          data: { alertId },
        })),
      });
    }

    return updated;
  }

  async cancelSOS(alertId: string, userId: string) {
    const alert = await this.prisma.sOSAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('SOS alert not found');
    }

    if (alert.userId !== userId) {
      throw new ForbiddenException('Only the alert creator can cancel it');
    }

    // Update alert
    const updated = await this.prisma.sOSAlert.update({
      where: { id: alertId },
      data: {
        status: 'false_alarm',
        cancelledAt: new Date(),
      },
    });

    // Notify responders
    const responders = await this.prisma.sOSResponder.findMany({
      where: { alertId },
      select: { userId: true },
    });

    if (responders.length > 0) {
      await this.prisma.notification.createMany({
        data: responders.map(r => ({
          userId: r.userId,
          type: 'sos_cancelled',
          title: 'SOS Cancelled',
          body: 'The alert has been cancelled - false alarm',
          data: { alertId },
        })),
      });
    }

    return updated;
  }

  async getActiveAlerts(neighborhoodId: string) {
    const alerts = await this.prisma.sOSAlert.findMany({
      where: {
        neighborhoodId,
        status: { in: ['active', 'responded'] },
      },
      include: {
        responders: {
          include: {
            // Get responder user info manually
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user details
    const userIds = [...new Set([
      ...alerts.map(a => a.userId),
      ...alerts.flatMap(a => a.responders.map(r => r.userId)),
    ])];

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, phone: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return alerts.map(alert => ({
      ...alert,
      user: userMap.get(alert.userId),
      responders: alert.responders.map(r => ({
        ...r,
        user: userMap.get(r.userId),
      })),
    }));
  }

  async getAlert(alertId: string) {
    const alert = await this.prisma.sOSAlert.findUnique({
      where: { id: alertId },
      include: {
        responders: true,
        updates: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException('SOS alert not found');
    }

    // Get user details
    const userIds = [alert.userId, ...alert.responders.map(r => r.userId), ...alert.updates.map(u => u.userId)];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, phone: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      ...alert,
      user: userMap.get(alert.userId),
      responders: alert.responders.map(r => ({
        ...r,
        user: userMap.get(r.userId),
      })),
      updates: alert.updates.map(u => ({
        ...u,
        user: userMap.get(u.userId),
      })),
    };
  }

  async getHistory(neighborhoodId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      this.prisma.sOSAlert.findMany({
        where: { neighborhoodId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sOSAlert.count({ where: { neighborhoodId } }),
    ]);

    // Get user details
    const userIds = alerts.map(a => a.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: alerts.map(alert => ({
        ...alert,
        user: userMap.get(alert.userId),
      })),
      pagination: { page, limit, total, hasMore: skip + alerts.length < total },
    };
  }

  // Emergency Contacts
  async getEmergencyContacts(userId: string) {
    return this.prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async addEmergencyContact(
    userId: string,
    data: {
      name: string;
      phone: string;
      relation: string;
      isPrimary?: boolean;
      canReceiveSOS?: boolean;
    },
  ) {
    // Check limit (max 5 contacts)
    const count = await this.prisma.emergencyContact.count({
      where: { userId },
    });

    if (count >= 5) {
      throw new BadRequestException('Maximum 5 emergency contacts allowed');
    }

    // If setting as primary, unset other primaries
    if (data.isPrimary) {
      await this.prisma.emergencyContact.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.emergencyContact.create({
      data: {
        userId,
        name: data.name,
        phone: data.phone,
        relation: data.relation,
        isPrimary: data.isPrimary ?? false,
        canReceiveSOS: data.canReceiveSOS ?? true,
      },
    });
  }

  async updateEmergencyContact(
    userId: string,
    contactId: string,
    data: Partial<{
      name: string;
      phone: string;
      relation: string;
      isPrimary: boolean;
      canReceiveSOS: boolean;
    }>,
  ) {
    const contact = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // If setting as primary, unset other primaries
    if (data.isPrimary) {
      await this.prisma.emergencyContact.updateMany({
        where: { userId, isPrimary: true, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.emergencyContact.update({
      where: { id: contactId },
      data,
    });
  }

  async deleteEmergencyContact(userId: string, contactId: string) {
    const contact = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.emergencyContact.delete({
      where: { id: contactId },
    });

    return { success: true };
  }

  async getNearbyHelpers(latitude: number, longitude: number, type?: string) {
    // In production, use proper geospatial queries
    // For now, return helpers in nearby neighborhoods

    // Get users with medical skills if type is medical
    let skillFilter = {};
    if (type === 'medical') {
      // Look for users with relevant endorsements
    }

    const helpers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        trustScore: true,
      },
      take: 10,
    });

    return helpers;
  }
}
