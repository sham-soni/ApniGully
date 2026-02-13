import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateInviteCode, generateSlug, calculateDistance } from '@apnigully/shared';
import { UserRole, VerificationStatus } from '@prisma/client';

@Injectable()
export class NeighborhoodsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    name: string;
    city: string;
    state?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) {
    const slug = generateSlug(data.name + '-' + data.city);
    const inviteCode = generateInviteCode(8);

    const neighborhood = await this.prisma.neighborhood.create({
      data: {
        name: data.name,
        city: data.city,
        state: data.state || '',
        pincode: data.pincode,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
        slug,
        inviteCode,
        radius: data.radius || 500,
        memberCount: 1,
      },
    });

    // Add creator as admin
    await this.prisma.membership.create({
      data: {
        userId,
        neighborhoodId: neighborhood.id,
        role: 'admin',
        verificationStatus: 'verified',
      },
    });

    return neighborhood;
  }

  async findById(id: string) {
    const neighborhood = await this.prisma.neighborhood.findUnique({
      where: { id },
      include: {
        buildings: true,
        _count: {
          select: {
            memberships: { where: { isActive: true } },
            posts: { where: { isHidden: false } },
          },
        },
      },
    });

    if (!neighborhood) {
      throw new NotFoundException('Neighborhood not found');
    }

    return neighborhood;
  }

  async findBySlug(slug: string) {
    const neighborhood = await this.prisma.neighborhood.findUnique({
      where: { slug },
      include: {
        buildings: true,
        _count: {
          select: {
            memberships: { where: { isActive: true } },
            posts: { where: { isHidden: false } },
          },
        },
      },
    });

    if (!neighborhood) {
      throw new NotFoundException('Neighborhood not found');
    }

    return neighborhood;
  }

  async searchByLocation(latitude: number, longitude: number, radiusKm: number = 5) {
    // Get all neighborhoods and filter by distance
    const neighborhoods = await this.prisma.neighborhood.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { memberships: { where: { isActive: true } } },
        },
      },
    });

    return neighborhoods
      .map(n => ({
        ...n,
        distance: calculateDistance(latitude, longitude, n.latitude, n.longitude),
      }))
      .filter(n => n.distance <= radiusKm * 1000)
      .sort((a, b) => a.distance - b.distance);
  }

  async searchByPincode(pincode: string) {
    return this.prisma.neighborhood.findMany({
      where: {
        pincode: { contains: pincode },
        isActive: true,
      },
      include: {
        _count: {
          select: { memberships: { where: { isActive: true } } },
        },
      },
    });
  }

  async searchByName(query: string) {
    return this.prisma.neighborhood.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      include: {
        _count: {
          select: { memberships: { where: { isActive: true } } },
        },
      },
      take: 20,
    });
  }

  async joinByInviteCode(userId: string, inviteCode: string, buildingId?: string, unit?: string) {
    const neighborhood = await this.prisma.neighborhood.findUnique({
      where: { inviteCode },
    });

    if (!neighborhood) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if already a member
    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: {
          userId,
          neighborhoodId: neighborhood.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        throw new BadRequestException('Already a member of this neighborhood');
      }
      // Reactivate membership
      return this.prisma.membership.update({
        where: { id: existingMembership.id },
        data: { isActive: true, buildingId, unit },
      });
    }

    // Create membership
    const membership = await this.prisma.membership.create({
      data: {
        userId,
        neighborhoodId: neighborhood.id,
        buildingId,
        unit,
        role: 'resident',
        verificationStatus: 'pending',
      },
    });

    // Update member count
    await this.prisma.neighborhood.update({
      where: { id: neighborhood.id },
      data: { memberCount: { increment: 1 } },
    });

    return membership;
  }

  async requestJoin(userId: string, neighborhoodId: string, buildingId?: string, unit?: string) {
    const neighborhood = await this.prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
    });

    if (!neighborhood) {
      throw new NotFoundException('Neighborhood not found');
    }

    // Check if already a member
    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: {
          userId,
          neighborhoodId,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        throw new BadRequestException('Already a member of this neighborhood');
      }
      // Reactivate membership request
      return this.prisma.membership.update({
        where: { id: existingMembership.id },
        data: {
          isActive: false, // Will be activated by admin
          verificationStatus: 'pending',
          buildingId,
          unit
        },
      });
    }

    // Create pending membership
    return this.prisma.membership.create({
      data: {
        userId,
        neighborhoodId,
        buildingId,
        unit,
        role: 'resident',
        isActive: false, // Needs approval
        verificationStatus: 'pending',
      },
    });
  }

  async leaveNeighborhood(userId: string, neighborhoodId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: {
          userId,
          neighborhoodId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Check if user is the only admin
    if (membership.role === 'admin') {
      const adminCount = await this.prisma.membership.count({
        where: {
          neighborhoodId,
          role: 'admin',
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot leave: you are the only admin. Assign another admin first.');
      }
    }

    await this.prisma.membership.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    await this.prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: { memberCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async getMembers(neighborhoodId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.prisma.membership.findMany({
        where: { neighborhoodId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isVerified: true,
              trustScore: true,
            },
          },
          building: { select: { name: true } },
        },
        orderBy: { joinedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.membership.count({
        where: { neighborhoodId, isActive: true },
      }),
    ]);

    return {
      data: members,
      pagination: { page, limit, total, hasMore: skip + members.length < total },
    };
  }

  async getPendingMembers(neighborhoodId: string) {
    return this.prisma.membership.findMany({
      where: {
        neighborhoodId,
        isActive: false,
        verificationStatus: 'pending',
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        building: { select: { name: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async approveMember(adminId: string, membershipId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { neighborhood: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Check if requester is admin
    const adminMembership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: {
          userId: adminId,
          neighborhoodId: membership.neighborhoodId,
        },
      },
    });

    if (!adminMembership || !['admin', 'moderator'].includes(adminMembership.role)) {
      throw new ForbiddenException('Only admins can approve members');
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: {
        isActive: true,
        verificationStatus: 'verified',
      },
    });

    await this.prisma.neighborhood.update({
      where: { id: membership.neighborhoodId },
      data: { memberCount: { increment: 1 } },
    });

    return updated;
  }

  async rejectMember(adminId: string, membershipId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Check if requester is admin
    const adminMembership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: {
          userId: adminId,
          neighborhoodId: membership.neighborhoodId,
        },
      },
    });

    if (!adminMembership || !['admin', 'moderator'].includes(adminMembership.role)) {
      throw new ForbiddenException('Only admins can reject members');
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { verificationStatus: 'rejected' },
    });
  }

  async updateMemberRole(adminId: string, membershipId: string, newRole: UserRole) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Check if requester is admin
    const adminMembership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: {
          userId: adminId,
          neighborhoodId: membership.neighborhoodId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== 'admin') {
      throw new ForbiddenException('Only admins can change roles');
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: newRole },
    });
  }

  async createBuilding(adminId: string, neighborhoodId: string, data: {
    name: string;
    address: string;
    type: 'apartment' | 'society' | 'independent' | 'commercial';
    unitCount?: number;
  }) {
    // Check if requester is admin
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: {
          userId: adminId,
          neighborhoodId,
        },
      },
    });

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
      throw new ForbiddenException('Only admins can create buildings');
    }

    return this.prisma.building.create({
      data: {
        ...data,
        neighborhoodId,
      },
    });
  }

  async getBuildings(neighborhoodId: string) {
    return this.prisma.building.findMany({
      where: { neighborhoodId },
      include: {
        _count: {
          select: { memberships: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async regenerateInviteCode(adminId: string, neighborhoodId: string) {
    // Check if requester is admin
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_neighborhoodId: {
          userId: adminId,
          neighborhoodId,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only admins can regenerate invite codes');
    }

    const newCode = generateInviteCode(8);

    return this.prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: { inviteCode: newCode },
    });
  }

  async getStats(neighborhoodId: string) {
    const [
      memberCount,
      verifiedCount,
      postCount,
      helperCount,
      shopCount,
      rentalCount,
    ] = await Promise.all([
      this.prisma.membership.count({ where: { neighborhoodId, isActive: true } }),
      this.prisma.membership.count({
        where: { neighborhoodId, isActive: true, verificationStatus: 'verified' }
      }),
      this.prisma.post.count({ where: { neighborhoodId, isHidden: false } }),
      this.prisma.helperProfile.count({ where: { neighborhoodId, isActive: true } }),
      this.prisma.shop.count({ where: { neighborhoodId } }),
      this.prisma.rentalListing.count({
        where: { neighborhoodId, status: 'available' }
      }),
    ]);

    return {
      memberCount,
      verifiedCount,
      postCount,
      helperCount,
      shopCount,
      rentalCount,
    };
  }
}
