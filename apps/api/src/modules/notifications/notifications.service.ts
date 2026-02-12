import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseService, PushNotificationPayload } from './firebase.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  async create(userId: string, data: { type: string; title: string; body: string; data?: any }) {
    return this.prisma.notification.create({
      data: { userId, ...data },
    });
  }

  async getNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, hasMore: skip + notifications.length < total },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async sendPush(userId: string, title: string, body: string, data?: Record<string, string>) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (!user?.pushToken) {
      this.logger.debug(`User ${userId} has no push token`);
      return false;
    }

    const payload: PushNotificationPayload = {
      title,
      body,
      data: data ? { ...data, userId } : { userId },
    };

    const success = await this.firebaseService.sendPushNotification(user.pushToken, payload);

    // Clear invalid token
    if (!success) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { pushToken: null },
      });
    }

    return success;
  }

  async sendPushToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, pushToken: { not: null } },
      select: { id: true, pushToken: true },
    });

    if (users.length === 0) {
      this.logger.debug('No users with push tokens found');
      return { successCount: 0, failureCount: 0 };
    }

    const tokens = users.map((u) => u.pushToken!);
    const tokenToUserId = new Map(users.map((u) => [u.pushToken!, u.id]));

    const payload: PushNotificationPayload = {
      title,
      body,
      data,
    };

    const result = await this.firebaseService.sendMulticastNotification(tokens, payload);

    // Clear invalid tokens
    if (result.invalidTokens.length > 0) {
      const invalidUserIds = result.invalidTokens
        .map((token) => tokenToUserId.get(token))
        .filter(Boolean) as string[];

      await this.prisma.user.updateMany({
        where: { id: { in: invalidUserIds } },
        data: { pushToken: null },
      });
    }

    return { successCount: result.successCount, failureCount: result.failureCount };
  }

  async sendPushToNeighborhood(
    neighborhoodId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    excludeUserId?: string,
  ) {
    const members = await this.prisma.neighborhoodMember.findMany({
      where: { neighborhoodId },
      include: {
        user: { select: { id: true, pushToken: true } },
      },
    });

    const userIds = members
      .filter((m) => m.user.pushToken && m.user.id !== excludeUserId)
      .map((m) => m.user.id);

    if (userIds.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    return this.sendPushToMultipleUsers(userIds, title, body, data);
  }

  async createAndSendPush(
    userId: string,
    notificationType: string,
    title: string,
    body: string,
    data?: any,
  ) {
    // Create in-app notification
    await this.create(userId, { type: notificationType, title, body, data });

    // Send push notification
    const stringData = data
      ? Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)]),
        )
      : undefined;

    await this.sendPush(userId, title, body, stringData);
  }
}
