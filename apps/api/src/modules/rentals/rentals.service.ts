import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PropertyType, FurnishingType, ListingStatus, ContactPreference } from '@prisma/client';
import { parseRentalPost, getPostFingerprint } from '@apnigully/shared';

@Injectable()
export class RentalsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    neighborhoodId: string,
    data: {
      propertyType: PropertyType;
      bhk?: string;
      rentAmount: number;
      depositAmount: number;
      furnishing: FurnishingType;
      availableFrom: Date;
      area?: number;
      floor?: number;
      totalFloors?: number;
      amenities?: string[];
      contactPreference?: ContactPreference;
      content: string;
      images?: string[];
      tags?: string[];
    },
  ) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You must be a member to post rentals');
    }

    // Create post first
    const fingerprint = getPostFingerprint(data.content, 'rental');
    const post = await this.prisma.post.create({
      data: {
        userId,
        neighborhoodId,
        type: 'rental',
        content: data.content,
        images: data.images || [],
        tags: data.tags || [],
        fingerprint,
      },
    });

    // Create rental listing
    const rental = await this.prisma.rentalListing.create({
      data: {
        postId: post.id,
        userId,
        neighborhoodId,
        propertyType: data.propertyType,
        bhk: data.bhk,
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        furnishing: data.furnishing,
        availableFrom: data.availableFrom,
        area: data.area,
        floor: data.floor,
        totalFloors: data.totalFloors,
        amenities: data.amenities || [],
        contactPreference: data.contactPreference || 'chat',
      },
      include: {
        post: {
          include: {
            user: { select: { id: true, name: true, avatar: true, isVerified: true } },
          },
        },
      },
    });

    return rental;
  }

  async findById(id: string) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id },
      include: {
        post: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, isVerified: true, trustScore: true },
            },
            neighborhood: { select: { name: true } },
          },
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          take: 5,
        },
      },
    });

    if (!rental) {
      throw new NotFoundException('Rental listing not found');
    }

    return rental;
  }

  async getListings(
    neighborhoodId: string,
    filters: {
      propertyType?: PropertyType;
      minRent?: number;
      maxRent?: number;
      bhk?: string;
      furnishing?: FurnishingType;
      availableNow?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const { propertyType, minRent, maxRent, bhk, furnishing, availableNow, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      neighborhoodId,
      status: 'available',
      post: { isHidden: false },
    };

    if (propertyType) where.propertyType = propertyType;
    if (bhk) where.bhk = bhk;
    if (furnishing) where.furnishing = furnishing;
    if (minRent) where.rentAmount = { ...where.rentAmount, gte: minRent };
    if (maxRent) where.rentAmount = { ...where.rentAmount, lte: maxRent };
    if (availableNow) where.availableFrom = { lte: new Date() };

    const [rentals, total] = await Promise.all([
      this.prisma.rentalListing.findMany({
        where,
        include: {
          post: {
            include: {
              user: { select: { id: true, name: true, avatar: true, isVerified: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rentalListing.count({ where }),
    ]);

    return {
      data: rentals,
      pagination: { page, limit, total, hasMore: skip + rentals.length < total },
    };
  }

  async updateStatus(userId: string, rentalId: string, status: ListingStatus) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: rentalId },
    });

    if (!rental) {
      throw new NotFoundException('Rental listing not found');
    }

    if (rental.userId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    return this.prisma.rentalListing.update({
      where: { id: rentalId },
      data: { status },
    });
  }

  async update(
    userId: string,
    rentalId: string,
    data: Partial<{
      rentAmount: number;
      depositAmount: number;
      availableFrom: Date;
      amenities: string[];
      status: ListingStatus;
    }>,
  ) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: rentalId },
    });

    if (!rental) {
      throw new NotFoundException('Rental listing not found');
    }

    if (rental.userId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    return this.prisma.rentalListing.update({
      where: { id: rentalId },
      data,
    });
  }

  async parseRentalText(text: string) {
    return parseRentalPost(text);
  }

  async scheduleVisit(userId: string, rentalId: string, message: string) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: rentalId },
      include: { user: true },
    });

    if (!rental) {
      throw new NotFoundException('Rental listing not found');
    }

    // Create chat with owner
    let chat = await this.prisma.chat.findFirst({
      where: {
        type: 'direct',
        participants: {
          every: { userId: { in: [userId, rental.userId] } },
        },
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          type: 'direct',
          participants: {
            create: [{ userId }, { userId: rental.userId }],
          },
        },
      });
    }

    // Send visit request message
    const visitMessage = `Hi, I'm interested in your rental listing and would like to schedule a visit.\n\n${message}`;

    await this.prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: userId,
        content: visitMessage,
        type: 'text',
      },
    });

    await this.prisma.chat.update({
      where: { id: chat.id },
      data: { lastMessageAt: new Date() },
    });

    return { chatId: chat.id };
  }
}
