import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserLevel } from '@prisma/client';

// Level thresholds
const LEVEL_THRESHOLDS: Record<UserLevel, number> = {
  newcomer: 0,
  resident: 100,
  neighbor: 500,
  pillar: 1500,
  guardian: 5000,
  legend: 15000,
};

// Karma rewards for actions
const KARMA_REWARDS = {
  POST_CREATE: 5,
  POST_HELPFUL: 2,
  COMMENT_CREATE: 2,
  COMMENT_HELPFUL: 1,
  EVENT_ATTEND: 10,
  POLL_VOTE: 1,
  DAILY_CHECKIN: 3,
  STREAK_BONUS_7: 20,
  STREAK_BONUS_30: 100,
  REFERRAL: 50,
  BADGE_UNLOCK: 25,
  SOS_RESPOND: 30,
  ENDORSEMENT_GIVEN: 5,
  ENDORSEMENT_RECEIVED: 10,
};

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.userGamification.findUnique({
      where: { userId },
      include: {
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
      },
    });

    if (!profile) {
      profile = await this.prisma.userGamification.create({
        data: { userId },
        include: {
          badges: {
            include: { badge: true },
          },
        },
      });
    }

    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    const levelProgress = this.calculateLevelProgress(profile.totalKarmaEarned);

    return {
      ...profile,
      levelProgress,
      nextLevel: this.getNextLevel(profile.level),
      karmaToNextLevel: levelProgress.karmaToNextLevel,
    };
  }

  private calculateLevelProgress(totalKarma: number) {
    const levels = Object.entries(LEVEL_THRESHOLDS).sort((a, b) => a[1] - b[1]);
    let currentLevel: UserLevel = 'newcomer';
    let currentThreshold = 0;
    let nextThreshold = 100;

    for (let i = 0; i < levels.length; i++) {
      const [level, threshold] = levels[i];
      if (totalKarma >= threshold) {
        currentLevel = level as UserLevel;
        currentThreshold = threshold;
        nextThreshold = levels[i + 1]?.[1] || threshold;
      }
    }

    const progress = nextThreshold > currentThreshold
      ? ((totalKarma - currentThreshold) / (nextThreshold - currentThreshold)) * 100
      : 100;

    return {
      currentLevel,
      currentThreshold,
      nextThreshold,
      progress: Math.min(progress, 100),
      karmaToNextLevel: Math.max(0, nextThreshold - totalKarma),
    };
  }

  private getNextLevel(currentLevel: UserLevel): UserLevel | null {
    const levels: UserLevel[] = ['newcomer', 'resident', 'neighbor', 'pillar', 'guardian', 'legend'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  async addKarma(
    userId: string,
    amount: number,
    reason: string,
    sourceType?: string,
    sourceId?: string,
  ) {
    const profile = await this.getOrCreateProfile(userId);

    // Create transaction
    await this.prisma.karmaTransaction.create({
      data: {
        userId,
        amount,
        reason,
        sourceType,
        sourceId,
      },
    });

    // Update profile
    const newTotal = profile.totalKarmaEarned + amount;
    const newBalance = Math.max(0, profile.karmaPoints + amount);
    const newLevel = this.determineLevel(newTotal);

    const updated = await this.prisma.userGamification.update({
      where: { userId },
      data: {
        karmaPoints: newBalance,
        totalKarmaEarned: newTotal,
        level: newLevel,
      },
    });

    // Check for level up
    if (newLevel !== profile.level) {
      await this.onLevelUp(userId, newLevel);
    }

    // Check for badge unlocks
    await this.checkBadgeUnlocks(userId);

    return updated;
  }

  private determineLevel(totalKarma: number): UserLevel {
    const levels = Object.entries(LEVEL_THRESHOLDS)
      .sort((a, b) => b[1] - a[1]) as [UserLevel, number][];

    for (const [level, threshold] of levels) {
      if (totalKarma >= threshold) {
        return level;
      }
    }
    return 'newcomer';
  }

  private async onLevelUp(userId: string, newLevel: UserLevel) {
    // Create notification
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'level_up',
        title: 'Level Up!',
        body: `Congratulations! You've reached ${newLevel} level!`,
        data: { level: newLevel },
      },
    });
  }

  async getAllBadges() {
    return this.prisma.badge.findMany({
      where: { isSecret: false },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async awardBadge(userId: string, badgeCode: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { code: badgeCode },
    });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    // Check if already earned
    const existing = await this.prisma.userBadge.findFirst({
      where: { userId, badgeId: badge.id },
    });

    if (existing) {
      return existing;
    }

    // Award badge
    const userBadge = await this.prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
      include: { badge: true },
    });

    // Award karma
    if (badge.karmaReward > 0) {
      await this.addKarma(userId, badge.karmaReward, `Badge unlock: ${badge.name}`, 'badge', badge.id);
    }

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'badge_earned',
        title: 'New Badge Earned!',
        body: `You've earned the "${badge.name}" badge!`,
        data: { badge },
      },
    });

    return userBadge;
  }

  async checkBadgeUnlocks(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    const allBadges = await this.prisma.badge.findMany();
    const earnedBadgeIds = profile.badges.map(b => b.badgeId);

    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      const requirement = JSON.parse(badge.requirement);
      let eligible = false;

      switch (requirement.type) {
        case 'posts_count':
          eligible = profile.postsCreated >= requirement.count;
          break;
        case 'karma_total':
          eligible = profile.totalKarmaEarned >= requirement.count;
          break;
        case 'streak_days':
          eligible = profile.longestStreak >= requirement.count;
          break;
        case 'helpful_votes':
          eligible = profile.helpfulVotes >= requirement.count;
          break;
        case 'events_attended':
          eligible = profile.eventsAttended >= requirement.count;
          break;
        case 'level':
          eligible = this.isLevelAtOrAbove(profile.level, requirement.level);
          break;
      }

      if (eligible) {
        await this.awardBadge(userId, badge.code);
      }
    }
  }

  private isLevelAtOrAbove(current: UserLevel, target: UserLevel): boolean {
    const levels: UserLevel[] = ['newcomer', 'resident', 'neighbor', 'pillar', 'guardian', 'legend'];
    return levels.indexOf(current) >= levels.indexOf(target);
  }

  async getLeaderboard(neighborhoodId: string, type: 'karma' | 'streak' | 'helpful', limit: number) {
    const members = await this.prisma.membership.findMany({
      where: { neighborhoodId, isActive: true },
      select: { userId: true },
    });

    const userIds = members.map(m => m.userId);

    let orderBy: any = { totalKarmaEarned: 'desc' };
    if (type === 'streak') orderBy = { longestStreak: 'desc' };
    if (type === 'helpful') orderBy = { helpfulVotes: 'desc' };

    const profiles = await this.prisma.userGamification.findMany({
      where: { userId: { in: userIds } },
      orderBy,
      take: limit,
    });

    // Get user details
    const users = await this.prisma.user.findMany({
      where: { id: { in: profiles.map(p => p.userId) } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return profiles.map((profile, index) => ({
      rank: index + 1,
      user: userMap.get(profile.userId),
      level: profile.level,
      karma: profile.totalKarmaEarned,
      streak: profile.longestStreak,
      helpfulVotes: profile.helpfulVotes,
    }));
  }

  async getKarmaHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.karmaTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.karmaTransaction.count({ where: { userId } }),
    ]);

    return {
      data: transactions,
      pagination: { page, limit, total, hasMore: skip + transactions.length < total },
    };
  }

  async getActiveChallenges(userId: string) {
    const now = new Date();

    const challenges = await this.prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: 'asc' },
    });

    // Get user's participation
    const userChallenges = await this.prisma.userChallenge.findMany({
      where: {
        userId,
        challengeId: { in: challenges.map(c => c.id) },
      },
    });

    const participationMap = new Map(userChallenges.map(uc => [uc.challengeId, uc]));

    return challenges.map(challenge => ({
      ...challenge,
      participation: participationMap.get(challenge.id) || null,
      isJoined: participationMap.has(challenge.id),
    }));
  }

  async joinChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found or inactive');
    }

    const now = new Date();
    if (now < challenge.startDate || now > challenge.endDate) {
      throw new BadRequestException('Challenge is not currently active');
    }

    // Check if already joined
    const existing = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (existing) {
      throw new BadRequestException('Already joined this challenge');
    }

    return this.prisma.userChallenge.create({
      data: { userId, challengeId },
      include: { challenge: true },
    });
  }

  async updateChallengeProgress(userId: string, challengeType: string, increment: number = 1) {
    const now = new Date();

    const userChallenges = await this.prisma.userChallenge.findMany({
      where: {
        userId,
        completed: false,
        challenge: {
          type: challengeType,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
      include: { challenge: true },
    });

    for (const uc of userChallenges) {
      const newProgress = uc.progress + increment;
      const completed = newProgress >= uc.challenge.target;

      await this.prisma.userChallenge.update({
        where: { id: uc.id },
        data: {
          progress: newProgress,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });

      if (completed) {
        await this.addKarma(
          userId,
          uc.challenge.karmaReward,
          `Challenge completed: ${uc.challenge.title}`,
          'challenge',
          uc.challengeId,
        );
      }
    }
  }

  async dailyCheckin(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    if (profile.lastActiveDate) {
      const lastActive = new Date(profile.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      if (lastActive.getTime() === today.getTime()) {
        throw new BadRequestException('Already checked in today');
      }

      // Check streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const isConsecutive = lastActive.getTime() === yesterday.getTime();
      const newStreak = isConsecutive ? profile.currentStreak + 1 : 1;
      const longestStreak = Math.max(profile.longestStreak, newStreak);

      // Update profile
      await this.prisma.userGamification.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak,
          lastActiveDate: new Date(),
        },
      });

      // Award karma
      let karmaAmount = KARMA_REWARDS.DAILY_CHECKIN;
      let bonusMessage = '';

      if (newStreak === 7) {
        karmaAmount += KARMA_REWARDS.STREAK_BONUS_7;
        bonusMessage = ' + 7-day streak bonus!';
      } else if (newStreak === 30) {
        karmaAmount += KARMA_REWARDS.STREAK_BONUS_30;
        bonusMessage = ' + 30-day streak bonus!';
      }

      await this.addKarma(userId, karmaAmount, `Daily check-in (Day ${newStreak})${bonusMessage}`, 'daily_checkin');

      return {
        streak: newStreak,
        karma: karmaAmount,
        message: `Day ${newStreak} streak!${bonusMessage}`,
      };
    } else {
      // First check-in
      await this.prisma.userGamification.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date(),
        },
      });

      await this.addKarma(userId, KARMA_REWARDS.DAILY_CHECKIN, 'First daily check-in!', 'daily_checkin');

      return {
        streak: 1,
        karma: KARMA_REWARDS.DAILY_CHECKIN,
        message: 'Welcome! Your streak has started!',
      };
    }
  }

  async getLevelProgress(userId: string) {
    const profile = await this.getOrCreateProfile(userId);
    return this.calculateLevelProgress(profile.totalKarmaEarned);
  }

  async trackReferral(referrerId: string, referredUserId: string) {
    // Verify the referred user exists and is new
    const referredUser = await this.prisma.user.findUnique({
      where: { id: referredUserId },
    });

    if (!referredUser) {
      throw new NotFoundException('Referred user not found');
    }

    // Check if this referral was already tracked
    const existingTransaction = await this.prisma.karmaTransaction.findFirst({
      where: {
        userId: referrerId,
        sourceType: 'referral',
        sourceId: referredUserId,
      },
    });

    if (existingTransaction) {
      throw new BadRequestException('Referral already tracked');
    }

    // Update referral count
    await this.prisma.userGamification.update({
      where: { userId: referrerId },
      data: { referralsCount: { increment: 1 } },
    });

    // Award karma
    await this.addKarma(
      referrerId,
      KARMA_REWARDS.REFERRAL,
      `Referral: ${referredUser.name} joined`,
      'referral',
      referredUserId,
    );

    return { success: true, karma: KARMA_REWARDS.REFERRAL };
  }

  // Hooks for other modules to trigger karma
  async onPostCreate(userId: string, postId: string) {
    await this.addKarma(userId, KARMA_REWARDS.POST_CREATE, 'Created a post', 'post', postId);
    await this.prisma.userGamification.update({
      where: { userId },
      data: { postsCreated: { increment: 1 } },
    });
    await this.updateChallengeProgress(userId, 'posts', 1);
  }

  async onCommentCreate(userId: string, commentId: string) {
    await this.addKarma(userId, KARMA_REWARDS.COMMENT_CREATE, 'Added a comment', 'comment', commentId);
    await this.prisma.userGamification.update({
      where: { userId },
      data: { commentsGiven: { increment: 1 } },
    });
  }

  async onHelpfulReaction(userId: string, postId: string) {
    // Get post author
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (post && post.userId !== userId) {
      await this.addKarma(post.userId, KARMA_REWARDS.POST_HELPFUL, 'Post marked helpful', 'helpful', postId);
      await this.prisma.userGamification.update({
        where: { userId: post.userId },
        data: { helpfulVotes: { increment: 1 } },
      });
    }
  }

  async onEventAttend(userId: string, eventId: string) {
    await this.addKarma(userId, KARMA_REWARDS.EVENT_ATTEND, 'Attended an event', 'event', eventId);
    await this.prisma.userGamification.update({
      where: { userId },
      data: { eventsAttended: { increment: 1 } },
    });
    await this.updateChallengeProgress(userId, 'events', 1);
  }

  async onPollVote(userId: string, pollId: string) {
    await this.addKarma(userId, KARMA_REWARDS.POLL_VOTE, 'Voted in a poll', 'poll', pollId);
    await this.prisma.userGamification.update({
      where: { userId },
      data: { pollsVoted: { increment: 1 } },
    });
  }

  async onSOSRespond(userId: string, alertId: string) {
    await this.addKarma(userId, KARMA_REWARDS.SOS_RESPOND, 'Responded to SOS', 'sos', alertId);
  }

  async onEndorsementGiven(userId: string) {
    await this.addKarma(userId, KARMA_REWARDS.ENDORSEMENT_GIVEN, 'Gave an endorsement', 'endorsement');
  }

  async onEndorsementReceived(userId: string) {
    await this.addKarma(userId, KARMA_REWARDS.ENDORSEMENT_RECEIVED, 'Received an endorsement', 'endorsement');
  }
}
