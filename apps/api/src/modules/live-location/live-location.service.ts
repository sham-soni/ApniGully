import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class LiveLocationService {
  constructor(private prisma: PrismaService) {}

  async startSharing(
    userId: string,
    data: {
      purpose: 'safe_walk' | 'meetup' | 'emergency' | 'delivery';
      latitude: number;
      longitude: number;
      sharedWith: string[];
      durationMinutes?: number;
    },
  ) {
    const durationMinutes = data.durationMinutes || 60;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const sessionId = `LL_${randomBytes(8).toString('hex')}`;

    const session = await this.prisma.liveLocation.create({
      data: {
        userId,
        sessionId,
        latitude: data.latitude,
        longitude: data.longitude,
        purpose: data.purpose,
        sharedWith: data.sharedWith,
        expiresAt,
        isActive: true,
      },
    });

    // Create initial history point
    await this.prisma.locationHistory.create({
      data: {
        liveLocationId: session.id,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });

    // Notify shared users
    await this.notifyViewers(userId, data.sharedWith, session);

    return session;
  }

  private async notifyViewers(sharerId: string, viewerIds: string[], session: any) {
    const sharer = await this.prisma.user.findUnique({
      where: { id: sharerId },
      select: { name: true },
    });

    const purposeLabels: Record<string, string> = {
      safe_walk: 'is on a safe walk',
      meetup: 'is sharing location for meetup',
      emergency: 'has shared emergency location',
      delivery: 'is sharing delivery location',
    };

    const notifications = viewerIds.map(userId => ({
      userId,
      type: 'live_location_shared',
      title: 'Location Shared',
      body: `${sharer?.name} ${purposeLabels[session.purpose]}`,
      data: {
        sessionId: session.sessionId,
        purpose: session.purpose,
      },
    }));

    await this.prisma.notification.createMany({
      data: notifications,
    });
  }

  async updateLocation(
    userId: string,
    sessionId: string,
    data: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
    },
  ) {
    const session = await this.prisma.liveLocation.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only update your own location');
    }

    if (!session.isActive || new Date() > session.expiresAt) {
      throw new BadRequestException('Session has expired');
    }

    // Update current location
    const updated = await this.prisma.liveLocation.update({
      where: { sessionId },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        heading: data.heading,
        speed: data.speed,
        lastUpdatedAt: new Date(),
      },
    });

    // Add to history
    await this.prisma.locationHistory.create({
      data: {
        liveLocationId: session.id,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
      },
    });

    return updated;
  }

  async stopSharing(userId: string, sessionId: string) {
    const session = await this.prisma.liveLocation.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only stop your own sharing');
    }

    return this.prisma.liveLocation.update({
      where: { sessionId },
      data: { isActive: false },
    });
  }

  async extendSharing(userId: string, sessionId: string, additionalMinutes: number) {
    const session = await this.prisma.liveLocation.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only extend your own sharing');
    }

    const newExpiry = new Date(session.expiresAt.getTime() + additionalMinutes * 60 * 1000);

    return this.prisma.liveLocation.update({
      where: { sessionId },
      data: {
        expiresAt: newExpiry,
        isActive: true,
      },
    });
  }

  async addViewer(userId: string, sessionId: string, viewerId: string) {
    const session = await this.prisma.liveLocation.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only modify your own sharing');
    }

    if (session.sharedWith.includes(viewerId)) {
      throw new BadRequestException('User is already a viewer');
    }

    const updated = await this.prisma.liveLocation.update({
      where: { sessionId },
      data: {
        sharedWith: { push: viewerId },
      },
    });

    // Notify new viewer
    await this.notifyViewers(userId, [viewerId], session);

    return updated;
  }

  async removeViewer(userId: string, sessionId: string, viewerId: string) {
    const session = await this.prisma.liveLocation.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only modify your own sharing');
    }

    const newSharedWith = session.sharedWith.filter(id => id !== viewerId);

    return this.prisma.liveLocation.update({
      where: { sessionId },
      data: { sharedWith: newSharedWith },
    });
  }

  async getActiveSessions(userId: string) {
    return this.prisma.liveLocation.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLocationsSharedWithMe(userId: string) {
    const sessions = await this.prisma.liveLocation.findMany({
      where: {
        sharedWith: { has: userId },
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUpdatedAt: 'desc' },
    });

    // Get user details
    const userIds = sessions.map(s => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, phone: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return sessions.map(session => ({
      ...session,
      user: userMap.get(session.userId),
    }));
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.liveLocation.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check access
    const isOwner = session.userId === userId;
    const isViewer = session.sharedWith.includes(userId);

    if (!isOwner && !isViewer) {
      throw new ForbiddenException('You do not have access to this session');
    }

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, avatar: true, phone: true },
    });

    return {
      ...session,
      user,
      isOwner,
    };
  }

  async getLocationHistory(userId: string, sessionId: string, limit: number) {
    const session = await this.prisma.liveLocation.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check access
    const isOwner = session.userId === userId;
    const isViewer = session.sharedWith.includes(userId);

    if (!isOwner && !isViewer) {
      throw new ForbiddenException('You do not have access to this session');
    }

    return this.prisma.locationHistory.findMany({
      where: { liveLocationId: session.id },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async startSafeWalk(
    userId: string,
    data: {
      latitude: number;
      longitude: number;
      destination?: { lat: number; lng: number; address: string };
      estimatedArrival?: number;
    },
  ) {
    // Get emergency contacts
    const contacts = await this.prisma.emergencyContact.findMany({
      where: { userId, canReceiveSOS: true },
    });

    // For now, we'll just start a regular share with emergency contacts
    // In production, we would also have a separate SafeWalk model to track destination, ETA, etc.

    const session = await this.startSharing(userId, {
      purpose: 'safe_walk',
      latitude: data.latitude,
      longitude: data.longitude,
      sharedWith: [], // Emergency contacts would be notified via SMS
      durationMinutes: data.estimatedArrival || 60,
    });

    // In production: Send SMS to emergency contacts with tracking link

    return {
      ...session,
      emergencyContactsNotified: contacts.length,
      destination: data.destination,
    };
  }

  async markSafeArrival(userId: string, sessionId: string) {
    const session = await this.prisma.liveLocation.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only mark your own arrival');
    }

    // Stop sharing
    await this.stopSharing(userId, sessionId);

    // Notify viewers
    const sharer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (session.sharedWith.length > 0) {
      await this.prisma.notification.createMany({
        data: session.sharedWith.map(viewerId => ({
          userId: viewerId,
          type: 'safe_arrival',
          title: 'Safe Arrival',
          body: `${sharer?.name} has arrived safely`,
          data: { sessionId },
        })),
      });
    }

    return { success: true, message: 'Marked as safely arrived' };
  }

  // Cleanup expired sessions (call from cron job)
  async cleanupExpiredSessions() {
    await this.prisma.liveLocation.updateMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
      },
      data: { isActive: false },
    });
  }
}
