import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(neighborhoodId: string, query: string, type: 'all' | 'posts' | 'helpers' | 'shops' | 'rentals' = 'all', page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const results: any = {};

    if (type === 'all' || type === 'posts') {
      const posts = await this.prisma.post.findMany({
        where: {
          neighborhoodId,
          isHidden: false,
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query.toLowerCase()] } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: type === 'all' ? 5 : limit,
        skip: type === 'all' ? 0 : skip,
      });
      results.posts = posts;
    }

    if (type === 'all' || type === 'helpers') {
      const helpers = await this.prisma.helperProfile.findMany({
        where: {
          neighborhoodId,
          isActive: true,
          OR: [
            { bio: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, avatar: true, isVerified: true } },
        },
        orderBy: { rating: 'desc' },
        take: type === 'all' ? 5 : limit,
        skip: type === 'all' ? 0 : skip,
      });
      results.helpers = helpers;
    }

    if (type === 'all' || type === 'shops') {
      const shops = await this.prisma.shop.findMany({
        where: {
          neighborhoodId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { rating: 'desc' },
        take: type === 'all' ? 5 : limit,
        skip: type === 'all' ? 0 : skip,
      });
      results.shops = shops;
    }

    if (type === 'all' || type === 'rentals') {
      const rentals = await this.prisma.rentalListing.findMany({
        where: {
          neighborhoodId,
          status: 'available',
          post: {
            isHidden: false,
            content: { contains: query, mode: 'insensitive' },
          },
        },
        include: {
          post: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: type === 'all' ? 5 : limit,
        skip: type === 'all' ? 0 : skip,
      });
      results.rentals = rentals;
    }

    return results;
  }

  async getSuggestions(neighborhoodId: string, query: string) {
    // Get popular tags matching query
    const posts = await this.prisma.post.findMany({
      where: { neighborhoodId, isHidden: false },
      select: { tags: true },
    });

    const tagCounts = new Map<string, number>();
    posts.forEach(p => {
      p.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }
}
