import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RSVPStatus } from '@prisma/client';

export interface CreateEventDto {
  postId: string;
  title: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  startsAt: Date;
  endsAt?: Date;
  maxAttendees?: number;
  isOnline?: boolean;
  onlineLink?: string;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, data: CreateEventDto) {
    // Verify post ownership
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('Cannot create event for another user\'s post');
    }

    // Check if event already exists
    const existingEvent = await this.prisma.event.findUnique({
      where: { postId: data.postId },
    });

    if (existingEvent) {
      throw new BadRequestException('Event already exists for this post');
    }

    return this.prisma.event.create({
      data: {
        postId: data.postId,
        title: data.title,
        description: data.description,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        maxAttendees: data.maxAttendees,
        isOnline: data.isOnline || false,
        onlineLink: data.onlineLink,
      },
    });
  }

  async getEvent(eventId: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        post: {
          select: {
            id: true,
            userId: true,
            neighborhoodId: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Get user's RSVP status
    let userRsvp: RSVPStatus | null = null;
    if (userId) {
      const rsvp = event.rsvps.find((r) => r.userId === userId);
      userRsvp = rsvp?.status || null;
    }

    // Categorize RSVPs
    const going = event.rsvps.filter((r) => r.status === 'going');
    const maybe = event.rsvps.filter((r) => r.status === 'maybe');
    const notGoing = event.rsvps.filter((r) => r.status === 'not_going');

    return {
      ...event,
      userRsvp,
      goingCount: going.length,
      maybeCount: maybe.length,
      notGoingCount: notGoing.length,
      attendees: {
        going: going.map((r) => r.user),
        maybe: maybe.map((r) => r.user),
      },
      isPast: new Date() > event.startsAt,
      isFull: event.maxAttendees ? going.length >= event.maxAttendees : false,
    };
  }

  async rsvp(eventId: string, userId: string, status: RSVPStatus) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (new Date() > event.startsAt) {
      throw new BadRequestException('Cannot RSVP to past events');
    }

    // Check capacity for "going" status
    if (status === 'going' && event.maxAttendees) {
      const goingCount = await this.prisma.eventRSVP.count({
        where: { eventId, status: 'going', NOT: { userId } },
      });

      if (goingCount >= event.maxAttendees) {
        throw new BadRequestException('Event is at full capacity');
      }
    }

    // Upsert RSVP
    const rsvp = await this.prisma.eventRSVP.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      update: { status },
      create: { eventId, userId, status },
    });

    // Update attendee count
    const goingCount = await this.prisma.eventRSVP.count({
      where: { eventId, status: 'going' },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { attendeeCount: goingCount },
    });

    return this.getEvent(eventId, userId);
  }

  async removeRsvp(eventId: string, userId: string) {
    const rsvp = await this.prisma.eventRSVP.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });

    if (!rsvp) {
      throw new NotFoundException('RSVP not found');
    }

    await this.prisma.eventRSVP.delete({
      where: { id: rsvp.id },
    });

    // Update attendee count
    const goingCount = await this.prisma.eventRSVP.count({
      where: { eventId, status: 'going' },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { attendeeCount: goingCount },
    });

    return this.getEvent(eventId, userId);
  }

  async getUpcomingEvents(neighborhoodId: string, userId?: string, limit = 10) {
    const events = await this.prisma.event.findMany({
      where: {
        post: { neighborhoodId },
        startsAt: { gte: new Date() },
      },
      include: {
        post: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        rsvps: {
          where: { status: 'going' },
          take: 3,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { startsAt: 'asc' },
      take: limit,
    });

    return events.map((event) => ({
      ...event,
      goingCount: event.rsvps.length,
      attendeePreview: event.rsvps.map((r) => r.user),
    }));
  }

  async getEventByPostId(postId: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { postId },
    });

    if (!event) {
      return null;
    }

    return this.getEvent(event.id, userId);
  }
}
