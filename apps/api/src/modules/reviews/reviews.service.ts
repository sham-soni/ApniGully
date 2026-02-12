import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    targetType: 'helper' | 'shop' | 'rental';
    targetId: string;
    taskId?: string;
    rating: number;
    content?: string;
    images?: string[];
  }) {
    const { targetType, targetId, taskId, rating, content, images } = data;

    let isVerified = false;
    let helperProfileId: string | undefined;
    let shopId: string | undefined;
    let rentalId: string | undefined;

    // Validate target exists
    if (targetType === 'helper') {
      const profile = await this.prisma.helperProfile.findUnique({ where: { id: targetId } });
      if (!profile) throw new NotFoundException('Helper not found');
      helperProfileId = targetId;
    } else if (targetType === 'shop') {
      const shop = await this.prisma.shop.findUnique({ where: { id: targetId } });
      if (!shop) throw new NotFoundException('Shop not found');
      shopId = targetId;
    } else if (targetType === 'rental') {
      const rental = await this.prisma.rentalListing.findUnique({ where: { id: targetId } });
      if (!rental) throw new NotFoundException('Rental not found');
      rentalId = targetId;
    }

    // If task is provided, verify it and mark review as verified
    if (taskId) {
      const task = await this.prisma.task.findUnique({ where: { id: taskId } });
      if (!task) throw new BadRequestException('Task not found');
      if (task.requesterId !== userId) throw new ForbiddenException('Not authorized');
      if (task.status !== 'completed') throw new BadRequestException('Task not completed');

      // Verify task matches target
      if (targetType === 'helper' && task.helperProfileId !== targetId) {
        throw new BadRequestException('Task does not match helper');
      }
      if (targetType === 'shop' && task.shopId !== targetId) {
        throw new BadRequestException('Task does not match shop');
      }

      isVerified = true;
    }

    // Check for existing review
    const existing = await this.prisma.review.findFirst({
      where: { userId, helperProfileId, shopId, rentalId },
    });
    if (existing) throw new BadRequestException('Already reviewed');

    const review = await this.prisma.review.create({
      data: {
        userId,
        targetType,
        helperProfileId,
        shopId,
        rentalId,
        taskId,
        rating,
        content,
        images: images || [],
        isVerified,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update target's rating
    await this.updateTargetRating(targetType, targetId);

    return review;
  }

  async updateTargetRating(targetType: string, targetId: string) {
    const reviews = await this.prisma.review.findMany({
      where: targetType === 'helper'
        ? { helperProfileId: targetId }
        : targetType === 'shop'
        ? { shopId: targetId }
        : { rentalId: targetId },
      select: { rating: true },
    });

    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    if (targetType === 'helper') {
      await this.prisma.helperProfile.update({
        where: { id: targetId },
        data: { rating: avgRating, reviewCount: reviews.length },
      });
    } else if (targetType === 'shop') {
      await this.prisma.shop.update({
        where: { id: targetId },
        data: { rating: avgRating, reviewCount: reviews.length },
      });
    }
  }

  async getReviewsForTarget(targetType: string, targetId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = targetType === 'helper'
      ? { helperProfileId: targetId }
      : targetType === 'shop'
      ? { shopId: targetId }
      : { rentalId: targetId };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        },
        orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data: reviews, pagination: { page, limit, total, hasMore: skip + reviews.length < total } };
  }

  async getUserReviews(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        include: {
          helperProfile: { include: { user: { select: { name: true } } } },
          shop: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { userId } }),
    ]);

    return { data: reviews, pagination: { page, limit, total, hasMore: skip + reviews.length < total } };
  }
}
