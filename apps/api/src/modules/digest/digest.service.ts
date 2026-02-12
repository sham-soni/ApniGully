import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DigestFrequency } from '@prisma/client';

@Injectable()
export class DigestService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string, neighborhoodId: string) {
    return this.prisma.digestPreference.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
    });
  }

  async updatePreferences(userId: string, neighborhoodId: string, data: {
    frequency?: DigestFrequency;
    includeAlerts?: boolean;
    includeRecommendations?: boolean;
    includeRentals?: boolean;
    preferredTime?: string;
  }) {
    return this.prisma.digestPreference.upsert({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
      update: data,
      create: { userId, neighborhoodId, ...data },
    });
  }

  async generateDigest(neighborhoodId: string, period: 'daily' | 'weekly') {
    const since = period === 'daily'
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [topPosts, safetyAlerts, recommendations, newRentals] = await Promise.all([
      // Top posts by engagement
      this.prisma.post.findMany({
        where: { neighborhoodId, isHidden: false, createdAt: { gte: since } },
        orderBy: [{ reactionCount: 'desc' }, { commentCount: 'desc' }],
        include: { user: { select: { name: true, avatar: true } } },
        take: 5,
      }),
      // Safety alerts
      this.prisma.safetyAlert.findMany({
        where: { neighborhoodId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      // Top recommendations
      this.prisma.post.findMany({
        where: { neighborhoodId, type: 'recommendation', isHidden: false, createdAt: { gte: since } },
        orderBy: { reactionCount: 'desc' },
        include: { user: { select: { name: true } } },
        take: 5,
      }),
      // New rentals
      this.prisma.rentalListing.findMany({
        where: { neighborhoodId, status: 'available', createdAt: { gte: since } },
        include: { post: { select: { content: true } } },
        take: 5,
      }),
    ]);

    return {
      period,
      generatedAt: new Date(),
      topPosts,
      safetyAlerts,
      recommendations,
      newRentals,
      stats: {
        totalPosts: topPosts.length,
        alertCount: safetyAlerts.length,
      },
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyDigests() {
    const preferences = await this.prisma.digestPreference.findMany({
      where: { frequency: 'daily' },
      include: { user: true, neighborhood: true },
    });

    for (const pref of preferences) {
      const digest = await this.generateDigest(pref.neighborhoodId, 'daily');
      // In production, send email/push notification
      console.log(`Daily digest for ${pref.user.name} in ${pref.neighborhood.name}`);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyDigests() {
    const preferences = await this.prisma.digestPreference.findMany({
      where: { frequency: 'weekly' },
      include: { user: true, neighborhood: true },
    });

    for (const pref of preferences) {
      const digest = await this.generateDigest(pref.neighborhoodId, 'weekly');
      console.log(`Weekly digest for ${pref.user.name} in ${pref.neighborhood.name}`);
    }
  }
}
