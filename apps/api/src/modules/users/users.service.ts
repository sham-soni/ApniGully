import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Language } from '@prisma/client';
import { calculateTrustScore } from '@apnigully/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            neighborhood: true,
            building: true,
          },
        },
        helperProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: {
    name?: string;
    email?: string;
    avatar?: string;
    language?: Language;
  }) {
    // Check email uniqueness if provided
    if (data.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId },
        },
      });
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updatePushToken(userId: string, pushToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });
  }

  async getUserTrustScore(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        endorsementsReceived: true,
        reviewsGiven: true,
        reportsReceived: {
          where: { status: 'resolved' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const positiveReviews = await this.prisma.review.count({
      where: {
        helperProfile: { userId },
        rating: { gte: 4 },
      },
    });

    const negativeReviews = await this.prisma.review.count({
      where: {
        helperProfile: { userId },
        rating: { lte: 2 },
      },
    });

    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return calculateTrustScore({
      isVerified: user.isVerified,
      endorsementCount: user.endorsementsReceived.length,
      positiveReviews,
      negativeReviews,
      reportCount: user.reportsReceived.length,
      accountAgeDays,
    });
  }

  async updateTrustScore(userId: string) {
    const scoreBreakdown = await this.getUserTrustScore(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        trustScore: scoreBreakdown.total,
        endorsementCount: scoreBreakdown.endorsementBonus / 3, // reverse calculation
      },
    });

    return scoreBreakdown;
  }

  async createEndorsement(endorserId: string, endorseeId: string, type: 'trust' | 'skill' | 'reliability', message?: string) {
    // Check if endorser is verified
    const endorser = await this.prisma.user.findUnique({
      where: { id: endorserId },
      include: {
        memberships: { where: { isActive: true } },
      },
    });

    if (!endorser) {
      throw new NotFoundException('Endorser not found');
    }

    const isVerified = endorser.memberships.some(
      m => m.verificationStatus === 'verified' || m.role === 'verified_resident',
    );

    if (!isVerified) {
      throw new BadRequestException('Only verified residents can endorse others');
    }

    // Check if endorsee exists
    const endorsee = await this.prisma.user.findUnique({
      where: { id: endorseeId },
    });

    if (!endorsee) {
      throw new NotFoundException('User to endorse not found');
    }

    // Check if they share a neighborhood
    const endorserNeighborhoods = endorser.memberships.map(m => m.neighborhoodId);
    const endorseeNeighborhoods = await this.prisma.membership.findMany({
      where: { userId: endorseeId, isActive: true },
      select: { neighborhoodId: true },
    });

    const sharedNeighborhood = endorseeNeighborhoods.some(
      m => endorserNeighborhoods.includes(m.neighborhoodId),
    );

    if (!sharedNeighborhood) {
      throw new BadRequestException('Can only endorse users in your neighborhood');
    }

    // Create or update endorsement
    const endorsement = await this.prisma.endorsement.upsert({
      where: {
        endorserId_endorseeId_type: {
          endorserId,
          endorseeId,
          type,
        },
      },
      update: { message },
      create: {
        endorserId,
        endorseeId,
        type,
        message,
      },
    });

    // Update trust score
    await this.updateTrustScore(endorseeId);

    return endorsement;
  }

  async getEndorsements(userId: string) {
    return this.prisma.endorsement.findMany({
      where: { endorseeId: userId },
      include: {
        endorser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserActivity(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [posts, reviews, endorsements] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId, isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          neighborhood: { select: { name: true } },
        },
      }),
      this.prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.endorsement.findMany({
        where: { endorserId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          endorsee: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
    ]);

    return {
      posts,
      reviews,
      endorsements,
    };
  }

  async getSavedPosts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [savedPosts, total] = await Promise.all([
      this.prisma.savedPost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          post: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
              neighborhood: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.savedPost.count({ where: { userId } }),
    ]);

    return {
      data: savedPosts.map(sp => sp.post),
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + savedPosts.length < total,
      },
    };
  }

  async deleteAccount(userId: string) {
    // Soft delete - anonymize user data
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Deleted User',
        phone: `deleted_${userId}`,
        email: null,
        avatar: null,
        isActive: false,
        pushToken: null,
      },
    });
  }

  // Settings Management
  async getSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, data: {
    pushEnabled?: boolean;
    messageNotifs?: boolean;
    postNotifs?: boolean;
    safetyAlerts?: boolean;
    emailDigest?: boolean;
    profileVisibility?: string;
    showPhone?: boolean;
    showOnlineStatus?: boolean;
    showLocation?: boolean;
    theme?: string;
    language?: string;
  }) {
    // Ensure settings exist
    await this.getSettings(userId);

    return this.prisma.userSettings.update({
      where: { userId },
      data,
    });
  }

  // Blocked Users Management
  async getBlockedUsers(userId: string) {
    return this.prisma.blockedUser.findMany({
      where: { userId },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async blockUser(userId: string, blockedId: string, reason?: string) {
    // Prevent self-blocking
    if (userId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const existing = await this.prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: { userId, blockedId },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already blocked');
    }

    return this.prisma.blockedUser.create({
      data: {
        userId,
        blockedId,
        reason,
      },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async unblockUser(userId: string, blockedId: string) {
    const blocked = await this.prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: { userId, blockedId },
      },
    });

    if (!blocked) {
      throw new NotFoundException('User is not blocked');
    }

    return this.prisma.blockedUser.delete({
      where: { id: blocked.id },
    });
  }

  async isUserBlocked(userId: string, targetId: string): Promise<boolean> {
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId, blockedId: targetId },
          { userId: targetId, blockedId: userId },
        ],
      },
    });

    return !!blocked;
  }
}
