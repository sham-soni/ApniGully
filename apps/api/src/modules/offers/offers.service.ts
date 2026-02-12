import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RATE_LIMITS } from '@apnigully/shared';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, shopId: string, data: {
    title: string;
    description: string;
    discountPercent?: number;
    validFrom: Date;
    validUntil: Date;
  }) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    if (shop.userId !== userId) throw new ForbiddenException('Not authorized');
    if (!shop.isVerified) throw new BadRequestException('Shop must be verified to post offers');

    // Rate limit: 3 offers per week
    const recentOffers = await this.prisma.offer.count({
      where: {
        shopId,
        createdAt: { gte: new Date(Date.now() - RATE_LIMITS.OFFERS_PER_SHOP.windowMs) },
      },
    });

    if (recentOffers >= RATE_LIMITS.OFFERS_PER_SHOP.max) {
      throw new BadRequestException('Offer limit reached for this week');
    }

    return this.prisma.offer.create({
      data: { shopId, ...data },
    });
  }

  async getActiveOffers(neighborhoodId: string) {
    return this.prisma.offer.findMany({
      where: {
        isActive: true,
        validUntil: { gt: new Date() },
        validFrom: { lte: new Date() },
        shop: { neighborhoodId, isVerified: true },
      },
      include: {
        shop: { select: { id: true, name: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(userId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { shop: true },
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.shop.userId !== userId) throw new ForbiddenException('Not authorized');

    return this.prisma.offer.update({
      where: { id: offerId },
      data: { isActive: false },
    });
  }

  async getShopOffers(shopId: string) {
    return this.prisma.offer.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
