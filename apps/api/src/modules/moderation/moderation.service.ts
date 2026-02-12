import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ModerationActionType } from '@prisma/client';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async takeAction(moderatorId: string, neighborhoodId: string, data: {
    targetType: 'post' | 'comment' | 'user';
    targetId: string;
    action: ModerationActionType;
    reason: string;
    duration?: number;
  }) {
    // Verify moderator
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId: moderatorId, neighborhoodId } },
    });

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
      throw new ForbiddenException('Not authorized');
    }

    let targetUserId: string | undefined;

    // Apply action based on type
    if (data.targetType === 'post') {
      const post = await this.prisma.post.findUnique({ where: { id: data.targetId } });
      if (!post) throw new NotFoundException('Post not found');
      targetUserId = post.userId;

      if (data.action === 'remove') {
        await this.prisma.post.update({ where: { id: data.targetId }, data: { isHidden: true } });
      } else if (data.action === 'restore') {
        await this.prisma.post.update({ where: { id: data.targetId }, data: { isHidden: false } });
      }
    } else if (data.targetType === 'comment') {
      const comment = await this.prisma.comment.findUnique({ where: { id: data.targetId } });
      if (!comment) throw new NotFoundException('Comment not found');
      targetUserId = comment.userId;

      if (data.action === 'remove') {
        await this.prisma.comment.update({ where: { id: data.targetId }, data: { isHidden: true } });
      }
    } else if (data.targetType === 'user') {
      const user = await this.prisma.user.findUnique({ where: { id: data.targetId } });
      if (!user) throw new NotFoundException('User not found');
      targetUserId = data.targetId;

      if (data.action === 'ban_temp') {
        await this.prisma.user.update({
          where: { id: data.targetId },
          data: {
            isBanned: true,
            banExpiresAt: new Date(Date.now() + (data.duration || 24) * 60 * 60 * 1000),
          },
        });
      } else if (data.action === 'ban_perm') {
        await this.prisma.user.update({
          where: { id: data.targetId },
          data: { isBanned: true, banExpiresAt: null },
        });
      } else if (data.action === 'restore') {
        await this.prisma.user.update({
          where: { id: data.targetId },
          data: { isBanned: false, banExpiresAt: null },
        });
      }
    }

    // Log action
    const action = await this.prisma.moderationAction.create({
      data: {
        moderatorId,
        targetType: data.targetType,
        targetId: data.targetId,
        targetUserId,
        action: data.action,
        reason: data.reason,
        duration: data.duration,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: moderatorId,
        action: `moderation_${data.action}`,
        targetType: data.targetType,
        targetId: data.targetId,
        metadata: { reason: data.reason, duration: data.duration },
      },
    });

    return action;
  }

  async getActions(neighborhoodId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [actions, total] = await Promise.all([
      this.prisma.moderationAction.findMany({
        include: {
          moderator: { select: { id: true, name: true, avatar: true } },
          targetUser: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moderationAction.count(),
    ]);

    return { data: actions, pagination: { page, limit, total, hasMore: skip + actions.length < total } };
  }

  async getAuditLogs(neighborhoodId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);

    return { data: logs, pagination: { page, limit, total, hasMore: skip + logs.length < total } };
  }
}
