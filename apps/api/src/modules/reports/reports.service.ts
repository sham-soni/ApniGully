import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import { isRateLimited, RATE_LIMITS } from '@apnigully/shared';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    targetType: 'post' | 'comment' | 'user' | 'message';
    targetId: string;
    reason: string;
    description?: string;
  }) {
    // Rate limiting
    const recentReports = await this.prisma.report.findMany({
      where: {
        reporterId: userId,
        createdAt: { gte: new Date(Date.now() - RATE_LIMITS.REPORTS_PER_USER.windowMs) },
      },
    });

    if (recentReports.length >= RATE_LIMITS.REPORTS_PER_USER.max) {
      throw new BadRequestException('Report limit reached. Please try again later.');
    }

    // Get target user ID if applicable
    let targetUserId: string | undefined;
    let targetPostId: string | undefined;

    if (data.targetType === 'user') {
      targetUserId = data.targetId;
    } else if (data.targetType === 'post') {
      const post = await this.prisma.post.findUnique({ where: { id: data.targetId } });
      if (post) {
        targetPostId = post.id;
        targetUserId = post.userId;
      }
    } else if (data.targetType === 'comment') {
      const comment = await this.prisma.comment.findUnique({ where: { id: data.targetId } });
      if (comment) targetUserId = comment.userId;
    } else if (data.targetType === 'message') {
      const message = await this.prisma.message.findUnique({ where: { id: data.targetId } });
      if (message) targetUserId = message.senderId;
    }

    return this.prisma.report.create({
      data: {
        reporterId: userId,
        targetType: data.targetType,
        targetId: data.targetId,
        targetUserId,
        targetPostId,
        reason: data.reason,
        description: data.description,
      },
    });
  }

  async getPendingReports(neighborhoodId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: {
          status: 'pending',
          OR: [
            { targetPost: { neighborhoodId } },
            { targetUser: { memberships: { some: { neighborhoodId } } } },
          ],
        },
        include: {
          reporter: { select: { id: true, name: true, avatar: true } },
          targetUser: { select: { id: true, name: true, avatar: true } },
          targetPost: { select: { id: true, content: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where: { status: 'pending' } }),
    ]);

    return { data: reports, pagination: { page, limit, total, hasMore: skip + reports.length < total } };
  }

  async resolveReport(moderatorId: string, reportId: string, status: ReportStatus, resolution: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        moderatorId,
        resolution,
        resolvedAt: new Date(),
      },
    });
  }

  async getUserReports(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where: { reporterId: userId } }),
    ]);

    return { data: reports, pagination: { page, limit, total, hasMore: skip + reports.length < total } };
  }
}
