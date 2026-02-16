import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CirclePrivacy } from '@prisma/client';

const CIRCLE_CATEGORIES = [
  { id: 'fitness', name: 'Fitness & Wellness', icon: '🏃' },
  { id: 'parenting', name: 'Parenting', icon: '👶' },
  { id: 'pets', name: 'Pets & Animals', icon: '🐕' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'reading', name: 'Books & Reading', icon: '📚' },
  { id: 'cooking', name: 'Cooking & Food', icon: '👨‍🍳' },
  { id: 'gardening', name: 'Gardening', icon: '🌱' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'art', name: 'Art & Crafts', icon: '🎨' },
  { id: 'tech', name: 'Technology', icon: '💻' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'movies', name: 'Movies & TV', icon: '🎬' },
  { id: 'photography', name: 'Photography', icon: '📷' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'other', name: 'Other', icon: '💡' },
];

@Injectable()
export class CirclesService {
  constructor(private prisma: PrismaService) {}

  getCategories() {
    return CIRCLE_CATEGORIES;
  }

  async createCircle(
    userId: string,
    data: {
      neighborhoodId: string;
      name: string;
      description?: string;
      category: string;
      icon?: string;
      coverImage?: string;
      privacy?: 'public' | 'private' | 'invite_only';
    },
  ) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId: data.neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You must be a member of this neighborhood');
    }

    // Create circle
    const circle = await this.prisma.interestCircle.create({
      data: {
        neighborhoodId: data.neighborhoodId,
        name: data.name,
        description: data.description,
        category: data.category,
        icon: data.icon || CIRCLE_CATEGORIES.find(c => c.id === data.category)?.icon,
        coverImage: data.coverImage,
        privacy: (data.privacy || 'public') as CirclePrivacy,
        createdById: userId,
        memberCount: 1,
      },
    });

    // Add creator as admin
    await this.prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId,
        role: 'admin',
      },
    });

    return circle;
  }

  async getCircles(userId: string, neighborhoodId: string, category: string | undefined, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where: any = {
      neighborhoodId,
      isActive: true,
      OR: [
        { privacy: 'public' },
        { members: { some: { userId } } },
      ],
    };

    if (category) {
      where.category = category;
    }

    const [circles, total] = await Promise.all([
      this.prisma.interestCircle.findMany({
        where,
        orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.interestCircle.count({ where }),
    ]);

    // Check membership status
    const circleIds = circles.map(c => c.id);
    const memberships = await this.prisma.circleMember.findMany({
      where: { circleId: { in: circleIds }, userId },
    });

    const membershipMap = new Map(memberships.map(m => [m.circleId, m]));

    return {
      data: circles.map(circle => ({
        ...circle,
        isMember: membershipMap.has(circle.id),
        membership: membershipMap.get(circle.id),
      })),
      pagination: { page, limit, total, hasMore: skip + circles.length < total },
    };
  }

  async getMyCircles(userId: string) {
    const memberships = await this.prisma.circleMember.findMany({
      where: { userId },
      include: { circle: true },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => ({
      ...m.circle,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async discoverCircles(userId: string, neighborhoodId: string) {
    // Get circles user is not part of
    const myCircleIds = (await this.prisma.circleMember.findMany({
      where: { userId },
      select: { circleId: true },
    })).map(m => m.circleId);

    const circles = await this.prisma.interestCircle.findMany({
      where: {
        neighborhoodId,
        isActive: true,
        privacy: 'public',
        id: { notIn: myCircleIds },
      },
      orderBy: [{ memberCount: 'desc' }, { postCount: 'desc' }],
      take: 10,
    });

    return circles.map(circle => ({
      ...circle,
      reason: circle.memberCount > 10 ? 'Popular in your area' : 'New circle',
    }));
  }

  async getCircle(userId: string, circleId: string) {
    const circle = await this.prisma.interestCircle.findUnique({
      where: { id: circleId },
    });

    if (!circle || !circle.isActive) {
      throw new NotFoundException('Circle not found');
    }

    // Check access
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (circle.privacy !== 'public' && !membership) {
      throw new ForbiddenException('This is a private circle');
    }

    // Get recent posts
    const recentPosts = await this.prisma.circlePost.findMany({
      where: { circleId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    // Get creator info
    const creator = await this.prisma.user.findUnique({
      where: { id: circle.createdById },
      select: { id: true, name: true, avatar: true },
    });

    return {
      ...circle,
      isMember: !!membership,
      membership,
      creator,
      recentPosts,
    };
  }

  async updateCircle(userId: string, circleId: string, data: any) {
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only admins can update circle');
    }

    return this.prisma.interestCircle.update({
      where: { id: circleId },
      data,
    });
  }

  async deleteCircle(userId: string, circleId: string) {
    const circle = await this.prisma.interestCircle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    if (circle.createdById !== userId) {
      throw new ForbiddenException('Only the creator can delete the circle');
    }

    // Soft delete
    await this.prisma.interestCircle.update({
      where: { id: circleId },
      data: { isActive: false },
    });

    return { success: true };
  }

  async joinCircle(userId: string, circleId: string) {
    const circle = await this.prisma.interestCircle.findUnique({
      where: { id: circleId },
    });

    if (!circle || !circle.isActive) {
      throw new NotFoundException('Circle not found');
    }

    if (circle.privacy === 'invite_only') {
      throw new ForbiddenException('This circle is invite-only');
    }

    // Check if already member
    const existing = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (existing) {
      throw new BadRequestException('Already a member');
    }

    // Add member
    const member = await this.prisma.circleMember.create({
      data: {
        circleId,
        userId,
        role: 'member',
      },
    });

    // Update count
    await this.prisma.interestCircle.update({
      where: { id: circleId },
      data: { memberCount: { increment: 1 } },
    });

    return member;
  }

  async leaveCircle(userId: string, circleId: string) {
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!membership) {
      throw new BadRequestException('Not a member');
    }

    const circle = await this.prisma.interestCircle.findUnique({
      where: { id: circleId },
    });

    if (circle?.createdById === userId) {
      throw new BadRequestException('Creator cannot leave. Delete the circle instead.');
    }

    await this.prisma.circleMember.delete({
      where: { id: membership.id },
    });

    await this.prisma.interestCircle.update({
      where: { id: circleId },
      data: { memberCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async getMembers(circleId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.prisma.circleMember.findMany({
        where: { circleId },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.circleMember.count({ where: { circleId } }),
    ]);

    // Get user details
    const userIds = members.map(m => m.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, isVerified: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: members.map(m => ({
        ...m,
        user: userMap.get(m.userId),
      })),
      pagination: { page, limit, total, hasMore: skip + members.length < total },
    };
  }

  async updateMemberRole(adminUserId: string, circleId: string, userId: string, role: string) {
    const adminMembership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId: adminUserId } },
    });

    if (!adminMembership || adminMembership.role !== 'admin') {
      throw new ForbiddenException('Only admins can change roles');
    }

    return this.prisma.circleMember.update({
      where: { circleId_userId: { circleId, userId } },
      data: { role },
    });
  }

  async removeMember(adminUserId: string, circleId: string, userId: string) {
    const adminMembership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId: adminUserId } },
    });

    if (!adminMembership || !['admin', 'moderator'].includes(adminMembership.role)) {
      throw new ForbiddenException('Only admins and moderators can remove members');
    }

    const circle = await this.prisma.interestCircle.findUnique({
      where: { id: circleId },
    });

    if (circle?.createdById === userId) {
      throw new BadRequestException('Cannot remove the circle creator');
    }

    await this.prisma.circleMember.delete({
      where: { circleId_userId: { circleId, userId } },
    });

    await this.prisma.interestCircle.update({
      where: { id: circleId },
      data: { memberCount: { decrement: 1 } },
    });

    return { success: true };
  }

  // Posts
  async createPost(userId: string, circleId: string, data: { content: string; images?: string[] }) {
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member to post');
    }

    const post = await this.prisma.circlePost.create({
      data: {
        circleId,
        userId,
        content: data.content,
        images: data.images || [],
      },
    });

    await this.prisma.interestCircle.update({
      where: { id: circleId },
      data: { postCount: { increment: 1 } },
    });

    return post;
  }

  async getPosts(userId: string, circleId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.circlePost.findMany({
        where: { circleId },
        include: {
          _count: { select: { comments: true, likes: true } },
          likes: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.circlePost.count({ where: { circleId } }),
    ]);

    // Get user details
    const userIds = posts.map(p => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: posts.map(p => ({
        ...p,
        user: userMap.get(p.userId),
        isLiked: p.likes.length > 0,
      })),
      pagination: { page, limit, total, hasMore: skip + posts.length < total },
    };
  }

  async updatePost(userId: string, postId: string, data: { content: string; images?: string[] }) {
    const post = await this.prisma.circlePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.prisma.circlePost.update({
      where: { id: postId },
      data: {
        content: data.content,
        images: data.images,
      },
    });
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.circlePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is post owner or circle admin
    const isOwner = post.userId === userId;
    const isAdmin = await this.prisma.circleMember.findFirst({
      where: {
        circleId: post.circleId,
        userId,
        role: { in: ['admin', 'moderator'] },
      },
    });

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this post');
    }

    await this.prisma.circlePost.delete({
      where: { id: postId },
    });

    await this.prisma.interestCircle.update({
      where: { id: post.circleId },
      data: { postCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async toggleLike(userId: string, postId: string) {
    const existing = await this.prisma.circleLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.circleLike.delete({
        where: { id: existing.id },
      });

      await this.prisma.circlePost.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });

      return { liked: false };
    }

    await this.prisma.circleLike.create({
      data: { postId, userId },
    });

    await this.prisma.circlePost.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    });

    return { liked: true };
  }

  async togglePin(userId: string, postId: string) {
    const post = await this.prisma.circlePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isAdmin = await this.prisma.circleMember.findFirst({
      where: {
        circleId: post.circleId,
        userId,
        role: { in: ['admin', 'moderator'] },
      },
    });

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can pin posts');
    }

    const updated = await this.prisma.circlePost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });

    return { pinned: updated.isPinned };
  }

  async addComment(userId: string, postId: string, data: { content: string; parentId?: string }) {
    const post = await this.prisma.circlePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check membership
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: post.circleId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member to comment');
    }

    const comment = await this.prisma.circleComment.create({
      data: {
        postId,
        userId,
        content: data.content,
        parentId: data.parentId,
      },
    });

    await this.prisma.circlePost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  async getComments(postId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.circleComment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.circleComment.count({ where: { postId, parentId: null } }),
    ]);

    // Get replies
    const commentIds = comments.map(c => c.id);
    const replies = await this.prisma.circleComment.findMany({
      where: { parentId: { in: commentIds } },
      orderBy: { createdAt: 'asc' },
    });

    // Get user details
    const userIds = [...comments, ...replies].map(c => c.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const repliesMap = new Map<string, any[]>();
    replies.forEach(r => {
      if (!repliesMap.has(r.parentId!)) {
        repliesMap.set(r.parentId!, []);
      }
      repliesMap.get(r.parentId!)!.push({
        ...r,
        user: userMap.get(r.userId),
      });
    });

    return {
      data: comments.map(c => ({
        ...c,
        user: userMap.get(c.userId),
        replies: repliesMap.get(c.id) || [],
      })),
      pagination: { page, limit, total, hasMore: skip + comments.length < total },
    };
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.circleComment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isOwner = comment.userId === userId;
    const isAdmin = await this.prisma.circleMember.findFirst({
      where: {
        circleId: comment.post.circleId,
        userId,
        role: { in: ['admin', 'moderator'] },
      },
    });

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this comment');
    }

    await this.prisma.circleComment.delete({
      where: { id: commentId },
    });

    await this.prisma.circlePost.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async createEvent(userId: string, circleId: string, data: any) {
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
      throw new ForbiddenException('Only admins can create events');
    }

    return this.prisma.circleEvent.create({
      data: {
        circleId,
        title: data.title,
        description: data.description,
        location: data.location,
        isOnline: data.isOnline || false,
        onlineLink: data.onlineLink,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        maxAttendees: data.maxAttendees,
        createdById: userId,
      },
    });
  }

  async getEvents(circleId: string, upcoming: boolean) {
    const where: any = { circleId };
    if (upcoming) {
      where.startsAt = { gte: new Date() };
    }

    return this.prisma.circleEvent.findMany({
      where,
      orderBy: { startsAt: upcoming ? 'asc' : 'desc' },
    });
  }
}
