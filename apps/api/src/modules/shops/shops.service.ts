import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, neighborhoodId: string, data: {
    name: string;
    category: string;
    description?: string;
    address: string;
    phone?: string;
    hours?: Record<string, { open: string; close: string } | null>;
    images?: string[];
  }) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You must be a member to register a shop');
    }

    const shop = await this.prisma.shop.create({
      data: {
        userId,
        neighborhoodId,
        ...data,
        images: data.images || [],
      },
    });

    await this.prisma.membership.update({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
      data: { role: 'shop_owner' },
    });

    return shop;
  }

  async findById(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        neighborhood: { select: { name: true } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        offers: { where: { isActive: true, validUntil: { gt: new Date() } } },
      },
    });

    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async getShops(neighborhoodId: string, filters: {
    category?: string;
    verified?: boolean;
    minRating?: number;
    page?: number;
    limit?: number;
  }) {
    const { category, verified, minRating, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { neighborhoodId };
    if (category) where.category = category;
    if (verified) where.isVerified = true;
    if (minRating) where.rating = { gte: minRating };

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.shop.count({ where }),
    ]);

    return { data: shops, pagination: { page, limit, total, hasMore: skip + shops.length < total } };
  }

  async update(userId: string, shopId: string, data: Partial<{
    name: string;
    description: string;
    address: string;
    phone: string;
    hours: Record<string, { open: string; close: string } | null>;
    images: string[];
  }>) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    if (shop.userId !== userId) throw new ForbiddenException('Not authorized');

    return this.prisma.shop.update({ where: { id: shopId }, data });
  }

  async getCategories(neighborhoodId: string) {
    const shops = await this.prisma.shop.findMany({
      where: { neighborhoodId },
      select: { category: true },
      distinct: ['category'],
    });
    return shops.map(s => s.category);
  }
}
