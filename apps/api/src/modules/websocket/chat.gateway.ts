import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user's chat rooms
      const chats = await this.prisma.chatParticipant.findMany({
        where: { userId },
        select: { chatId: true },
      });

      for (const chat of chats) {
        client.join(`chat:${chat.chatId}`);
      }

      // Update user status
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      });

      console.log(`User ${userId} connected via socket ${client.id}`);
    } catch (error) {
      console.error('Socket auth error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;

    // Verify participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId } },
    });

    if (!participant) {
      return { error: 'Not a participant' };
    }

    client.join(`chat:${data.chatId}`);
    return { success: true };
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      chatId: string;
      content: string;
      type?: string;
      images?: string[];
    },
  ) {
    const userId = client.data.userId;

    // Verify participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId } },
    });

    if (!participant || participant.isBlocked) {
      return { error: 'Not authorized' };
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: userId,
        content: data.content,
        type: data.type || 'text',
        images: data.images || [],
        status: 'sent',
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update chat
    await this.prisma.chat.update({
      where: { id: data.chatId },
      data: { lastMessageAt: new Date() },
    });

    // Broadcast to chat room
    this.server.to(`chat:${data.chatId}`).emit('new_message', message);

    // Send push notification to offline users
    const otherParticipants = await this.prisma.chatParticipant.findMany({
      where: { chatId: data.chatId, userId: { not: userId }, isMuted: false },
      include: { user: true },
    });

    for (const p of otherParticipants) {
      if (!this.userSockets.has(p.userId)) {
        // User is offline
        console.log(`Push to ${p.userId}: New message`);
      }
    }

    return { success: true, message };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    client.to(`chat:${data.chatId}`).emit('user_typing', {
      userId,
      chatId: data.chatId,
      isTyping: data.isTyping,
    });
    return { success: true };
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;

    await this.prisma.message.updateMany({
      where: {
        chatId: data.chatId,
        senderId: { not: userId },
        readBy: { isEmpty: true },
      },
      data: {
        readBy: { push: userId },
        status: 'read',
      },
    });

    // Notify sender
    client.to(`chat:${data.chatId}`).emit('messages_read', {
      chatId: data.chatId,
      readBy: userId,
    });

    return { success: true };
  }

  // Utility method to send to specific user
  sendToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }

  // Broadcast to neighborhood
  broadcastToNeighborhood(neighborhoodId: string, event: string, data: any) {
    this.server.to(`neighborhood:${neighborhoodId}`).emit(event, data);
  }
}
