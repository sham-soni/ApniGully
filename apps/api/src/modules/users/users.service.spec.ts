import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    blockedUser: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    membership: {
      findMany: jest.fn(),
    },
    endorsement: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    review: {
      count: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    savedPost: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-1',
    phone: '+919876543210',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    language: 'en',
    isVerified: false,
    trustScore: 50,
    endorsementCount: 0,
    isActive: true,
    isBanned: false,
    pushToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    memberships: [],
    helperProfile: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = { name: 'New Name' };
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, ...updateData });

      const result = await service.updateProfile('user-1', updateData);

      expect(result.name).toBe('New Name');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateData,
      });
    });

    it('should check email uniqueness when updating email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'other-user' });

      await expect(
        service.updateProfile('user-1', { email: 'existing@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSettings', () => {
    const mockSettings = {
      id: 'settings-1',
      userId: 'user-1',
      pushEnabled: true,
      messageNotifs: true,
      postNotifs: true,
      safetyAlerts: true,
      emailDigest: true,
      profileVisibility: 'neighbors',
      showPhone: false,
      showOnlineStatus: true,
      showLocation: true,
      theme: 'system',
      language: 'en',
    };

    it('should return existing settings', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings);

      const result = await service.getSettings('user-1');

      expect(result).toEqual(mockSettings);
    });

    it('should create default settings if not exist', async () => {
      mockPrisma.userSettings.findUnique.mockResolvedValue(null);
      mockPrisma.userSettings.create.mockResolvedValue(mockSettings);

      const result = await service.getSettings('user-1');

      expect(mockPrisma.userSettings.create).toHaveBeenCalledWith({
        data: { userId: 'user-1' },
      });
    });
  });

  describe('updateSettings', () => {
    it('should update user settings', async () => {
      const mockSettings = {
        id: 'settings-1',
        userId: 'user-1',
        pushEnabled: true,
      };
      mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings);
      mockPrisma.userSettings.update.mockResolvedValue({
        ...mockSettings,
        pushEnabled: false,
      });

      const result = await service.updateSettings('user-1', { pushEnabled: false });

      expect(result.pushEnabled).toBe(false);
    });
  });

  describe('blockUser', () => {
    it('should block a user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);
      mockPrisma.blockedUser.create.mockResolvedValue({
        id: 'block-1',
        userId: 'user-1',
        blockedId: 'user-2',
        blocked: { id: 'user-2', name: 'Blocked User' },
      });

      const result = await service.blockUser('user-1', 'user-2');

      expect(result.blockedId).toBe('user-2');
    });

    it('should throw error when blocking self', async () => {
      await expect(service.blockUser('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when user already blocked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.blockedUser.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.blockUser('user-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user', async () => {
      mockPrisma.blockedUser.findUnique.mockResolvedValue({ id: 'block-1' });
      mockPrisma.blockedUser.delete.mockResolvedValue({ id: 'block-1' });

      await expect(service.unblockUser('user-1', 'user-2')).resolves.not.toThrow();
    });

    it('should throw error when user not blocked', async () => {
      mockPrisma.blockedUser.findUnique.mockResolvedValue(null);

      await expect(service.unblockUser('user-1', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isUserBlocked', () => {
    it('should return true if user is blocked', async () => {
      mockPrisma.blockedUser.findFirst.mockResolvedValue({ id: 'block-1' });

      const result = await service.isUserBlocked('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('should return false if user is not blocked', async () => {
      mockPrisma.blockedUser.findFirst.mockResolvedValue(null);

      const result = await service.isUserBlocked('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });
});
