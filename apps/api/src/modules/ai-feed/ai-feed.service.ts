import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostType } from '@prisma/client';

// Scoring weights for AI feed ranking
const SCORE_WEIGHTS = {
  // Engagement signals
  VIEW_TIME: 0.1,
  CLICK: 0.3,
  REACT: 0.5,
  COMMENT: 0.8,
  SHARE: 1.0,
  SAVE: 0.7,

  // Content factors
  RECENCY: 0.3,
  RELEVANCE: 0.4,
  TRUST_SCORE: 0.15,
  ENGAGEMENT_RATE: 0.15,

  // Decay factors
  TIME_DECAY_HOURS: 24,
  ENGAGEMENT_DECAY_HOURS: 48,
};

const POST_TYPE_WEIGHTS: Record<PostType, number> = {
  safety_alert: 1.5,
  announcement: 1.2,
  request: 1.0,
  recommendation: 1.0,
  rental: 0.9,
  helper_listing: 0.9,
  buy_sell: 0.8,
};

@Injectable()
export class AIFeedService {
  constructor(private prisma: PrismaService) {}

  async getPersonalizedFeed(userId: string, neighborhoodId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Get user interests
    const interests = await this.getUserInterests(userId);

    // Get posts with scoring data
    const posts = await this.prisma.post.findMany({
      where: {
        neighborhoodId,
        isHidden: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
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
      orderBy: { createdAt: 'desc' },
      take: 100, // Get more than needed for re-ranking
    });

    // Calculate personalized scores
    const scoredPosts = await Promise.all(
      posts.map(async (post) => {
        const score = await this.calculatePostScore(post, userId, interests);
        return { ...post, aiScore: score };
      })
    );

    // Sort by score
    scoredPosts.sort((a, b) => b.aiScore - a.aiScore);

    // Diversify feed (avoid same author, same type clustering)
    const diversifiedPosts = this.diversifyFeed(scoredPosts);

    // Paginate
    const paginatedPosts = diversifiedPosts.slice(skip, skip + limit);

    // Get saved status
    const postIds = paginatedPosts.map(p => p.id);
    const savedPosts = await this.prisma.savedPost.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    const savedSet = new Set(savedPosts.map(s => s.postId));

    const postsWithMeta = paginatedPosts.map(post => ({
      ...post,
      isSaved: savedSet.has(post.id),
      userReaction: post.reactions[0]?.type || null,
    }));

    return {
      data: postsWithMeta,
      pagination: {
        page,
        limit,
        total: diversifiedPosts.length,
        hasMore: skip + paginatedPosts.length < diversifiedPosts.length,
      },
    };
  }

  private async calculatePostScore(
    post: any,
    userId: string,
    interests: any[],
  ): Promise<number> {
    let score = 0;

    // 1. Recency score (exponential decay)
    const hoursOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.exp(-hoursOld / SCORE_WEIGHTS.TIME_DECAY_HOURS);
    score += recencyScore * SCORE_WEIGHTS.RECENCY * 100;

    // 2. Post type weight
    const typeWeight = POST_TYPE_WEIGHTS[post.type] || 1.0;
    score *= typeWeight;

    // 3. Urgent posts get boost
    if (post.isUrgent) {
      score *= 1.5;
    }

    // 4. Trust score boost
    const trustBoost = (post.user.trustScore || 50) / 100;
    score *= (1 + trustBoost * SCORE_WEIGHTS.TRUST_SCORE);

    // 5. Engagement rate
    const engagementRate = post.viewCount > 0
      ? (post._count.reactions + post._count.comments * 2) / post.viewCount
      : 0;
    score += engagementRate * SCORE_WEIGHTS.ENGAGEMENT_RATE * 50;

    // 6. Interest relevance
    const interestScore = this.calculateInterestMatch(post, interests);
    score += interestScore * SCORE_WEIGHTS.RELEVANCE * 100;

    // 7. User engagement history with this author
    const authorEngagement = await this.getAuthorEngagementScore(userId, post.userId);
    score *= (1 + authorEngagement * 0.2);

    // 8. Penalize if user has seen similar content recently
    const similarityPenalty = await this.getSimilarContentPenalty(userId, post);
    score *= (1 - similarityPenalty * 0.3);

    return score;
  }

  private calculateInterestMatch(post: any, interests: any[]): number {
    let matchScore = 0;

    for (const interest of interests) {
      // Match by post type
      if (interest.category === 'post_type' && interest.value === post.type) {
        matchScore += interest.score * 0.3;
      }

      // Match by tags
      if (interest.category === 'tag' && post.tags.includes(interest.value)) {
        matchScore += interest.score * 0.4;
      }

      // Match by content keywords (simple keyword matching)
      if (interest.category === 'topic') {
        const content = (post.title || '') + ' ' + post.content;
        if (content.toLowerCase().includes(interest.value.toLowerCase())) {
          matchScore += interest.score * 0.3;
        }
      }
    }

    return Math.min(matchScore, 1); // Cap at 1
  }

  private async getAuthorEngagementScore(userId: string, authorId: string): Promise<number> {
    // Check past interactions with this author's posts
    const interactions = await this.prisma.userEngagement.count({
      where: {
        userId,
        action: { in: ['react', 'comment', 'save'] },
      },
    });

    return Math.min(interactions / 10, 1); // Cap at 1 after 10 interactions
  }

  private async getSimilarContentPenalty(userId: string, post: any): Promise<number> {
    // Check if user has seen similar posts recently
    const recentViews = await this.prisma.userEngagement.findMany({
      where: {
        userId,
        action: 'view',
        postType: post.type,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: 10,
    });

    return Math.min(recentViews.length / 10, 0.5); // Cap penalty at 50%
  }

  private diversifyFeed(posts: any[]): any[] {
    const diversified: any[] = [];
    const authorWindow = 3; // Minimum posts between same author
    const typeWindow = 2;   // Minimum posts between same type
    const recentAuthors: string[] = [];
    const recentTypes: string[] = [];

    const remaining = [...posts];

    while (remaining.length > 0 && diversified.length < posts.length) {
      let foundPost = false;

      for (let i = 0; i < remaining.length; i++) {
        const post = remaining[i];
        const authorIndex = recentAuthors.indexOf(post.userId);
        const typeIndex = recentTypes.indexOf(post.type);

        // Check if this post would violate diversity rules
        const authorOk = authorIndex === -1 || authorIndex >= authorWindow;
        const typeOk = typeIndex === -1 || typeIndex >= typeWindow;

        if (authorOk && typeOk) {
          diversified.push(post);
          remaining.splice(i, 1);

          // Update tracking
          recentAuthors.unshift(post.userId);
          recentTypes.unshift(post.type);
          if (recentAuthors.length > authorWindow) recentAuthors.pop();
          if (recentTypes.length > typeWindow) recentTypes.pop();

          foundPost = true;
          break;
        }
      }

      // If no suitable post found, just take the top remaining
      if (!foundPost && remaining.length > 0) {
        diversified.push(remaining.shift()!);
      }
    }

    return diversified;
  }

  async getTrendingPosts(neighborhoodId: string, timeframe: '1h' | '24h' | '7d', limit: number) {
    const timeMap = { '1h': 1, '24h': 24, '7d': 168 };
    const hours = timeMap[timeframe];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: {
        neighborhoodId,
        isHidden: false,
        createdAt: { gte: since },
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, isVerified: true, trustScore: true },
        },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    // Calculate trending score
    const scored = posts.map(post => {
      const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const engagementScore = post._count.reactions + post._count.comments * 2;
      const trendingScore = engagementScore / Math.pow(ageHours + 2, 1.5); // Gravity algorithm
      return { ...post, trendingScore };
    });

    scored.sort((a, b) => b.trendingScore - a.trendingScore);

    return scored.slice(0, limit);
  }

  async trackEngagement(
    userId: string,
    postId: string,
    action: string,
    metadata?: { duration?: number; scrollDepth?: number },
  ) {
    // Get post details
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { type: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Create engagement record
    await this.prisma.userEngagement.create({
      data: {
        userId,
        postId,
        postType: post.type,
        action,
        duration: metadata?.duration,
        scrollDepth: metadata?.scrollDepth,
      },
    });

    // Update user interests based on engagement
    await this.updateInterestsFromEngagement(userId, post.type, action);

    return { success: true };
  }

  private async updateInterestsFromEngagement(userId: string, postType: PostType, action: string) {
    const actionWeights: Record<string, number> = {
      view: 0.1,
      click: 0.2,
      react: 0.5,
      comment: 0.8,
      save: 0.7,
      share: 1.0,
      hide: -0.5,
    };

    const weight = actionWeights[action] || 0;
    if (weight === 0) return;

    // Update post type interest
    await this.prisma.userInterest.upsert({
      where: {
        userId_category_value: {
          userId,
          category: 'post_type',
          value: postType,
        },
      },
      update: {
        score: { increment: weight * 0.1 },
        interactionCount: { increment: 1 },
        lastInteraction: new Date(),
      },
      create: {
        userId,
        category: 'post_type',
        value: postType,
        score: weight * 0.1,
        interactionCount: 1,
      },
    });
  }

  async hidePost(userId: string, postId: string, reason?: string) {
    await this.trackEngagement(userId, postId, 'hide');

    // Add to user's hidden posts (could be stored in user settings)
    return { success: true, message: 'Post hidden. We\'ll show you less like this.' };
  }

  async getUserInterests(userId: string) {
    return this.prisma.userInterest.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
      take: 20,
    });
  }

  async updateUserInterests(
    userId: string,
    interests: Array<{ category: string; value: string; score: number }>,
  ) {
    for (const interest of interests) {
      await this.prisma.userInterest.upsert({
        where: {
          userId_category_value: {
            userId,
            category: interest.category,
            value: interest.value,
          },
        },
        update: { score: interest.score },
        create: {
          userId,
          category: interest.category,
          value: interest.value,
          score: interest.score,
        },
      });
    }

    return { success: true };
  }

  async getRecommendations(
    userId: string,
    neighborhoodId: string,
    type: 'posts' | 'helpers' | 'shops' | 'events',
    limit: number,
  ) {
    const interests = await this.getUserInterests(userId);

    switch (type) {
      case 'posts':
        return this.getPostRecommendations(userId, neighborhoodId, interests, limit);
      case 'helpers':
        return this.getHelperRecommendations(userId, neighborhoodId, interests, limit);
      case 'shops':
        return this.getShopRecommendations(userId, neighborhoodId, interests, limit);
      case 'events':
        return this.getEventRecommendations(userId, neighborhoodId, limit);
      default:
        return [];
    }
  }

  private async getPostRecommendations(userId: string, neighborhoodId: string, interests: any[], limit: number) {
    // Get posts the user hasn't seen
    const viewedPostIds = (await this.prisma.userEngagement.findMany({
      where: { userId, action: 'view' },
      select: { postId: true },
      distinct: ['postId'],
    })).map(e => e.postId).filter(Boolean) as string[];

    const posts = await this.prisma.post.findMany({
      where: {
        neighborhoodId,
        isHidden: false,
        id: { notIn: viewedPostIds },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 3,
    });

    // Score by interest match
    const scored = posts.map(post => {
      const interestScore = this.calculateInterestMatch(post, interests);
      return { ...post, relevanceScore: interestScore };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scored.slice(0, limit).map(post => ({
      ...post,
      reason: 'Based on your interests',
    }));
  }

  private async getHelperRecommendations(userId: string, neighborhoodId: string, interests: any[], limit: number) {
    const helpers = await this.prisma.helperProfile.findMany({
      where: {
        neighborhoodId,
        isActive: true,
        userId: { not: userId },
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, trustScore: true },
        },
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });

    return helpers.map(helper => ({
      ...helper,
      reason: helper.rating >= 4 ? 'Highly rated' : 'New in your area',
    }));
  }

  private async getShopRecommendations(userId: string, neighborhoodId: string, interests: any[], limit: number) {
    const shops = await this.prisma.shop.findMany({
      where: {
        neighborhoodId,
        userId: { not: userId },
      },
      include: {
        offers: {
          where: {
            isActive: true,
            validUntil: { gte: new Date() },
          },
          take: 1,
        },
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });

    return shops.map(shop => ({
      ...shop,
      reason: shop.offers.length > 0 ? 'Has active offers' : 'Popular in your area',
    }));
  }

  private async getEventRecommendations(userId: string, neighborhoodId: string, limit: number) {
    const events = await this.prisma.event.findMany({
      where: {
        post: { neighborhoodId },
        startsAt: { gte: new Date() },
      },
      include: {
        post: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { startsAt: 'asc' },
      take: limit,
    });

    return events.map(event => ({
      ...event,
      reason: 'Upcoming in your neighborhood',
    }));
  }

  async getDailyDigest(userId: string, neighborhoodId: string) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get highlights from the last 24 hours
    const [trendingPosts, newHelpers, newEvents, safetyAlerts] = await Promise.all([
      this.getTrendingPosts(neighborhoodId, '24h', 5),
      this.prisma.helperProfile.count({
        where: { neighborhoodId, createdAt: { gte: yesterday } },
      }),
      this.prisma.event.findMany({
        where: {
          post: { neighborhoodId },
          startsAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
        include: { post: true },
        take: 3,
      }),
      this.prisma.sOSAlert.findMany({
        where: {
          neighborhoodId,
          createdAt: { gte: yesterday },
          status: { in: ['resolved', 'false_alarm'] },
        },
        take: 3,
      }),
    ]);

    // Get personalized recommendations
    const recommendations = await this.getRecommendations(userId, neighborhoodId, 'posts', 3);

    return {
      generatedAt: new Date(),
      summary: {
        trendingPostsCount: trendingPosts.length,
        newHelpersCount: newHelpers,
        upcomingEventsCount: newEvents.length,
        safetyAlertsCount: safetyAlerts.length,
      },
      trending: trendingPosts,
      upcomingEvents: newEvents,
      recommendations,
      safetyAlerts,
    };
  }

  async getSimilarPosts(postId: string, limit: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { type: true, tags: true, neighborhoodId: true, content: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Find posts with matching type and tags
    const similar = await this.prisma.post.findMany({
      where: {
        neighborhoodId: post.neighborhoodId,
        id: { not: postId },
        isHidden: false,
        OR: [
          { type: post.type },
          { tags: { hasSome: post.tags } },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
    });

    // Score by similarity
    const scored = similar.map(p => {
      let score = 0;
      if (p.type === post.type) score += 2;
      const tagOverlap = p.tags.filter(t => post.tags.includes(t)).length;
      score += tagOverlap;
      return { ...p, similarityScore: score };
    });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);

    return scored.slice(0, limit);
  }
}
