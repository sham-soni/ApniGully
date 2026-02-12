import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatType, MessageStatus } from '@prisma/client';
import { isRateLimited, RATE_LIMITS, MESSAGE_TEMPLATES } from '@apnigully/shared';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async createOrGetChat(userId: string, participantId: string, type: ChatType = 'direct') {
    // Check if chat already exists between these users
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type,
        participants: {
          every: {
            userId: { in: [userId, participantId] },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, isVerified: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // Verify the other user exists
    const otherUser = await this.prisma.user.findUnique({
      where: { id: participantId },
    });

    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    // Create new chat
    const chat = await this.prisma.chat.create({
      data: {
        type,
        participants: {
          create: [
            { userId },
            { userId: participantId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, isVerified: true },
            },
          },
        },
      },
    });

    return chat;
  }

  async getChats(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where: {
          participants: { some: { userId, isBlocked: false } },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true, isVerified: true, lastSeenAt: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          task: {
            select: { id: true, status: true },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.chat.count({
        where: { participants: { some: { userId, isBlocked: false } } },
      }),
    ]);

    // Get unread counts
    const chatIds = chats.map((c) => c.id);
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['chatId'],
      where: {
        chatId: { in: chatIds },
        senderId: { not: userId },
        readBy: { isEmpty: true },
      },
      _count: true,
    });

    const unreadMap = new Map(unreadCounts.map((u) => [u.chatId, u._count]));

    const chatsWithUnread = chats.map((chat) => ({
      ...chat,
      unreadCount: unreadMap.get(chat.id) || 0,
      otherParticipant: chat.participants.find((p) => p.userId !== userId)?.user,
    }));

    return {
      data: chatsWithUnread,
      pagination: { page, limit, total, hasMore: skip + chats.length < total },
    };
  }

  async getChatById(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, isVerified: true, lastSeenAt: true },
            },
          },
        },
        task: true,
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = chat.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('Not a participant of this chat');
    }

    return {
      ...chat,
      otherParticipant: chat.participants.find((p) => p.userId !== userId)?.user,
    };
  }

  async getMessages(
    userId: string,
    chatId: string,
    page: number = 1,
    limit: number = 50,
    before?: string,
  ) {
    // Verify access
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant || participant.isBlocked) {
      throw new ForbiddenException('Access denied');
    }

    const where: any = { chatId };
    if (before) {
      const beforeMessage = await this.prisma.message.findUnique({
        where: { id: before },
      });
      if (beforeMessage) {
        where.createdAt = { lt: beforeMessage.createdAt };
      }
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.message.count({ where: { chatId } }),
    ]);

    // Mark messages as read
    await this.markAsRead(userId, chatId);

    return {
      data: messages.reverse(),
      pagination: { page, limit, total, hasMore: messages.length === limit },
    };
  }

  async sendMessage(
    userId: string,
    chatId: string,
    data: {
      content: string;
      type?: string;
      templateType?: string;
      images?: string[];
    },
  ) {
    // Verify access
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant) {
      throw new ForbiddenException('Not a participant of this chat');
    }

    if (participant.isBlocked) {
      throw new ForbiddenException('You are blocked from this chat');
    }

    // Rate limiting
    const recentMessages = await this.prisma.message.findMany({
      where: {
        chatId,
        senderId: userId,
        createdAt: { gte: new Date(Date.now() - RATE_LIMITS.MESSAGES_PER_CHAT.windowMs) },
      },
      select: { createdAt: true },
    });

    if (recentMessages.length >= RATE_LIMITS.MESSAGES_PER_CHAT.max) {
      throw new BadRequestException('Message limit reached. Please slow down.');
    }

    // Handle template messages
    let content = data.content;
    if (data.type === 'template' && data.templateType) {
      const template = MESSAGE_TEMPLATES.find((t) => t.key === data.templateType);
      if (template) {
        content = template.text.en;
      }
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content,
        type: data.type || 'text',
        templateType: data.templateType,
        images: data.images || [],
        status: 'sent',
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update chat last message time
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async markAsRead(userId: string, chatId: string) {
    await this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        readBy: { isEmpty: true },
      },
      data: {
        readBy: { push: userId },
        status: 'read',
      },
    });

    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { success: true };
  }

  async blockUser(userId: string, chatId: string) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant) {
      throw new NotFoundException('Chat not found');
    }

    // Block the other participant
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    const otherParticipant = chat.participants.find((p) => p.userId !== userId);
    if (otherParticipant) {
      await this.prisma.chatParticipant.update({
        where: { id: otherParticipant.id },
        data: { isBlocked: true },
      });
    }

    return { success: true };
  }

  async unblockUser(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const otherParticipant = chat.participants.find((p) => p.userId !== userId);
    if (otherParticipant) {
      await this.prisma.chatParticipant.update({
        where: { id: otherParticipant.id },
        data: { isBlocked: false },
      });
    }

    return { success: true };
  }

  async muteChat(userId: string, chatId: string, muted: boolean) {
    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { isMuted: muted },
    });

    return { success: true, muted };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        chat: {
          participants: { some: { userId, isBlocked: false, isMuted: false } },
        },
        senderId: { not: userId },
        readBy: { has: userId },
      },
    });

    return { count };
  }

  async syncOfflineMessages(userId: string, messages: any[]) {
    const results = [];

    for (const msgData of messages) {
      try {
        const message = await this.sendMessage(userId, msgData.chatId, {
          content: msgData.content,
          type: msgData.type,
          images: msgData.images,
        });
        results.push({
          localId: msgData.localId,
          serverId: message.id,
          status: 'synced',
        });
      } catch (error) {
        results.push({
          localId: msgData.localId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return results;
  }

  async getMessageTemplates() {
    return MESSAGE_TEMPLATES;
  }
}
