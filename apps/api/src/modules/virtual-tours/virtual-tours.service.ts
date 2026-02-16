import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VirtualToursService {
  constructor(private prisma: PrismaService) {}

  async addTour(
    userId: string,
    rentalId: string,
    data: {
      type: '360_photo' | 'video' | '3d_model';
      url: string;
      thumbnailUrl?: string;
      roomName?: string;
    },
  ) {
    // Verify ownership
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: rentalId },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    if (rental.userId !== userId) {
      throw new ForbiddenException('You can only add tours to your own rentals');
    }

    // Get current max order
    const maxOrder = await this.prisma.virtualTour.aggregate({
      where: { rentalId },
      _max: { order: true },
    });

    return this.prisma.virtualTour.create({
      data: {
        rentalId,
        type: data.type,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        roomName: data.roomName,
        order: (maxOrder._max.order || 0) + 1,
      },
    });
  }

  async getTours(rentalId: string) {
    return this.prisma.virtualTour.findMany({
      where: { rentalId },
      orderBy: { order: 'asc' },
    });
  }

  async updateTour(userId: string, tourId: string, data: any) {
    const tour = await this.prisma.virtualTour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: tour.rentalId },
    });

    if (rental?.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.virtualTour.update({
      where: { id: tourId },
      data,
    });
  }

  async deleteTour(userId: string, tourId: string) {
    const tour = await this.prisma.virtualTour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: tour.rentalId },
    });

    if (rental?.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    await this.prisma.virtualTour.delete({
      where: { id: tourId },
    });

    return { success: true };
  }

  async trackView(tourId: string) {
    await this.prisma.virtualTour.update({
      where: { id: tourId },
      data: { viewCount: { increment: 1 } },
    });

    return { success: true };
  }

  async reorderTours(userId: string, rentalId: string, tourIds: string[]) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: rentalId },
    });

    if (!rental || rental.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Update order for each tour
    for (let i = 0; i < tourIds.length; i++) {
      await this.prisma.virtualTour.update({
        where: { id: tourIds[i] },
        data: { order: i + 1 },
      });
    }

    return { success: true };
  }

  // Tour Bookings
  async bookTour(
    userId: string,
    data: {
      rentalId: string;
      type: 'in_person' | 'video_call';
      scheduledAt: string;
      duration?: number;
      notes?: string;
    },
  ) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: data.rentalId },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    if (rental.userId === userId) {
      throw new BadRequestException('Cannot book your own rental');
    }

    // Check for scheduling conflicts
    const scheduledDate = new Date(data.scheduledAt);
    const duration = data.duration || 30;
    const endTime = new Date(scheduledDate.getTime() + duration * 60 * 1000);

    const conflict = await this.prisma.tourBooking.findFirst({
      where: {
        rentalId: data.rentalId,
        status: { in: ['pending', 'confirmed'] },
        scheduledAt: {
          gte: new Date(scheduledDate.getTime() - 30 * 60 * 1000),
          lte: endTime,
        },
      },
    });

    if (conflict) {
      throw new BadRequestException('This time slot is not available');
    }

    const booking = await this.prisma.tourBooking.create({
      data: {
        rentalId: data.rentalId,
        userId,
        ownerId: rental.userId,
        type: data.type,
        scheduledAt: scheduledDate,
        duration,
        notes: data.notes,
        status: 'pending',
      },
    });

    // Notify owner
    const visitor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: rental.userId,
        type: 'tour_booking',
        title: 'New Tour Booking',
        body: `${visitor?.name} wants to view your property`,
        data: { bookingId: booking.id, rentalId: rental.id },
      },
    });

    return booking;
  }

  async getMyBookings(userId: string, type: 'visitor' | 'owner' | 'all') {
    let where: any = {};

    if (type === 'visitor') {
      where = { userId };
    } else if (type === 'owner') {
      where = { ownerId: userId };
    } else {
      where = { OR: [{ userId }, { ownerId: userId }] };
    }

    const bookings = await this.prisma.tourBooking.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });

    // Get rental details
    const rentalIds = [...new Set(bookings.map(b => b.rentalId))];
    const rentals = await this.prisma.rentalListing.findMany({
      where: { id: { in: rentalIds } },
      include: {
        post: { select: { title: true, content: true, images: true } },
      },
    });

    const rentalMap = new Map(rentals.map(r => [r.id, r]));

    // Get user details
    const userIds = [...new Set(bookings.flatMap(b => [b.userId, b.ownerId]))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, phone: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return bookings.map(b => ({
      ...b,
      rental: rentalMap.get(b.rentalId),
      visitor: userMap.get(b.userId),
      owner: userMap.get(b.ownerId),
      isOwner: b.ownerId === userId,
    }));
  }

  async getRentalBookings(userId: string, rentalId: string) {
    const rental = await this.prisma.rentalListing.findUnique({
      where: { id: rentalId },
    });

    if (!rental || rental.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const bookings = await this.prisma.tourBooking.findMany({
      where: { rentalId },
      orderBy: { scheduledAt: 'desc' },
    });

    // Get visitor details
    const userIds = bookings.map(b => b.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, phone: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return bookings.map(b => ({
      ...b,
      visitor: userMap.get(b.userId),
    }));
  }

  async confirmBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.tourBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can confirm');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking cannot be confirmed');
    }

    const updated = await this.prisma.tourBooking.update({
      where: { id: bookingId },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    // Notify visitor
    const owner = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'booking_confirmed',
        title: 'Tour Confirmed',
        body: `${owner?.name} confirmed your tour booking`,
        data: { bookingId },
      },
    });

    return updated;
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await this.prisma.tourBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId && booking.ownerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const updated = await this.prisma.tourBooking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    // Notify other party
    const otherUserId = booking.userId === userId ? booking.ownerId : booking.userId;
    const canceller = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'booking_cancelled',
        title: 'Tour Cancelled',
        body: `${canceller?.name} cancelled the tour booking`,
        data: { bookingId },
      },
    });

    return updated;
  }

  async completeBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.tourBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.ownerId !== userId && booking.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Booking must be confirmed first');
    }

    return this.prisma.tourBooking.update({
      where: { id: bookingId },
      data: { status: 'completed' },
    });
  }

  async rescheduleBooking(userId: string, bookingId: string, newDate: string) {
    const booking = await this.prisma.tourBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId && booking.ownerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be rescheduled');
    }

    const updated = await this.prisma.tourBooking.update({
      where: { id: bookingId },
      data: {
        scheduledAt: new Date(newDate),
        status: 'pending',
        confirmedAt: null,
      },
    });

    // Notify other party
    const otherUserId = booking.userId === userId ? booking.ownerId : booking.userId;
    const rescheduler = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'booking_rescheduled',
        title: 'Tour Rescheduled',
        body: `${rescheduler?.name} rescheduled the tour`,
        data: { bookingId, newDate },
      },
    });

    return updated;
  }
}
