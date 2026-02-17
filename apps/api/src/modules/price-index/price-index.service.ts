import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Price categories
const PRICE_CATEGORIES = [
  'vegetables',
  'fruits',
  'dairy',
  'groceries',
  'meat',
  'fish',
  'bakery',
  'beverages',
  'household',
  'personal_care',
  'services',
  'utilities',
] as const;

type PriceCategory = (typeof PRICE_CATEGORIES)[number];

@Injectable()
export class PriceIndexService {
  constructor(private prisma: PrismaService) {}

  // Add or update a price entry
  async addPriceEntry(
    userId: string,
    data: {
      neighborhoodId: string;
      itemName: string;
      category: string;
      price: number;
      unit: string;
      shopName?: string;
      shopId?: string;
      notes?: string;
    },
  ) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId: data.neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Must be a member of the neighborhood');
    }

    // Find or create the price item
    let priceItem = await this.prisma.priceItem.findFirst({
      where: {
        neighborhoodId: data.neighborhoodId,
        name: { equals: data.itemName, mode: 'insensitive' },
        unit: data.unit,
      },
    });

    if (!priceItem) {
      priceItem = await this.prisma.priceItem.create({
        data: {
          neighborhoodId: data.neighborhoodId,
          name: data.itemName,
          category: data.category,
          unit: data.unit,
        },
      });
    }

    // Create price entry (in paisa)
    const pricePaisa = Math.round(data.price * 100);

    const entry = await this.prisma.priceEntry.create({
      data: {
        priceItemId: priceItem.id,
        userId,
        price: pricePaisa,
        shopName: data.shopName,
        shopId: data.shopId,
        notes: data.notes,
      },
    });

    // Update item's average price
    await this.updateItemAverages(priceItem.id);

    // Award karma for contribution
    await this.prisma.karmaTransaction.create({
      data: {
        userId,
        amount: 2,
        reason: 'price_contribution',
        sourceType: 'price_entry',
        sourceId: entry.id,
      },
    });

    return {
      ...entry,
      priceRupees: pricePaisa / 100,
      item: priceItem,
    };
  }

  // Update item averages
  private async updateItemAverages(priceItemId: string) {
    // Get entries from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await this.prisma.priceEntry.findMany({
      where: {
        priceItemId,
        reportedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { reportedAt: 'desc' },
    });

    if (entries.length === 0) return;

    const prices = entries.map(e => e.price);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    await this.prisma.priceItem.update({
      where: { id: priceItemId },
      data: {
        currentPrice: avgPrice,
        minPrice,
        maxPrice,
        lastUpdated: new Date(),
      },
    });
  }

  // Get price index for neighborhood
  async getPriceIndex(neighborhoodId: string, category?: string) {
    const where: any = { neighborhoodId };
    if (category) {
      where.category = category;
    }

    const items = await this.prisma.priceItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push({
        ...item,
        currentPriceRupees: item.currentPrice ? item.currentPrice / 100 : null,
        minPriceRupees: item.minPrice ? item.minPrice / 100 : null,
        maxPriceRupees: item.maxPrice ? item.maxPrice / 100 : null,
      });
    }

    return grouped;
  }

  // Get item price history
  async getItemPriceHistory(itemId: string, days: number = 30) {
    const item = await this.prisma.priceItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await this.prisma.priceEntry.findMany({
      where: {
        priceItemId: itemId,
        reportedAt: { gte: startDate },
      },
      orderBy: { reportedAt: 'asc' },
    });

    // Group by day for chart
    const dailyPrices: Record<string, number[]> = {};
    for (const entry of entries) {
      const day = entry.reportedAt.toISOString().split('T')[0];
      if (!dailyPrices[day]) {
        dailyPrices[day] = [];
      }
      dailyPrices[day].push(entry.price);
    }

    const chartData = Object.entries(dailyPrices).map(([date, prices]) => ({
      date,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) / 100,
      minPrice: Math.min(...prices) / 100,
      maxPrice: Math.max(...prices) / 100,
      entries: prices.length,
    }));

    return {
      item: {
        ...item,
        currentPriceRupees: item.currentPrice ? item.currentPrice / 100 : null,
      },
      entries: entries.map(e => ({
        ...e,
        priceRupees: e.price / 100,
      })),
      chartData,
    };
  }

  // Compare prices across neighborhoods
  async comparePrices(
    itemName: string,
    neighborhoodIds: string[],
  ) {
    const items = await this.prisma.priceItem.findMany({
      where: {
        neighborhoodId: { in: neighborhoodIds },
        name: { equals: itemName, mode: 'insensitive' },
      },
      include: {
        neighborhood: { select: { id: true, name: true } },
      },
    });

    return items.map(item => ({
      neighborhood: item.neighborhood,
      item: {
        ...item,
        currentPriceRupees: item.currentPrice ? item.currentPrice / 100 : null,
        minPriceRupees: item.minPrice ? item.minPrice / 100 : null,
        maxPriceRupees: item.maxPrice ? item.maxPrice / 100 : null,
      },
    }));
  }

  // Search items
  async searchItems(neighborhoodId: string, query: string) {
    const items = await this.prisma.priceItem.findMany({
      where: {
        neighborhoodId,
        name: { contains: query, mode: 'insensitive' },
      },
      take: 20,
    });

    return items.map(item => ({
      ...item,
      currentPriceRupees: item.currentPrice ? item.currentPrice / 100 : null,
    }));
  }

  // Set price alert
  async setPriceAlert(
    userId: string,
    data: {
      priceItemId: string;
      alertType: 'below' | 'above';
      targetPrice: number;
    },
  ) {
    const item = await this.prisma.priceItem.findUnique({
      where: { id: data.priceItemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const targetPricePaisa = Math.round(data.targetPrice * 100);

    // Check for existing alert
    const existing = await this.prisma.priceAlert.findFirst({
      where: {
        userId,
        priceItemId: data.priceItemId,
        isActive: true,
      },
    });

    if (existing) {
      // Update existing alert
      return this.prisma.priceAlert.update({
        where: { id: existing.id },
        data: {
          alertType: data.alertType,
          targetPrice: targetPricePaisa,
        },
      });
    }

    return this.prisma.priceAlert.create({
      data: {
        userId,
        priceItemId: data.priceItemId,
        alertType: data.alertType,
        targetPrice: targetPricePaisa,
      },
    });
  }

  // Get user's price alerts
  async getMyAlerts(userId: string) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { userId, isActive: true },
      include: {
        priceItem: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map(alert => ({
      ...alert,
      targetPriceRupees: alert.targetPrice / 100,
      priceItem: {
        ...alert.priceItem,
        currentPriceRupees: alert.priceItem.currentPrice ? alert.priceItem.currentPrice / 100 : null,
      },
    }));
  }

  // Delete price alert
  async deleteAlert(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    await this.prisma.priceAlert.delete({
      where: { id: alertId },
    });

    return { success: true };
  }

  // Check and trigger price alerts (cron job)
  async checkPriceAlerts() {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { isActive: true },
      include: { priceItem: true },
    });

    for (const alert of alerts) {
      if (!alert.priceItem.currentPrice) continue;

      const shouldTrigger =
        (alert.alertType === 'below' && alert.priceItem.currentPrice <= alert.targetPrice) ||
        (alert.alertType === 'above' && alert.priceItem.currentPrice >= alert.targetPrice);

      if (shouldTrigger) {
        // Create notification
        await this.prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'price_alert',
            title: 'Price Alert',
            body: `${alert.priceItem.name} is now ₹${(alert.priceItem.currentPrice / 100).toFixed(2)}/${alert.priceItem.unit}`,
            data: {
              itemId: alert.priceItemId,
              currentPrice: alert.priceItem.currentPrice / 100,
            },
          },
        });

        // Mark alert as triggered
        await this.prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            isActive: false,
            triggeredAt: new Date(),
          },
        });
      }
    }
  }

  // Get categories
  getCategories() {
    const categoryNames: Record<string, string> = {
      vegetables: 'Vegetables',
      fruits: 'Fruits',
      dairy: 'Dairy Products',
      groceries: 'Groceries',
      meat: 'Meat',
      fish: 'Fish & Seafood',
      bakery: 'Bakery',
      beverages: 'Beverages',
      household: 'Household Items',
      personal_care: 'Personal Care',
      services: 'Services',
      utilities: 'Utilities',
    };

    return PRICE_CATEGORIES.map(cat => ({
      id: cat,
      name: categoryNames[cat],
    }));
  }

  // Get trending prices
  async getTrendingPrices(neighborhoodId: string) {
    // Items with most price changes in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const items = await this.prisma.priceItem.findMany({
      where: {
        neighborhoodId,
        lastUpdated: { gte: sevenDaysAgo },
      },
      orderBy: { lastUpdated: 'desc' },
      take: 10,
    });

    // Calculate price trends
    const itemsWithTrends = await Promise.all(
      items.map(async item => {
        const entries = await this.prisma.priceEntry.findMany({
          where: {
            priceItemId: item.id,
            reportedAt: { gte: sevenDaysAgo },
          },
          orderBy: { reportedAt: 'asc' },
        });

        if (entries.length < 2) {
          return {
            ...item,
            currentPriceRupees: item.currentPrice ? item.currentPrice / 100 : null,
            trend: 'stable',
            changePercent: 0,
          };
        }

        const firstPrice = entries[0].price;
        const lastPrice = entries[entries.length - 1].price;
        const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;

        return {
          ...item,
          currentPriceRupees: item.currentPrice ? item.currentPrice / 100 : null,
          trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
          changePercent: Math.round(changePercent * 10) / 10,
        };
      }),
    );

    return itemsWithTrends;
  }

  // Get my contributions
  async getMyContributions(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.priceEntry.findMany({
        where: { userId },
        include: {
          priceItem: true,
        },
        orderBy: { reportedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.priceEntry.count({ where: { userId } }),
    ]);

    return {
      data: entries.map(e => ({
        ...e,
        priceRupees: e.price / 100,
        item: {
          ...e.priceItem,
          currentPriceRupees: e.priceItem.currentPrice ? e.priceItem.currentPrice / 100 : null,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + entries.length < total,
      },
    };
  }

  // Get basket cost (common items)
  async getBasketCost(neighborhoodId: string, itemIds: string[]) {
    const items = await this.prisma.priceItem.findMany({
      where: {
        id: { in: itemIds },
        neighborhoodId,
      },
    });

    const totalPaisa = items.reduce((sum, item) => sum + (item.currentPrice || 0), 0);

    return {
      items: items.map(item => ({
        ...item,
        currentPriceRupees: item.currentPrice ? item.currentPrice / 100 : null,
      })),
      totalRupees: totalPaisa / 100,
      itemCount: items.length,
    };
  }
}
