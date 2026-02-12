import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostType, Visibility, ReactionType } from '@prisma/client';
import { getPostFingerprint, parseRentalPost, isRateLimited, RATE_LIMITS } from '@apnigully/shared';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    neighborhoodId: string,
    data: {
      type: PostType;
      title?: string;
      content: string;
      images?: string[];
      tags?: string[];
      visibility?: Visibility;
      targetGroupIds?: string[];
      latitude?: number;
      longitude?: number;
      approximateAddress?: string;
      isUrgent?: boolean;
      expiresAt?: Date;
      syncStatus?: string;
    },
  ) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: { userId, neighborhoodId },
      },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You must be a member to post');
    }

    // Rate limiting
    const recentPosts = await this.prisma.post.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - RATE_LIMITS.POSTS_PER_USER.windowMs) },
      },
      select: { createdAt: true },
    });

    if (recentPosts.length >= RATE_LIMITS.POSTS_PER_USER.max) {
      throw new BadRequestException('Post limit reached. Please try again later.');
    }

    // Duplicate detection
    const fingerprint = getPostFingerprint(data.content, data.type);
    const existingPost = await this.prisma.post.findFirst({
      where: {
        userId,
        fingerprint,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours
      },
    });

    if (existingPost) {
      throw new BadRequestException('Similar post already exists. Please wait before posting again.');
    }

    // Auto-parse rental data if applicable
    let parsedData = {};
    if (data.type === 'rental') {
      parsedData = parseRentalPost(data.content);
    }

    // Create post
    const post = await this.prisma.post.create({
      data: {
        userId,
        neighborhoodId,
        type: data.type,
        title: data.title,
        content: data.content,
        images: data.images || [],
        tags: data.tags || [],
        visibility: data.visibility || 'neighborhood',
        latitude: data.latitude,
        longitude: data.longitude,
        approximateAddress: data.approximateAddress,
        isUrgent: data.isUrgent || false,
        expiresAt: data.expiresAt,
        fingerprint,
        syncStatus: data.syncStatus || 'synced',
        targetGroups: data.targetGroupIds
          ? { connect: data.targetGroupIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, isVerified: true, trustScore: true },
        },
        neighborhood: { select: { name: true } },
        targetGroups: { select: { id: true, name: true } },
      },
    });

    return { ...post, parsedData };
  }

  async findById(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, isVerified: true, trustScore: true },
        },
        neighborhood: { select: { id: true, name: true } },
        comments: {
          where: { isHidden: false, parentId: null },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            replies: {
              where: { isHidden: false },
              include: {
                user: { select: { id: true, name: true, avatar: true } },
              },
              take: 3,
            },
            _count: { select: { replies: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reactions: { select: { userId: true, type: true } },
        rentalListing: true,
        _count: { select: { comments: true, reactions: true } },
      },
    });

    if (!post || post.isHidden) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count
    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Check if user has saved this post
    let isSaved = false;
    let userReaction = null;
    if (userId) {
      const [savedPost, reaction] = await Promise.all([
        this.prisma.savedPost.findUnique({
          where: { userId_postId: { userId, postId: id } },
        }),
        this.prisma.reaction.findUnique({
          where: { postId_userId: { postId: id, userId } },
        }),
      ]);
      isSaved = !!savedPost;
      userReaction = reaction?.type;
    }

    return { ...post, isSaved, userReaction };
  }

  async getFeed(
    userId: string,
    neighborhoodId: string,
    filters: {
      type?: PostType[];
      tags?: string[];
      buildingId?: string;
      groupId?: string;
      isUrgent?: boolean;
      sortBy?: 'recent' | 'nearby' | 'trending';
      page?: number;
      limit?: number;
    },
  ) {
    const { type, tags, buildingId, groupId, isUrgent, sortBy = 'recent', page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      neighborhoodId,
      isHidden: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (type && type.length > 0) {
      where.type = { in: type };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (isUrgent !== undefined) {
      where.isUrgent = isUrgent;
    }

    // Visibility filtering
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
    });

    if (buildingId) {
      where.OR = [
        { visibility: 'neighborhood' },
        { visibility: 'building', user: { memberships: { some: { buildingId } } } },
      ];
    }

    if (groupId) {
      where.targetGroups = { some: { id: groupId } };
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'trending') {
      orderBy = [{ reactionCount: 'desc' }, { commentCount: 'desc' }, { createdAt: 'desc' }];
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true, isVerified: true, trustScore: true },
          },
          _count: { select: { comments: true, reactions: true } },
          reactions: {
            where: { userId },
            select: { type: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    // Check saved status
    const postIds = posts.map((p) => p.id);
    const savedPosts = await this.prisma.savedPost.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    const savedSet = new Set(savedPosts.map((s) => s.postId));

    const postsWithMeta = posts.map((post) => ({
      ...post,
      isSaved: savedSet.has(post.id),
      userReaction: post.reactions[0]?.type || null,
    }));

    return {
      data: postsWithMeta,
      pagination: { page, limit, total, hasMore: skip + posts.length < total },
    };
  }

  async update(userId: string, postId: string, data: Partial<{
    title: string;
    content: string;
    images: string[];
    tags: string[];
    isUrgent: boolean;
  }>) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(userId: string, postId: string, isModerator: boolean = false) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId && !isModerator) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete
    return this.prisma.post.update({
      where: { id: postId },
      data: { isHidden: true },
    });
  }

  async addComment(userId: string, postId: string, content: string, parentId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, neighborhoodId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: { userId, neighborhoodId: post.neighborhoodId },
      },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You must be a member to comment');
    }

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.postId !== postId) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        userId,
        content,
        parentId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update comment count
    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  async deleteComment(userId: string, commentId: string, isModerator: boolean = false) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { id: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId && !isModerator) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { isHidden: true },
    });

    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async addReaction(userId: string, postId: string, type: ReactionType) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, neighborhoodId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingReaction = await this.prisma.reaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Remove reaction
        await this.prisma.reaction.delete({ where: { id: existingReaction.id } });
        await this.prisma.post.update({
          where: { id: postId },
          data: { reactionCount: { decrement: 1 } },
        });
        return { action: 'removed', type: null };
      } else {
        // Update reaction
        await this.prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
        return { action: 'updated', type };
      }
    }

    // Add reaction
    await this.prisma.reaction.create({
      data: { postId, userId, type },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { reactionCount: { increment: 1 } },
    });

    return { action: 'added', type };
  }

  async savePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.savedPost.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await this.prisma.savedPost.create({
      data: { userId, postId },
    });

    return { saved: true };
  }

  async getComments(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, isHidden: false, parentId: null },
        include: {
          user: { select: { id: true, name: true, avatar: true, isVerified: true } },
          replies: {
            where: { isHidden: false },
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({ where: { postId, isHidden: false, parentId: null } }),
    ]);

    return {
      data: comments,
      pagination: { page, limit, total, hasMore: skip + comments.length < total },
    };
  }

  async syncOfflinePosts(userId: string, posts: any[]) {
    const results = [];

    for (const postData of posts) {
      try {
        const post = await this.create(userId, postData.neighborhoodId, {
          ...postData,
          syncStatus: 'synced',
        });
        results.push({ localId: postData.localId, serverId: post.id, status: 'synced' });
      } catch (error) {
        results.push({
          localId: postData.localId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return results;
  }
}
