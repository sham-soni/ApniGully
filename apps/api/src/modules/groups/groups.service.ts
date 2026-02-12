import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GroupType } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, neighborhoodId: string, data: {
    name: string;
    description?: string;
    type: GroupType;
    isPrivate?: boolean;
    buildingId?: string;
  }) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Must be a member');
    }

    const group = await this.prisma.microGroup.create({
      data: {
        neighborhoodId,
        buildingId: data.buildingId,
        name: data.name,
        description: data.description,
        type: data.type,
        isPrivate: data.isPrivate || false,
        memberCount: 1,
      },
    });

    // Add creator as admin
    await this.prisma.groupMember.create({
      data: { groupId: group.id, userId, isAdmin: true },
    });

    return group;
  }

  async getGroups(neighborhoodId: string, userId?: string) {
    const groups = await this.prisma.microGroup.findMany({
      where: {
        neighborhoodId,
        OR: [
          { isPrivate: false },
          { members: { some: { userId } } },
        ],
      },
      include: {
        building: { select: { name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { memberCount: 'desc' },
    });

    if (userId) {
      const memberships = await this.prisma.groupMember.findMany({
        where: { userId, groupId: { in: groups.map(g => g.id) } },
      });
      const membershipMap = new Map(memberships.map(m => [m.groupId, m]));

      return groups.map(g => ({
        ...g,
        isMember: membershipMap.has(g.id),
        isAdmin: membershipMap.get(g.id)?.isAdmin || false,
      }));
    }

    return groups;
  }

  async join(userId: string, groupId: string) {
    const group = await this.prisma.microGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new BadRequestException('Already a member');

    await this.prisma.groupMember.create({
      data: { groupId, userId },
    });

    await this.prisma.microGroup.update({
      where: { id: groupId },
      data: { memberCount: { increment: 1 } },
    });

    return { success: true };
  }

  async leave(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new BadRequestException('Not a member');

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });

    await this.prisma.microGroup.update({
      where: { id: groupId },
      data: { memberCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async getMembers(groupId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      this.prisma.groupMember.findMany({
        where: { groupId },
        include: { group: true },
        orderBy: { joinedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.groupMember.count({ where: { groupId } }),
    ]);

    return { data: members, pagination: { page, limit, total, hasMore: skip + members.length < total } };
  }
}
