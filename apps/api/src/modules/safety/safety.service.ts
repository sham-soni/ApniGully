import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SafetyService {
  constructor(private prisma: PrismaService) {}

  async createAlert(userId: string, neighborhoodId: string, data: {
    title: string;
    content: string;
    latitude?: number;
    longitude?: number;
  }) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Must be a member');
    }

    // Rate limit: 1 alert per hour per user
    const recentAlert = await this.prisma.safetyAlert.findFirst({
      where: {
        createdById: userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (recentAlert) {
      throw new BadRequestException('You can only create one safety alert per hour');
    }

    const alert = await this.prisma.safetyAlert.create({
      data: {
        neighborhoodId,
        createdById: userId,
        ...data,
      },
    });

    // Also create a post for the feed
    await this.prisma.post.create({
      data: {
        userId,
        neighborhoodId,
        type: 'safety_alert',
        title: data.title,
        content: data.content,
        isUrgent: true,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });

    // Notify admins/moderators
    const moderators = await this.prisma.membership.findMany({
      where: {
        neighborhoodId,
        role: { in: ['admin', 'moderator'] },
        isActive: true,
      },
      include: { user: true },
    });

    for (const mod of moderators) {
      await this.prisma.notification.create({
        data: {
          userId: mod.userId,
          type: 'safety_alert',
          title: 'Safety Alert',
          body: data.title,
          data: { alertId: alert.id },
        },
      });
    }

    return alert;
  }

  async getActiveAlerts(neighborhoodId: string) {
    return this.prisma.safetyAlert.findMany({
      where: { neighborhoodId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { checkIns: true } },
      },
    });
  }

  async checkIn(userId: string, alertId: string, isSafe: boolean, message?: string) {
    const alert = await this.prisma.safetyAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('Alert not found');

    await this.prisma.safeCheckIn.upsert({
      where: { alertId_userId: { alertId, userId } },
      update: { isSafe, message },
      create: { alertId, userId, isSafe, message },
    });

    await this.prisma.safetyAlert.update({
      where: { id: alertId },
      data: { checkInCount: { increment: 1 } },
    });

    return { success: true };
  }

  async resolveAlert(userId: string, alertId: string) {
    const alert = await this.prisma.safetyAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('Alert not found');

    // Verify moderator
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId: alert.neighborhoodId } },
    });

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
      throw new ForbiddenException('Only moderators can resolve alerts');
    }

    return this.prisma.safetyAlert.update({
      where: { id: alertId },
      data: { isActive: false, resolvedAt: new Date() },
    });
  }

  async getCheckIns(alertId: string) {
    return this.prisma.safeCheckIn.findMany({
      where: { alertId },
      include: { alert: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
