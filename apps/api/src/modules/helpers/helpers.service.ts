import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HelperSkill, Language, VerificationStatus } from '@prisma/client';

interface WeeklySchedule {
  monday: { start: string; end: string }[];
  tuesday: { start: string; end: string }[];
  wednesday: { start: string; end: string }[];
  thursday: { start: string; end: string }[];
  friday: { start: string; end: string }[];
  saturday: { start: string; end: string }[];
  sunday: { start: string; end: string }[];
}

@Injectable()
export class HelpersService {
  constructor(private prisma: PrismaService) {}

  async createProfile(
    userId: string,
    neighborhoodId: string,
    data: {
      skills: HelperSkill[];
      experience: number;
      languages: Language[];
      hourlyRate?: number;
      monthlyRate?: number;
      availability: WeeklySchedule;
      bio?: string;
    },
  ) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You must be a member to create a helper profile');
    }

    // Check if profile already exists
    const existing = await this.prisma.helperProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Helper profile already exists');
    }

    const profile = await this.prisma.helperProfile.create({
      data: {
        userId,
        neighborhoodId,
        skills: data.skills,
        experience: data.experience,
        languages: data.languages,
        hourlyRate: data.hourlyRate,
        monthlyRate: data.monthlyRate,
        availability: data.availability,
        bio: data.bio,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, isVerified: true, trustScore: true },
        },
      },
    });

    // Update user role
    await this.prisma.membership.update({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
      data: { role: 'helper' },
    });

    return profile;
  }

  async findById(id: string) {
    const profile = await this.prisma.helperProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, isVerified: true, trustScore: true, endorsementCount: true },
        },
        neighborhood: { select: { name: true } },
        reviews: {
          where: { isVerified: true },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Helper profile not found');
    }

    return profile;
  }

  async getHelpers(
    neighborhoodId: string,
    filters: {
      skills?: HelperSkill[];
      languages?: Language[];
      availableNow?: boolean;
      minRating?: number;
      verified?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const { skills, languages, availableNow, minRating, verified, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      neighborhoodId,
      isActive: true,
    };

    if (skills && skills.length > 0) {
      where.skills = { hasSome: skills };
    }

    if (languages && languages.length > 0) {
      where.languages = { hasSome: languages };
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (verified) {
      where.backgroundCheckStatus = 'verified';
    }

    // For available now, we'd check against current day and time
    // This is simplified for now

    const [helpers, total] = await Promise.all([
      this.prisma.helperProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true, isVerified: true, trustScore: true },
          },
        },
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.helperProfile.count({ where }),
    ]);

    return {
      data: helpers,
      pagination: { page, limit, total, hasMore: skip + helpers.length < total },
    };
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      skills: HelperSkill[];
      experience: number;
      languages: Language[];
      hourlyRate: number;
      monthlyRate: number;
      availability: WeeklySchedule;
      bio: string;
      isActive: boolean;
    }>,
  ) {
    const profile = await this.prisma.helperProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Helper profile not found');
    }

    return this.prisma.helperProfile.update({
      where: { userId },
      data,
    });
  }

  async getReviews(helperId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { helperProfileId: helperId },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          task: { select: { id: true, description: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { helperProfileId: helperId } }),
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, hasMore: skip + reviews.length < total },
    };
  }

  async requestBooking(
    userId: string,
    helperId: string,
    data: {
      description?: string;
      scheduledAt?: Date;
    },
  ) {
    const profile = await this.prisma.helperProfile.findUnique({
      where: { id: helperId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Helper profile not found');
    }

    if (!profile.isActive) {
      throw new BadRequestException('Helper is not available');
    }

    // Create chat
    let chat = await this.prisma.chat.findFirst({
      where: {
        type: 'task',
        participants: {
          every: { userId: { in: [userId, profile.userId] } },
        },
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          type: 'task',
          participants: {
            create: [{ userId }, { userId: profile.userId }],
          },
        },
      });
    }

    // Create task
    const task = await this.prisma.task.create({
      data: {
        requesterId: userId,
        providerId: profile.userId,
        helperProfileId: helperId,
        description: data.description,
        scheduledAt: data.scheduledAt,
        status: 'pending',
      },
    });

    // Update chat with task
    await this.prisma.chat.update({
      where: { id: chat.id },
      data: { taskId: task.id },
    });

    // Send booking request message
    await this.prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: userId,
        content: `Booking Request: ${data.description || 'No description provided'}`,
        type: 'system',
      },
    });

    return { chatId: chat.id, taskId: task.id };
  }

  async updateBackgroundCheck(helperId: string, status: VerificationStatus) {
    return this.prisma.helperProfile.update({
      where: { id: helperId },
      data: {
        backgroundCheckStatus: status,
        documentsVerified: status === 'verified',
      },
    });
  }

  async isAvailableNow(helperId: string): Promise<boolean> {
    const profile = await this.prisma.helperProfile.findUnique({
      where: { id: helperId },
    });

    if (!profile || !profile.isActive) return false;

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const availability = profile.availability as WeeklySchedule;
    const todaySlots = availability[today as keyof WeeklySchedule] || [];

    return todaySlots.some(slot => currentTime >= slot.start && currentTime <= slot.end);
  }
}
