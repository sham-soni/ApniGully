import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class RWAService {
  constructor(private prisma: PrismaService) {}

  private async checkAdminAccess(userId: string, rwaId: string) {
    const member = await this.prisma.rWAMember.findFirst({
      where: {
        rwaId,
        userId,
        role: { in: ['president', 'secretary', 'treasurer', 'committee_member'] },
        isActive: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('Admin access required');
    }

    return member;
  }

  async createRWA(
    userId: string,
    neighborhoodId: string,
    data: {
      name: string;
      registrationNo?: string;
      address?: string;
      email?: string;
      phone?: string;
    },
  ) {
    // Check if RWA already exists
    const existing = await this.prisma.rWA.findUnique({
      where: { neighborhoodId },
    });

    if (existing) {
      throw new BadRequestException('RWA already exists for this neighborhood');
    }

    // Check if user is admin of neighborhood
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId } },
    });

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
      throw new ForbiddenException('Only neighborhood admins can create RWA');
    }

    // Create RWA
    const rwa = await this.prisma.rWA.create({
      data: {
        neighborhoodId,
        ...data,
      },
    });

    // Add creator as president
    await this.prisma.rWAMember.create({
      data: {
        rwaId: rwa.id,
        userId,
        role: 'president',
      },
    });

    // Create default account
    await this.prisma.rWAAccount.create({
      data: {
        rwaId: rwa.id,
        name: 'Main Account',
      },
    });

    return rwa;
  }

  async getRWA(neighborhoodId: string) {
    const rwa = await this.prisma.rWA.findUnique({
      where: { neighborhoodId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            // Get user details manually
          },
        },
        accounts: {
          select: { id: true, name: true, balance: true },
        },
      },
    });

    if (!rwa) {
      throw new NotFoundException('RWA not found');
    }

    // Get member user details
    const userIds = rwa.members.map(m => m.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      ...rwa,
      members: rwa.members.map(m => ({
        ...m,
        user: userMap.get(m.userId),
      })),
    };
  }

  async updateRWA(userId: string, rwaId: string, data: any) {
    await this.checkAdminAccess(userId, rwaId);

    return this.prisma.rWA.update({
      where: { id: rwaId },
      data,
    });
  }

  // Maintenance Dues
  async createMaintenanceDue(userId: string, rwaId: string, data: any) {
    await this.checkAdminAccess(userId, rwaId);

    return this.prisma.maintenanceDue.create({
      data: {
        rwaId,
        userId: data.userId,
        unit: data.unit,
        amount: Math.round(data.amount * 100), // Convert to paisa
        dueDate: new Date(data.dueDate),
        description: data.description,
      },
    });
  }

  async getMaintenanceDues(userId: string, rwaId: string, status: string | undefined, page: number, limit: number) {
    await this.checkAdminAccess(userId, rwaId);

    const skip = (page - 1) * limit;
    const where: any = { rwaId };
    if (status) where.status = status;

    const [dues, total] = await Promise.all([
      this.prisma.maintenanceDue.findMany({
        where,
        orderBy: { dueDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.maintenanceDue.count({ where }),
    ]);

    // Get user details
    const userIds = dues.map(d => d.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: dues.map(d => ({
        ...d,
        amountRupees: d.amount / 100,
        user: userMap.get(d.userId),
      })),
      pagination: { page, limit, total, hasMore: skip + dues.length < total },
    };
  }

  async getUserDues(userId: string) {
    const dues = await this.prisma.maintenanceDue.findMany({
      where: { userId },
      include: { rwa: true },
      orderBy: { dueDate: 'desc' },
    });

    return dues.map(d => ({
      ...d,
      amountRupees: d.amount / 100,
    }));
  }

  async markDuePaid(userId: string, dueId: string, paymentId: string) {
    const due = await this.prisma.maintenanceDue.findUnique({
      where: { id: dueId },
    });

    if (!due) {
      throw new NotFoundException('Due not found');
    }

    if (due.userId !== userId) {
      throw new ForbiddenException('You can only pay your own dues');
    }

    return this.prisma.maintenanceDue.update({
      where: { id: dueId },
      data: {
        status: 'completed',
        paidAt: new Date(),
        paymentId,
        paidAmount: due.amount,
      },
    });
  }

  // Complaints
  async fileComplaint(userId: string, rwaId: string, data: any) {
    // Verify user is member
    const rwa = await this.prisma.rWA.findUnique({
      where: { id: rwaId },
    });

    if (!rwa) {
      throw new NotFoundException('RWA not found');
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId: rwa.neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You must be a member');
    }

    return this.prisma.complaint.create({
      data: {
        rwaId,
        userId,
        category: data.category,
        title: data.title,
        description: data.description,
        images: data.images || [],
        priority: data.priority || 'medium',
      },
    });
  }

  async getComplaints(userId: string, rwaId: string, status: string | undefined, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: any = { rwaId };
    if (status) where.status = status;

    const [complaints, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    // Get user details
    const userIds = complaints.map(c => c.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: complaints.map(c => ({
        ...c,
        user: userMap.get(c.userId),
      })),
      pagination: { page, limit, total, hasMore: skip + complaints.length < total },
    };
  }

  async getComplaint(complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        updates: {
          orderBy: { createdAt: 'asc' },
        },
        rwa: true,
      },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Get user details
    const userIds = [complaint.userId, ...complaint.updates.map(u => u.userId)];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      ...complaint,
      user: userMap.get(complaint.userId),
      updates: complaint.updates.map(u => ({
        ...u,
        user: userMap.get(u.userId),
      })),
    };
  }

  async addComplaintUpdate(userId: string, complaintId: string, data: { message: string; status?: string }) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Check if user is complaint owner or admin
    const isOwner = complaint.userId === userId;
    const isAdmin = await this.prisma.rWAMember.findFirst({
      where: {
        rwaId: complaint.rwaId,
        userId,
        role: { in: ['president', 'secretary', 'treasurer', 'committee_member'] },
      },
    });

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not authorized to update this complaint');
    }

    // Create update
    const update = await this.prisma.complaintUpdate.create({
      data: {
        complaintId,
        userId,
        message: data.message,
        status: data.status as any,
      },
    });

    // Update complaint status if provided
    if (data.status) {
      await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: data.status as any,
          resolvedAt: data.status === 'resolved' ? new Date() : undefined,
        },
      });
    }

    return update;
  }

  async assignComplaint(userId: string, complaintId: string, assignedTo: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    await this.checkAdminAccess(userId, complaint.rwaId);

    return this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        assignedTo,
        status: 'in_progress',
      },
    });
  }

  // Meetings
  async scheduleMeeting(userId: string, rwaId: string, data: any) {
    await this.checkAdminAccess(userId, rwaId);

    return this.prisma.meeting.create({
      data: {
        rwaId,
        title: data.title,
        description: data.description,
        agenda: data.agenda,
        location: data.location,
        isOnline: data.isOnline || false,
        onlineLink: data.onlineLink,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
      },
    });
  }

  async getMeetings(rwaId: string, upcoming: boolean) {
    const where: any = { rwaId };
    if (upcoming) {
      where.scheduledAt = { gte: new Date() };
    }

    return this.prisma.meeting.findMany({
      where,
      include: {
        votes: true,
      },
      orderBy: { scheduledAt: upcoming ? 'asc' : 'desc' },
    });
  }

  async createMeetingVote(userId: string, meetingId: string, data: any) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    await this.checkAdminAccess(userId, meeting.rwaId);

    return this.prisma.meetingVote.create({
      data: {
        meetingId,
        question: data.question,
        options: data.options,
        votes: {},
        isAnonymous: data.isAnonymous || false,
        closesAt: data.closesAt ? new Date(data.closesAt) : undefined,
      },
    });
  }

  async castVote(userId: string, voteId: string, optionIndex: number) {
    const vote = await this.prisma.meetingVote.findUnique({
      where: { id: voteId },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    if (vote.closesAt && new Date() > vote.closesAt) {
      throw new BadRequestException('Voting has closed');
    }

    const votes = vote.votes as Record<string, string[]>;

    // Remove previous vote
    for (const key of Object.keys(votes)) {
      votes[key] = votes[key].filter(id => id !== userId);
    }

    // Add new vote
    const optionKey = String(optionIndex);
    if (!votes[optionKey]) {
      votes[optionKey] = [];
    }
    votes[optionKey].push(userId);

    return this.prisma.meetingVote.update({
      where: { id: voteId },
      data: { votes },
    });
  }

  // Documents
  async uploadDocument(userId: string, rwaId: string, data: any) {
    await this.checkAdminAccess(userId, rwaId);

    return this.prisma.rWADocument.create({
      data: {
        rwaId,
        title: data.title,
        category: data.category,
        url: data.url,
        uploadedBy: userId,
        isPublic: data.isPublic ?? true,
      },
    });
  }

  async getDocuments(rwaId: string, category?: string) {
    const where: any = { rwaId, isPublic: true };
    if (category) where.category = category;

    return this.prisma.rWADocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Announcements
  async createAnnouncement(userId: string, rwaId: string, data: any) {
    await this.checkAdminAccess(userId, rwaId);

    return this.prisma.rWAAnnouncement.create({
      data: {
        rwaId,
        title: data.title,
        content: data.content,
        priority: data.priority || 'normal',
        attachments: data.attachments || [],
        publishedBy: userId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  async getAnnouncements(rwaId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      this.prisma.rWAAnnouncement.findMany({
        where: {
          rwaId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.rWAAnnouncement.count({
        where: {
          rwaId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
    ]);

    return {
      data: announcements,
      pagination: { page, limit, total, hasMore: skip + announcements.length < total },
    };
  }

  // Visitor Pass
  async createVisitorPass(userId: string, rwaId: string, data: any) {
    const rwa = await this.prisma.rWA.findUnique({
      where: { id: rwaId },
    });

    if (!rwa) {
      throw new NotFoundException('RWA not found');
    }

    // Get user's unit
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId: rwa.neighborhoodId } },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member');
    }

    const passCode = randomBytes(4).toString('hex').toUpperCase();

    return this.prisma.visitorPass.create({
      data: {
        rwaId,
        hostUserId: userId,
        hostUnit: membership.unit || 'Unknown',
        visitorName: data.visitorName,
        visitorPhone: data.visitorPhone,
        visitorVehicle: data.visitorVehicle,
        purpose: data.purpose,
        passCode,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
      },
    });
  }

  async verifyVisitorPass(passCode: string) {
    const pass = await this.prisma.visitorPass.findUnique({
      where: { passCode },
    });

    if (!pass) {
      throw new NotFoundException('Invalid pass code');
    }

    const now = new Date();
    const isValid = now >= pass.validFrom && now <= pass.validUntil;

    // Get host details
    const host = await this.prisma.user.findUnique({
      where: { id: pass.hostUserId },
      select: { name: true, phone: true },
    });

    return {
      ...pass,
      isValid,
      isExpired: now > pass.validUntil,
      isNotYetValid: now < pass.validFrom,
      isCheckedIn: !!pass.checkedInAt,
      host,
    };
  }

  async checkinVisitor(passId: string, guardNotes?: string) {
    return this.prisma.visitorPass.update({
      where: { id: passId },
      data: {
        checkedInAt: new Date(),
        guardNotes,
      },
    });
  }

  async checkoutVisitor(passId: string) {
    return this.prisma.visitorPass.update({
      where: { id: passId },
      data: { checkedOutAt: new Date() },
    });
  }

  // Accounts
  async getAccounts(userId: string, rwaId: string) {
    await this.checkAdminAccess(userId, rwaId);

    const accounts = await this.prisma.rWAAccount.findMany({
      where: { rwaId, isActive: true },
    });

    return accounts.map(a => ({
      ...a,
      balanceRupees: a.balance / 100,
    }));
  }

  async recordTransaction(userId: string, rwaId: string, data: any) {
    const member = await this.checkAdminAccess(userId, rwaId);

    if (!['president', 'secretary', 'treasurer'].includes(member.role)) {
      throw new ForbiddenException('Only treasurer, secretary, or president can record transactions');
    }

    const amount = Math.round(data.amount * 100);

    // Update account balance
    const account = await this.prisma.rWAAccount.update({
      where: { id: data.accountId },
      data: {
        balance: data.type === 'income'
          ? { increment: amount }
          : { decrement: amount },
      },
    });

    // Create transaction record
    return this.prisma.rWATransaction.create({
      data: {
        accountId: data.accountId,
        type: data.type,
        category: data.category,
        amount,
        description: data.description,
        receiptUrl: data.receiptUrl,
        recordedBy: userId,
        transactionDate: new Date(data.transactionDate),
      },
    });
  }

  async getTransactions(userId: string, rwaId: string, accountId: string | undefined, page: number, limit: number) {
    await this.checkAdminAccess(userId, rwaId);

    const skip = (page - 1) * limit;

    // Get accounts for this RWA
    const accounts = await this.prisma.rWAAccount.findMany({
      where: { rwaId },
      select: { id: true },
    });

    const accountIds = accounts.map(a => a.id);

    const where: any = { accountId: { in: accountIds } };
    if (accountId) where.accountId = accountId;

    const [transactions, total] = await Promise.all([
      this.prisma.rWATransaction.findMany({
        where,
        include: { account: { select: { name: true } } },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rWATransaction.count({ where }),
    ]);

    return {
      data: transactions.map(t => ({
        ...t,
        amountRupees: t.amount / 100,
      })),
      pagination: { page, limit, total, hasMore: skip + transactions.length < total },
    };
  }
}
