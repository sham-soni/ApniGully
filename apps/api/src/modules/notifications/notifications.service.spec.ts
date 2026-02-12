import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseService } from './firebase.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let firebase: FirebaseService;

  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    neighborhoodMember: {
      findMany: jest.fn(),
    },
  };

  const mockFirebase = {
    sendPushNotification: jest.fn(),
    sendMulticastNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FirebaseService, useValue: mockFirebase },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    firebase = module.get<FirebaseService>(FirebaseService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const notificationData = {
        type: 'post',
        title: 'New Post',
        body: 'Someone posted in your neighborhood',
      };
      const mockNotification = { id: 'notif-1', userId: 'user-1', ...notificationData };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create('user-1', notificationData);

      expect(result).toEqual(mockNotification);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', ...notificationData },
      });
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Test 1', isRead: false },
        { id: 'notif-2', title: 'Test 2', isRead: true },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5); // unread

      const result = await service.getNotifications('user-1', 1, 20);

      expect(result.data).toEqual(mockNotifications);
      expect(result.unreadCount).toBe(5);
      expect(result.pagination.total).toBe(10);
    });

    it('should filter unread only when specified', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.getNotifications('user-1', 1, 20, true);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', isRead: false },
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('user-1', 'notif-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('sendPush', () => {
    it('should send push notification when user has token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        pushToken: 'token-123',
      });
      mockFirebase.sendPushNotification.mockResolvedValue(true);

      const result = await service.sendPush('user-1', 'Title', 'Body');

      expect(result).toBe(true);
      expect(mockFirebase.sendPushNotification).toHaveBeenCalledWith(
        'token-123',
        expect.objectContaining({
          title: 'Title',
          body: 'Body',
        }),
      );
    });

    it('should not send push when user has no token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        pushToken: null,
      });

      const result = await service.sendPush('user-1', 'Title', 'Body');

      expect(result).toBe(false);
      expect(mockFirebase.sendPushNotification).not.toHaveBeenCalled();
    });

    it('should clear invalid token on failure', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        pushToken: 'invalid-token',
      });
      mockFirebase.sendPushNotification.mockResolvedValue(false);

      await service.sendPush('user-1', 'Title', 'Body');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { pushToken: null },
      });
    });
  });

  describe('sendPushToMultipleUsers', () => {
    it('should send multicast notification', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', pushToken: 'token-1' },
        { id: 'user-2', pushToken: 'token-2' },
      ]);
      mockFirebase.sendMulticastNotification.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        invalidTokens: [],
      });

      const result = await service.sendPushToMultipleUsers(
        ['user-1', 'user-2'],
        'Title',
        'Body',
      );

      expect(result.successCount).toBe(2);
      expect(mockFirebase.sendMulticastNotification).toHaveBeenCalledWith(
        ['token-1', 'token-2'],
        expect.any(Object),
      );
    });

    it('should handle no users with push tokens', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.sendPushToMultipleUsers(
        ['user-1'],
        'Title',
        'Body',
      );

      expect(result.successCount).toBe(0);
      expect(mockFirebase.sendMulticastNotification).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });
  });
});
