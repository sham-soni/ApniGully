import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async createSubscription(
    userId: string,
    data: {
      providerId: string;
      helperProfileId?: string;
      shopId?: string;
      name: string;
      description?: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      timeSlot?: string;
      amount: number;
      startDate: string;
      endDate?: string;
    },
  ) {
    // Verify provider exists
    const provider = await this.prisma.user.findUnique({
      where: { id: data.providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (data.providerId === userId) {
      throw new BadRequestException('Cannot subscribe to yourself');
    }

    const startDate = new Date(data.startDate);
    const amount = Math.round(data.amount * 100); // Convert to paisa

    // Calculate next occurrence
    const nextOccurrence = this.calculateNextOccurrence(
      startDate,
      data.frequency,
      data.daysOfWeek,
    );

    const subscription = await this.prisma.serviceSubscription.create({
      data: {
        userId,
        providerId: data.providerId,
        helperProfileId: data.helperProfileId,
        shopId: data.shopId,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        daysOfWeek: data.daysOfWeek || [],
        timeSlot: data.timeSlot,
        amount,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        nextOccurrence,
        status: 'active',
      },
    });

    // Create initial occurrences
    await this.generateOccurrences(subscription.id, startDate, 14); // Generate 2 weeks

    // Notify provider
    const subscriber = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: data.providerId,
        type: 'new_subscription',
        title: 'New Subscription',
        body: `${subscriber?.name} subscribed to ${data.name}`,
        data: { subscriptionId: subscription.id },
      },
    });

    return {
      ...subscription,
      amountRupees: subscription.amount / 100,
    };
  }

  private calculateNextOccurrence(
    startDate: Date,
    frequency: string,
    daysOfWeek?: number[],
  ): Date {
    const now = new Date();
    let next = new Date(startDate);

    if (next < now) {
      next = now;
    }

    if (frequency === 'daily') {
      return next;
    }

    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      const currentDay = next.getDay();
      const sortedDays = daysOfWeek.sort((a, b) => a - b);

      // Find next occurrence day
      let nextDay = sortedDays.find(d => d >= currentDay);
      if (nextDay === undefined) {
        nextDay = sortedDays[0];
        next.setDate(next.getDate() + (7 - currentDay + nextDay));
      } else {
        next.setDate(next.getDate() + (nextDay - currentDay));
      }
    }

    if (frequency === 'monthly') {
      if (next.getDate() > startDate.getDate()) {
        next.setMonth(next.getMonth() + 1);
      }
      next.setDate(startDate.getDate());
    }

    return next;
  }

  private async generateOccurrences(
    subscriptionId: string,
    startDate: Date,
    daysAhead: number,
  ) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) return;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAhead);

    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (subscription.frequency === 'daily') {
        occurrences.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (subscription.frequency === 'weekly') {
        const daysOfWeek = subscription.daysOfWeek as number[];
        if (daysOfWeek.includes(currentDate.getDay())) {
          occurrences.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (subscription.frequency === 'monthly') {
        if (currentDate.getDate() === startDate.getDate()) {
          occurrences.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Create occurrences
    for (const date of occurrences) {
      // Check if already exists
      const existing = await this.prisma.subscriptionOccurrence.findFirst({
        where: {
          subscriptionId,
          scheduledAt: date,
        },
      });

      if (!existing) {
        await this.prisma.subscriptionOccurrence.create({
          data: {
            subscriptionId,
            scheduledAt: date,
            status: 'scheduled',
          },
        });
      }
    }
  }

  async getMySubscriptions(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const subscriptions = await this.prisma.serviceSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Get provider details
    const providerIds = subscriptions.map(s => s.providerId);
    const providers = await this.prisma.user.findMany({
      where: { id: { in: providerIds } },
      select: { id: true, name: true, avatar: true },
    });

    const providerMap = new Map(providers.map(p => [p.id, p]));

    return subscriptions.map(s => ({
      ...s,
      amountRupees: s.amount / 100,
      provider: providerMap.get(s.providerId),
    }));
  }

  async getProviderSubscriptions(userId: string, status?: string) {
    const where: any = { providerId: userId };
    if (status) {
      where.status = status;
    }

    const subscriptions = await this.prisma.serviceSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Get subscriber details
    const userIds = subscriptions.map(s => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, phone: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return subscriptions.map(s => ({
      ...s,
      amountRupees: s.amount / 100,
      subscriber: userMap.get(s.userId),
    }));
  }

  async getSubscription(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId && subscription.providerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const [provider, subscriber, upcomingOccurrences] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: subscription.providerId },
        select: { id: true, name: true, avatar: true, phone: true },
      }),
      this.prisma.user.findUnique({
        where: { id: subscription.userId },
        select: { id: true, name: true, avatar: true, phone: true },
      }),
      this.prisma.subscriptionOccurrence.findMany({
        where: {
          subscriptionId,
          scheduledAt: { gte: new Date() },
          status: 'scheduled',
        },
        orderBy: { scheduledAt: 'asc' },
        take: 7,
      }),
    ]);

    return {
      ...subscription,
      amountRupees: subscription.amount / 100,
      provider,
      subscriber,
      upcomingOccurrences,
      isOwner: subscription.userId === userId,
    };
  }

  async updateSubscription(userId: string, subscriptionId: string, data: any) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Only subscriber can update');
    }

    const updateData: any = { ...data };
    if (data.amount) {
      updateData.amount = Math.round(data.amount * 100);
    }

    return this.prisma.serviceSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });
  }

  async pauseSubscription(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Only subscriber can pause');
    }

    if (subscription.status !== 'active') {
      throw new BadRequestException('Can only pause active subscriptions');
    }

    // Cancel upcoming occurrences
    await this.prisma.subscriptionOccurrence.updateMany({
      where: {
        subscriptionId,
        status: 'scheduled',
        scheduledAt: { gte: new Date() },
      },
      data: { status: 'cancelled' },
    });

    return this.prisma.serviceSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'paused',
        pausedAt: new Date(),
      },
    });
  }

  async resumeSubscription(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Only subscriber can resume');
    }

    if (subscription.status !== 'paused') {
      throw new BadRequestException('Can only resume paused subscriptions');
    }

    // Regenerate occurrences
    await this.generateOccurrences(subscriptionId, new Date(), 14);

    const nextOccurrence = this.calculateNextOccurrence(
      new Date(),
      subscription.frequency,
      subscription.daysOfWeek as number[],
    );

    return this.prisma.serviceSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        pausedAt: null,
        nextOccurrence,
      },
    });
  }

  async cancelSubscription(userId: string, subscriptionId: string, reason?: string) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Only subscriber can cancel');
    }

    // Cancel upcoming occurrences
    await this.prisma.subscriptionOccurrence.updateMany({
      where: {
        subscriptionId,
        status: 'scheduled',
        scheduledAt: { gte: new Date() },
      },
      data: { status: 'cancelled' },
    });

    const updated = await this.prisma.serviceSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    // Notify provider
    const subscriber = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: subscription.providerId,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        body: `${subscriber?.name} cancelled ${subscription.name}`,
        data: { subscriptionId },
      },
    });

    return updated;
  }

  async getOccurrences(userId: string, subscriptionId: string, page: number, limit: number) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId && subscription.providerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const skip = (page - 1) * limit;

    const [occurrences, total] = await Promise.all([
      this.prisma.subscriptionOccurrence.findMany({
        where: { subscriptionId },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.subscriptionOccurrence.count({ where: { subscriptionId } }),
    ]);

    return {
      data: occurrences,
      pagination: { page, limit, total, hasMore: skip + occurrences.length < total },
    };
  }

  async getUpcomingOccurrences(userId: string, subscriptionId: string, limit: number) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId && subscription.providerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.subscriptionOccurrence.findMany({
      where: {
        subscriptionId,
        scheduledAt: { gte: new Date() },
        status: 'scheduled',
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  }

  async completeOccurrence(userId: string, occurrenceId: string, notes?: string) {
    const occurrence = await this.prisma.subscriptionOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { subscription: true },
    });

    if (!occurrence) {
      throw new NotFoundException('Occurrence not found');
    }

    if (occurrence.subscription.providerId !== userId) {
      throw new ForbiddenException('Only provider can mark as completed');
    }

    return this.prisma.subscriptionOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notes,
      },
    });
  }

  async skipOccurrence(userId: string, occurrenceId: string, reason?: string) {
    const occurrence = await this.prisma.subscriptionOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { subscription: true },
    });

    if (!occurrence) {
      throw new NotFoundException('Occurrence not found');
    }

    if (occurrence.subscription.userId !== userId && occurrence.subscription.providerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.subscriptionOccurrence.update({
      where: { id: occurrenceId },
      data: {
        status: 'skipped',
        notes: reason,
      },
    });
  }

  async rateOccurrence(userId: string, occurrenceId: string, rating: number) {
    const occurrence = await this.prisma.subscriptionOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { subscription: true },
    });

    if (!occurrence) {
      throw new NotFoundException('Occurrence not found');
    }

    if (occurrence.subscription.userId !== userId) {
      throw new ForbiddenException('Only subscriber can rate');
    }

    if (occurrence.status !== 'completed') {
      throw new BadRequestException('Can only rate completed occurrences');
    }

    return this.prisma.subscriptionOccurrence.update({
      where: { id: occurrenceId },
      data: { rating },
    });
  }

  async getPayments(userId: string, subscriptionId: string, page: number, limit: number) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId && subscription.providerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.subscriptionPayment.findMany({
        where: { subscriptionId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.subscriptionPayment.count({ where: { subscriptionId } }),
    ]);

    return {
      data: payments.map(p => ({
        ...p,
        amountRupees: p.amount / 100,
      })),
      pagination: { page, limit, total, hasMore: skip + payments.length < total },
    };
  }

  async recordPayment(userId: string, subscriptionId: string, paymentId: string) {
    const subscription = await this.prisma.serviceSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Only subscriber can make payments');
    }

    // Calculate period
    const periodStart = new Date();
    const periodEnd = new Date();

    if (subscription.frequency === 'daily') {
      periodEnd.setDate(periodEnd.getDate() + 1);
    } else if (subscription.frequency === 'weekly') {
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.prisma.subscriptionPayment.create({
      data: {
        subscriptionId,
        amount: subscription.amount,
        periodStart,
        periodEnd,
        status: 'completed',
        paymentId,
        paidAt: new Date(),
      },
    });
  }

  async getCalendar(userId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const subscriptions = await this.prisma.serviceSubscription.findMany({
      where: {
        OR: [{ userId }, { providerId: userId }],
        status: 'active',
      },
    });

    const subscriptionIds = subscriptions.map(s => s.id);

    const occurrences = await this.prisma.subscriptionOccurrence.findMany({
      where: {
        subscriptionId: { in: subscriptionIds },
        scheduledAt: {
          gte: start,
          lte: end,
        },
      },
      include: { subscription: true },
      orderBy: { scheduledAt: 'asc' },
    });

    // Group by date
    const calendar: Record<string, any[]> = {};

    for (const occ of occurrences) {
      const dateKey = occ.scheduledAt.toISOString().split('T')[0];
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }
      calendar[dateKey].push({
        ...occ,
        subscriptionName: occ.subscription.name,
        isProvider: occ.subscription.providerId === userId,
      });
    }

    return calendar;
  }

  // Cron job to generate future occurrences
  async generateFutureOccurrences() {
    const activeSubscriptions = await this.prisma.serviceSubscription.findMany({
      where: { status: 'active' },
    });

    for (const subscription of activeSubscriptions) {
      // Get last occurrence
      const lastOccurrence = await this.prisma.subscriptionOccurrence.findFirst({
        where: { subscriptionId: subscription.id },
        orderBy: { scheduledAt: 'desc' },
      });

      const startDate = lastOccurrence
        ? new Date(lastOccurrence.scheduledAt)
        : new Date();

      await this.generateOccurrences(subscription.id, startDate, 14);
    }
  }
}
