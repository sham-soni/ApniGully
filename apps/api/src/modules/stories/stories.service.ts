import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const STORY_DURATION_HOURS = 24;

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  async createStory(
    userId: string,
    data: {
      neighborhoodId: string;
      type: 'image' | 'video';
      mediaUrl: string;
      thumbnailUrl?: string;
      caption?: string;
      duration?: number;
    },
  ) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId: data.neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Must be a member');
    }

    const expiresAt = new Date(Date.now() + STORY_DURATION_HOURS * 60 * 60 * 1000);

    return this.prisma.story.create({
      data: {
        userId,
        neighborhoodId: data.neighborhoodId,
        type: data.type,
        mediaUrl: data.mediaUrl,
        thumbnailUrl: data.thumbnailUrl,
        caption: data.caption,
        duration: data.duration || (data.type === 'image' ? 5 : 15),
        expiresAt,
      },
    });
  }

  async getStoriesFeed(userId: string, neighborhoodId: string) {
    const now = new Date();

    // Get active stories from neighborhood members
    const stories = await this.prisma.story.findMany({
      where: {
        neighborhoodId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by user
    const userStories = new Map<string, any[]>();
    for (const story of stories) {
      if (!userStories.has(story.userId)) {
        userStories.set(story.userId, []);
      }
      userStories.get(story.userId)!.push(story);
    }

    // Get user details and view status
    const userIds = Array.from(userStories.keys());
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Get view status
    const storyIds = stories.map(s => s.id);
    const views = await this.prisma.storyView.findMany({
      where: { storyId: { in: storyIds }, userId },
      select: { storyId: true },
    });

    const viewedSet = new Set(views.map(v => v.storyId));

    // Build feed
    const feed = userIds.map(uid => {
      const userStoriesList = userStories.get(uid)!;
      const hasUnviewed = userStoriesList.some(s => !viewedSet.has(s.id));

      return {
        user: userMap.get(uid),
        stories: userStoriesList.map(s => ({
          ...s,
          isViewed: viewedSet.has(s.id),
        })),
        hasUnviewed,
        latestStoryAt: userStoriesList[0].createdAt,
      };
    });

    // Sort: users with unviewed stories first, then by latest story time
    feed.sort((a, b) => {
      if (a.hasUnviewed !== b.hasUnviewed) {
        return a.hasUnviewed ? -1 : 1;
      }
      return new Date(b.latestStoryAt).getTime() - new Date(a.latestStoryAt).getTime();
    });

    // Put current user's stories first if exists
    const myIndex = feed.findIndex(f => f.user?.id === userId);
    if (myIndex > 0) {
      const myStories = feed.splice(myIndex, 1)[0];
      feed.unshift(myStories);
    }

    return feed;
  }

  async getUserStories(viewerId: string, userId: string) {
    const now = new Date();

    const stories = await this.prisma.story.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get view status
    const storyIds = stories.map(s => s.id);
    const views = await this.prisma.storyView.findMany({
      where: { storyId: { in: storyIds }, userId: viewerId },
      select: { storyId: true },
    });

    const viewedSet = new Set(views.map(v => v.storyId));

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true },
    });

    return {
      user,
      stories: stories.map(s => ({
        ...s,
        isViewed: viewedSet.has(s.id),
      })),
    };
  }

  async getMyStories(userId: string) {
    const now = new Date();

    const stories = await this.prisma.story.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
      },
      include: {
        _count: { select: { views: true, replies: true, reactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories;
  }

  async getStory(viewerId: string, storyId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (new Date() > story.expiresAt && !story.isHighlight) {
      throw new NotFoundException('Story has expired');
    }

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: story.userId },
      select: { id: true, name: true, avatar: true },
    });

    // Check if viewed
    const view = await this.prisma.storyView.findUnique({
      where: { storyId_userId: { storyId, userId: viewerId } },
    });

    // Check if reacted
    const reaction = await this.prisma.storyReaction.findUnique({
      where: { storyId_userId: { storyId, userId: viewerId } },
    });

    return {
      ...story,
      user,
      isViewed: !!view,
      myReaction: reaction?.emoji || null,
      isOwner: story.userId === viewerId,
    };
  }

  async deleteStory(userId: string, storyId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.userId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }

    await this.prisma.story.delete({
      where: { id: storyId },
    });

    return { success: true };
  }

  async markViewed(userId: string, storyId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    // Don't count self views
    if (story.userId === userId) {
      return { success: true };
    }

    // Check if already viewed
    const existing = await this.prisma.storyView.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });

    if (!existing) {
      await this.prisma.storyView.create({
        data: { storyId, userId },
      });

      await this.prisma.story.update({
        where: { id: storyId },
        data: { viewCount: { increment: 1 } },
      });
    }

    return { success: true };
  }

  async getViewers(userId: string, storyId: string, page: number, limit: number) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.userId !== userId) {
      throw new ForbiddenException('You can only view viewers of your own stories');
    }

    const skip = (page - 1) * limit;

    const [views, total] = await Promise.all([
      this.prisma.storyView.findMany({
        where: { storyId },
        orderBy: { viewedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.storyView.count({ where: { storyId } }),
    ]);

    // Get user details
    const userIds = views.map(v => v.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Get reactions
    const reactions = await this.prisma.storyReaction.findMany({
      where: { storyId, userId: { in: userIds } },
    });

    const reactionMap = new Map(reactions.map(r => [r.userId, r.emoji]));

    return {
      data: views.map(v => ({
        ...v,
        user: userMap.get(v.userId),
        reaction: reactionMap.get(v.userId) || null,
      })),
      pagination: { page, limit, total, hasMore: skip + views.length < total },
    };
  }

  async reactToStory(userId: string, storyId: string, emoji: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const existing = await this.prisma.storyReaction.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // Remove reaction
        await this.prisma.storyReaction.delete({
          where: { id: existing.id },
        });
        return { reacted: false };
      } else {
        // Update reaction
        await this.prisma.storyReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
        return { reacted: true, emoji };
      }
    }

    await this.prisma.storyReaction.create({
      data: { storyId, userId, emoji },
    });

    // Notify story owner
    if (story.userId !== userId) {
      const reactor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await this.prisma.notification.create({
        data: {
          userId: story.userId,
          type: 'story_reaction',
          title: 'Story Reaction',
          body: `${reactor?.name} reacted ${emoji} to your story`,
          data: { storyId },
        },
      });
    }

    return { reacted: true, emoji };
  }

  async replyToStory(userId: string, storyId: string, content: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const reply = await this.prisma.storyReply.create({
      data: { storyId, userId, content },
    });

    await this.prisma.story.update({
      where: { id: storyId },
      data: { replyCount: { increment: 1 } },
    });

    // Notify story owner
    if (story.userId !== userId) {
      const replier = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await this.prisma.notification.create({
        data: {
          userId: story.userId,
          type: 'story_reply',
          title: 'Story Reply',
          body: `${replier?.name}: ${content.substring(0, 50)}...`,
          data: { storyId, replyId: reply.id },
        },
      });
    }

    return reply;
  }

  async getReplies(userId: string, storyId: string, page: number, limit: number) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.userId !== userId) {
      throw new ForbiddenException('You can only view replies to your own stories');
    }

    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.storyReply.findMany({
        where: { storyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.storyReply.count({ where: { storyId } }),
    ]);

    // Get user details
    const userIds = replies.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: replies.map(r => ({
        ...r,
        user: userMap.get(r.userId),
      })),
      pagination: { page, limit, total, hasMore: skip + replies.length < total },
    };
  }

  // Highlights
  async createHighlight(userId: string, data: { title: string; coverUrl?: string; storyIds: string[] }) {
    // Get max order
    const maxOrder = await this.prisma.storyHighlight.aggregate({
      where: { userId },
      _max: { order: true },
    });

    const highlight = await this.prisma.storyHighlight.create({
      data: {
        userId,
        title: data.title,
        coverUrl: data.coverUrl,
        storyIds: data.storyIds,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    // Mark stories as highlights
    await this.prisma.story.updateMany({
      where: { id: { in: data.storyIds } },
      data: { isHighlight: true },
    });

    return highlight;
  }

  async getMyHighlights(userId: string) {
    return this.prisma.storyHighlight.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async getUserHighlights(userId: string) {
    const highlights = await this.prisma.storyHighlight.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });

    // Get story counts
    const highlightsWithCounts = await Promise.all(
      highlights.map(async h => {
        const stories = await this.prisma.story.findMany({
          where: { id: { in: h.storyIds } },
          select: { id: true, thumbnailUrl: true, mediaUrl: true },
        });
        return {
          ...h,
          storyCount: stories.length,
          previewImages: stories.slice(0, 3).map(s => s.thumbnailUrl || s.mediaUrl),
        };
      }),
    );

    return highlightsWithCounts;
  }

  async updateHighlight(userId: string, highlightId: string, data: any) {
    const highlight = await this.prisma.storyHighlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    if (highlight.userId !== userId) {
      throw new ForbiddenException('You can only update your own highlights');
    }

    if (data.storyIds) {
      // Mark new stories as highlights
      await this.prisma.story.updateMany({
        where: { id: { in: data.storyIds } },
        data: { isHighlight: true },
      });
    }

    return this.prisma.storyHighlight.update({
      where: { id: highlightId },
      data,
    });
  }

  async deleteHighlight(userId: string, highlightId: string) {
    const highlight = await this.prisma.storyHighlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    if (highlight.userId !== userId) {
      throw new ForbiddenException('You can only delete your own highlights');
    }

    await this.prisma.storyHighlight.delete({
      where: { id: highlightId },
    });

    return { success: true };
  }

  async addToHighlight(userId: string, storyId: string, highlightId: string) {
    const [story, highlight] = await Promise.all([
      this.prisma.story.findUnique({ where: { id: storyId } }),
      this.prisma.storyHighlight.findUnique({ where: { id: highlightId } }),
    ]);

    if (!story || !highlight) {
      throw new NotFoundException('Story or highlight not found');
    }

    if (story.userId !== userId || highlight.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Add to highlight
    const storyIds = [...highlight.storyIds, storyId];

    await this.prisma.storyHighlight.update({
      where: { id: highlightId },
      data: { storyIds },
    });

    await this.prisma.story.update({
      where: { id: storyId },
      data: { isHighlight: true },
    });

    return { success: true };
  }

  // Cleanup expired stories (cron job)
  async cleanupExpiredStories() {
    const now = new Date();

    // Don't delete highlighted stories
    await this.prisma.story.deleteMany({
      where: {
        expiresAt: { lt: now },
        isHighlight: false,
      },
    });
  }
}
