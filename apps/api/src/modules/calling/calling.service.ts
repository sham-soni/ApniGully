import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallStatus, CallType } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class CallingService {
  constructor(private prisma: PrismaService) {}

  async initiateCall(callerId: string, receiverId: string, type: 'voice' | 'video') {
    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, pushToken: true },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if either party is already in a call
    const activeCall = await this.prisma.call.findFirst({
      where: {
        status: { in: ['initiated', 'ringing', 'connected'] },
        OR: [
          { callerId },
          { receiverId },
          { callerId: receiverId },
          { receiverId: callerId },
        ],
      },
    });

    if (activeCall) {
      throw new BadRequestException('User is already in a call');
    }

    // Check if user is blocked
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId: receiverId, blockedId: callerId },
          { userId: callerId, blockedId: receiverId },
        ],
      },
    });

    if (blocked) {
      throw new ForbiddenException('Cannot call this user');
    }

    // Generate room ID for WebRTC
    const roomId = `call_${randomBytes(8).toString('hex')}`;

    // Create call record
    const call = await this.prisma.call.create({
      data: {
        callerId,
        receiverId,
        type: type as CallType,
        status: 'initiated',
        roomId,
        startedAt: new Date(),
      },
    });

    // Get caller info for notification
    const caller = await this.prisma.user.findUnique({
      where: { id: callerId },
      select: { name: true, avatar: true },
    });

    // Create notification for receiver
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'incoming_call',
        title: type === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call',
        body: `${caller?.name} is calling...`,
        data: {
          callId: call.id,
          callType: type,
          callerId,
          callerName: caller?.name,
          callerAvatar: caller?.avatar,
          roomId,
        },
      },
    });

    // Update call status to ringing
    await this.prisma.call.update({
      where: { id: call.id },
      data: { status: 'ringing' },
    });

    return {
      ...call,
      receiver,
      roomId,
    };
  }

  async acceptCall(userId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.receiverId !== userId) {
      throw new ForbiddenException('You can only accept calls directed to you');
    }

    if (call.status !== 'ringing') {
      throw new BadRequestException('Call is no longer available');
    }

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'connected',
        connectedAt: new Date(),
      },
    });

    // Notify caller that call was accepted
    await this.prisma.notification.create({
      data: {
        userId: call.callerId,
        type: 'call_accepted',
        title: 'Call Connected',
        body: 'Your call has been answered',
        data: { callId, roomId: call.roomId },
      },
    });

    return updated;
  }

  async declineCall(userId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.receiverId !== userId) {
      throw new ForbiddenException('You can only decline calls directed to you');
    }

    if (!['initiated', 'ringing'].includes(call.status)) {
      throw new BadRequestException('Call cannot be declined');
    }

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'declined',
        endedAt: new Date(),
        endReason: 'declined',
      },
    });

    // Notify caller
    await this.prisma.notification.create({
      data: {
        userId: call.callerId,
        type: 'call_declined',
        title: 'Call Declined',
        body: 'Your call was declined',
        data: { callId },
      },
    });

    return updated;
  }

  async endCall(userId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.receiverId !== userId) {
      throw new ForbiddenException('You are not part of this call');
    }

    // Calculate duration
    let duration: number | undefined;
    if (call.connectedAt) {
      duration = Math.floor((Date.now() - call.connectedAt.getTime()) / 1000);
    }

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        duration,
        endReason: 'completed',
      },
    });

    // Notify other party
    const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
    await this.prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'call_ended',
        title: 'Call Ended',
        body: duration ? `Call duration: ${this.formatDuration(duration)}` : 'Call ended',
        data: { callId, duration },
      },
    });

    return updated;
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async reportQuality(callId: string, quality: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return this.prisma.call.update({
      where: { id: callId },
      data: {
        quality: {
          audioQuality: quality.audioQuality,
          videoQuality: quality.videoQuality,
          latency: quality.latency,
          packetLoss: quality.packetLoss,
          reportedAt: new Date(),
        },
      },
    });
  }

  async getCallToken(userId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.receiverId !== userId) {
      throw new ForbiddenException('You are not part of this call');
    }

    // In production, generate actual WebRTC/Twilio/Agora token
    // For now, return mock token structure
    return {
      roomId: call.roomId,
      token: `mock_token_${call.roomId}_${userId}`,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      callType: call.type,
    };
  }

  async getCallHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      this.prisma.call.findMany({
        where: {
          OR: [{ callerId: userId }, { receiverId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.call.count({
        where: {
          OR: [{ callerId: userId }, { receiverId: userId }],
        },
      }),
    ]);

    // Get user details
    const userIds = [...new Set(calls.flatMap(c => [c.callerId, c.receiverId]))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: calls.map(call => ({
        ...call,
        caller: userMap.get(call.callerId),
        receiver: userMap.get(call.receiverId),
        direction: call.callerId === userId ? 'outgoing' : 'incoming',
        durationFormatted: call.duration ? this.formatDuration(call.duration) : null,
      })),
      pagination: { page, limit, total, hasMore: skip + calls.length < total },
    };
  }

  async getCall(userId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.receiverId !== userId) {
      throw new ForbiddenException('You are not part of this call');
    }

    const [caller, receiver] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: call.callerId },
        select: { id: true, name: true, avatar: true },
      }),
      this.prisma.user.findUnique({
        where: { id: call.receiverId },
        select: { id: true, name: true, avatar: true },
      }),
    ]);

    return {
      ...call,
      caller,
      receiver,
      direction: call.callerId === userId ? 'outgoing' : 'incoming',
      durationFormatted: call.duration ? this.formatDuration(call.duration) : null,
    };
  }

  async getActiveCall(userId: string) {
    const call = await this.prisma.call.findFirst({
      where: {
        status: { in: ['initiated', 'ringing', 'connected'] },
        OR: [{ callerId: userId }, { receiverId: userId }],
      },
    });

    if (!call) {
      return null;
    }

    const [caller, receiver] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: call.callerId },
        select: { id: true, name: true, avatar: true },
      }),
      this.prisma.user.findUnique({
        where: { id: call.receiverId },
        select: { id: true, name: true, avatar: true },
      }),
    ]);

    return {
      ...call,
      caller,
      receiver,
      direction: call.callerId === userId ? 'outgoing' : 'incoming',
    };
  }

  async handleICECandidate(userId: string, callId: string, candidate: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.receiverId !== userId) {
      throw new ForbiddenException('You are not part of this call');
    }

    // In production, this would be handled via WebSocket
    // Store or forward the ICE candidate to the other peer
    const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;

    await this.prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'ice_candidate',
        title: '',
        body: '',
        data: { callId, candidate },
      },
    });

    return { success: true };
  }

  // Handle missed calls (called by cron job)
  async handleMissedCalls() {
    const timeout = 30 * 1000; // 30 seconds
    const threshold = new Date(Date.now() - timeout);

    const missedCalls = await this.prisma.call.findMany({
      where: {
        status: 'ringing',
        startedAt: { lt: threshold },
      },
    });

    for (const call of missedCalls) {
      await this.prisma.call.update({
        where: { id: call.id },
        data: {
          status: 'missed',
          endedAt: new Date(),
          endReason: 'no_answer',
        },
      });

      // Notify caller
      await this.prisma.notification.create({
        data: {
          userId: call.callerId,
          type: 'call_missed',
          title: 'Missed Call',
          body: 'Your call was not answered',
          data: { callId: call.id },
        },
      });

      // Notify receiver
      await this.prisma.notification.create({
        data: {
          userId: call.receiverId,
          type: 'call_missed',
          title: 'Missed Call',
          body: 'You missed a call',
          data: { callId: call.id },
        },
      });
    }

    return { processed: missedCalls.length };
  }
}
