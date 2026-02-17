import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CarpoolService {
  constructor(private prisma: PrismaService) {}

  // Create carpool listing
  async createListing(
    userId: string,
    data: {
      neighborhoodId: string;
      type: 'offer' | 'request';
      startLocation: string;
      startCoordinates?: { lat: number; lng: number };
      endLocation: string;
      endCoordinates?: { lat: number; lng: number };
      departureTime: string;
      isRecurring: boolean;
      recurringDays?: number[];
      availableSeats?: number;
      pricePerSeat?: number;
      vehicleType?: string;
      vehicleNumber?: string;
      preferences?: {
        womenOnly?: boolean;
        nonSmoking?: boolean;
        petsAllowed?: boolean;
        luggageAllowed?: boolean;
      };
      notes?: string;
    },
  ) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_neighborhoodId: { userId, neighborhoodId: data.neighborhoodId } },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Must be a member of the neighborhood');
    }

    const listing = await this.prisma.carpoolListing.create({
      data: {
        userId,
        neighborhoodId: data.neighborhoodId,
        type: data.type,
        startLocation: data.startLocation,
        startLat: data.startCoordinates?.lat,
        startLng: data.startCoordinates?.lng,
        endLocation: data.endLocation,
        endLat: data.endCoordinates?.lat,
        endLng: data.endCoordinates?.lng,
        departureTime: new Date(data.departureTime),
        isRecurring: data.isRecurring,
        recurringDays: data.recurringDays || [],
        availableSeats: data.availableSeats || 1,
        pricePerSeat: data.pricePerSeat ? Math.round(data.pricePerSeat * 100) : null,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        womenOnly: data.preferences?.womenOnly || false,
        nonSmoking: data.preferences?.nonSmoking || false,
        petsAllowed: data.preferences?.petsAllowed || false,
        luggageAllowed: data.preferences?.luggageAllowed || true,
        notes: data.notes,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, phone: true } },
      },
    });

    // Find matching requests/offers
    await this.findAndNotifyMatches(listing);

    return {
      ...listing,
      pricePerSeatRupees: listing.pricePerSeat ? listing.pricePerSeat / 100 : null,
    };
  }

  // Find and notify matches
  private async findAndNotifyMatches(listing: any) {
    const oppositeType = listing.type === 'offer' ? 'request' : 'offer';

    // Find listings with similar routes and times
    const potentialMatches = await this.prisma.carpoolListing.findMany({
      where: {
        neighborhoodId: listing.neighborhoodId,
        type: oppositeType,
        isActive: true,
        userId: { not: listing.userId },
        // Within 2 hours of departure time
        departureTime: {
          gte: new Date(listing.departureTime.getTime() - 2 * 60 * 60 * 1000),
          lte: new Date(listing.departureTime.getTime() + 2 * 60 * 60 * 1000),
        },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    for (const match of potentialMatches) {
      // Calculate route compatibility
      const score = this.calculateMatchScore(listing, match);

      if (score >= 70) {
        // Create match record
        const carpoolMatch = await this.prisma.carpoolMatch.create({
          data: {
            offerListingId: listing.type === 'offer' ? listing.id : match.id,
            requestListingId: listing.type === 'request' ? listing.id : match.id,
            score,
          },
        });

        // Notify both parties
        await Promise.all([
          this.prisma.notification.create({
            data: {
              userId: listing.userId,
              type: 'carpool_match',
              title: 'Carpool Match Found!',
              body: `${match.user.name} has a matching ${oppositeType} for your route`,
              data: { matchId: carpoolMatch.id },
            },
          }),
          this.prisma.notification.create({
            data: {
              userId: match.userId,
              type: 'carpool_match',
              title: 'Carpool Match Found!',
              body: `${listing.type === 'offer' ? 'A neighbor is offering' : 'A neighbor is looking for'} a ride on your route`,
              data: { matchId: carpoolMatch.id },
            },
          }),
        ]);
      }
    }
  }

  // Calculate match score between offer and request
  private calculateMatchScore(listing1: any, listing2: any): number {
    let score = 0;

    // Time proximity (max 30 points)
    const timeDiff = Math.abs(
      listing1.departureTime.getTime() - listing2.departureTime.getTime(),
    );
    const hoursDiff = timeDiff / (60 * 60 * 1000);
    score += Math.max(0, 30 - hoursDiff * 15);

    // Route proximity (max 40 points) - if coordinates available
    if (listing1.startLat && listing2.startLat) {
      const startDistance = this.calculateDistance(
        listing1.startLat, listing1.startLng,
        listing2.startLat, listing2.startLng,
      );
      score += Math.max(0, 20 - startDistance * 4); // 5km max for 20 points
    } else {
      score += 10; // Base points if no coordinates
    }

    if (listing1.endLat && listing2.endLat) {
      const endDistance = this.calculateDistance(
        listing1.endLat, listing1.endLng,
        listing2.endLat, listing2.endLng,
      );
      score += Math.max(0, 20 - endDistance * 4);
    } else {
      score += 10;
    }

    // Preference compatibility (max 30 points)
    let prefScore = 30;
    if (listing1.womenOnly !== listing2.womenOnly) prefScore -= 30; // Hard filter
    if (listing1.nonSmoking !== listing2.nonSmoking) prefScore -= 10;
    if (listing1.petsAllowed !== listing2.petsAllowed) prefScore -= 5;
    score += Math.max(0, prefScore);

    return Math.round(score);
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Search carpool listings
  async searchListings(
    userId: string,
    data: {
      neighborhoodId: string;
      type?: 'offer' | 'request';
      startLocation?: string;
      endLocation?: string;
      date?: string;
      minSeats?: number;
      womenOnly?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const page = data.page || 1;
    const limit = data.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      neighborhoodId: data.neighborhoodId,
      isActive: true,
    };

    if (data.type) {
      where.type = data.type;
    }

    if (data.startLocation) {
      where.startLocation = { contains: data.startLocation, mode: 'insensitive' };
    }

    if (data.endLocation) {
      where.endLocation = { contains: data.endLocation, mode: 'insensitive' };
    }

    if (data.date) {
      const date = new Date(data.date);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      where.departureTime = { gte: startOfDay, lte: endOfDay };
    } else {
      where.departureTime = { gte: new Date() };
    }

    if (data.minSeats) {
      where.availableSeats = { gte: data.minSeats };
    }

    if (data.womenOnly) {
      where.womenOnly = true;
    }

    const [listings, total] = await Promise.all([
      this.prisma.carpoolListing.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.carpoolListing.count({ where }),
    ]);

    return {
      data: listings.map(l => ({
        ...l,
        pricePerSeatRupees: l.pricePerSeat ? l.pricePerSeat / 100 : null,
      })),
      pagination: { page, limit, total, hasMore: skip + listings.length < total },
    };
  }

  // Get listing details
  async getListing(userId: string, listingId: string) {
    const listing = await this.prisma.carpoolListing.findUnique({
      where: { id: listingId },
      include: {
        user: { select: { id: true, name: true, avatar: true, phone: true } },
        rides: {
          include: {
            passengers: {
              include: {
                user: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return {
      ...listing,
      pricePerSeatRupees: listing.pricePerSeat ? listing.pricePerSeat / 100 : null,
      isOwner: listing.userId === userId,
    };
  }

  // Get my listings
  async getMyListings(userId: string, type?: string) {
    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    const listings = await this.prisma.carpoolListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return listings.map(l => ({
      ...l,
      pricePerSeatRupees: l.pricePerSeat ? l.pricePerSeat / 100 : null,
    }));
  }

  // Update listing
  async updateListing(userId: string, listingId: string, data: any) {
    const listing = await this.prisma.carpoolListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    const updateData: any = { ...data };
    if (data.departureTime) {
      updateData.departureTime = new Date(data.departureTime);
    }
    if (data.pricePerSeat !== undefined) {
      updateData.pricePerSeat = data.pricePerSeat ? Math.round(data.pricePerSeat * 100) : null;
    }

    return this.prisma.carpoolListing.update({
      where: { id: listingId },
      data: updateData,
    });
  }

  // Delete listing
  async deleteListing(userId: string, listingId: string) {
    const listing = await this.prisma.carpoolListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.prisma.carpoolListing.delete({
      where: { id: listingId },
    });

    return { success: true };
  }

  // Request to join ride
  async requestToJoin(
    userId: string,
    listingId: string,
    data: {
      seatsNeeded: number;
      pickupLocation?: string;
      dropLocation?: string;
      message?: string;
    },
  ) {
    const listing = await this.prisma.carpoolListing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.type !== 'offer') {
      throw new BadRequestException('Can only request to join ride offers');
    }

    if (listing.userId === userId) {
      throw new BadRequestException('Cannot request to join your own ride');
    }

    if (listing.availableSeats < data.seatsNeeded) {
      throw new BadRequestException('Not enough seats available');
    }

    // Check for existing pending request
    const existingRide = await this.prisma.carpoolRide.findFirst({
      where: {
        listingId,
        passengers: {
          some: {
            userId,
            status: 'pending',
          },
        },
      },
    });

    if (existingRide) {
      throw new BadRequestException('You already have a pending request for this ride');
    }

    // Find or create ride for this listing date
    let ride = await this.prisma.carpoolRide.findFirst({
      where: {
        listingId,
        rideDate: listing.departureTime,
      },
    });

    if (!ride) {
      ride = await this.prisma.carpoolRide.create({
        data: {
          listingId,
          driverId: listing.userId,
          rideDate: listing.departureTime,
        },
      });
    }

    // Create passenger request
    const passenger = await this.prisma.carpoolPassenger.create({
      data: {
        rideId: ride.id,
        userId,
        seatsBooked: data.seatsNeeded,
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        status: 'pending',
      },
    });

    // Notify driver
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'carpool_request',
        title: 'Carpool Request',
        body: `${requester?.name} wants to join your ride to ${listing.endLocation}`,
        data: { rideId: ride.id, passengerId: passenger.id },
      },
    });

    return { success: true, passengerId: passenger.id };
  }

  // Accept/reject passenger request
  async respondToRequest(
    userId: string,
    passengerId: string,
    action: 'accept' | 'reject',
  ) {
    const passenger = await this.prisma.carpoolPassenger.findUnique({
      where: { id: passengerId },
      include: {
        ride: { include: { listing: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!passenger) {
      throw new NotFoundException('Request not found');
    }

    if (passenger.ride.driverId !== userId) {
      throw new ForbiddenException('Only the driver can respond to requests');
    }

    if (passenger.status !== 'pending') {
      throw new BadRequestException('Request already processed');
    }

    const newStatus = action === 'accept' ? 'confirmed' : 'rejected';

    await this.prisma.carpoolPassenger.update({
      where: { id: passengerId },
      data: { status: newStatus },
    });

    // If accepted, update available seats
    if (action === 'accept') {
      await this.prisma.carpoolListing.update({
        where: { id: passenger.ride.listingId },
        data: {
          availableSeats: {
            decrement: passenger.seatsBooked,
          },
        },
      });
    }

    // Notify passenger
    await this.prisma.notification.create({
      data: {
        userId: passenger.userId,
        type: 'carpool_response',
        title: action === 'accept' ? 'Ride Confirmed!' : 'Ride Request Declined',
        body: action === 'accept'
          ? `Your carpool request for ${passenger.ride.listing.endLocation} has been accepted`
          : `Your carpool request has been declined`,
        data: { rideId: passenger.rideId },
      },
    });

    return { success: true };
  }

  // Get my rides (as passenger)
  async getMyRides(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const passengers = await this.prisma.carpoolPassenger.findMany({
      where,
      include: {
        ride: {
          include: {
            listing: true,
            driver: { select: { id: true, name: true, avatar: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return passengers.map(p => ({
      ...p,
      ride: {
        ...p.ride,
        listing: {
          ...p.ride.listing,
          pricePerSeatRupees: p.ride.listing.pricePerSeat ? p.ride.listing.pricePerSeat / 100 : null,
        },
      },
    }));
  }

  // Get rides I'm driving
  async getMyDrivingRides(userId: string) {
    const rides = await this.prisma.carpoolRide.findMany({
      where: { driverId: userId },
      include: {
        listing: true,
        passengers: {
          include: {
            user: { select: { id: true, name: true, avatar: true, phone: true } },
          },
        },
      },
      orderBy: { rideDate: 'desc' },
    });

    return rides;
  }

  // Start ride
  async startRide(userId: string, rideId: string) {
    const ride = await this.prisma.carpoolRide.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== userId) {
      throw new ForbiddenException('Only the driver can start the ride');
    }

    if (ride.status !== 'scheduled') {
      throw new BadRequestException('Ride cannot be started');
    }

    await this.prisma.carpoolRide.update({
      where: { id: rideId },
      data: {
        status: 'in_progress',
        actualDeparture: new Date(),
      },
    });

    // Notify passengers
    const passengers = await this.prisma.carpoolPassenger.findMany({
      where: { rideId, status: 'confirmed' },
    });

    await Promise.all(
      passengers.map(p =>
        this.prisma.notification.create({
          data: {
            userId: p.userId,
            type: 'ride_started',
            title: 'Ride Started',
            body: 'Your carpool ride has started!',
            data: { rideId },
          },
        }),
      ),
    );

    return { success: true };
  }

  // Complete ride
  async completeRide(userId: string, rideId: string) {
    const ride = await this.prisma.carpoolRide.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== userId) {
      throw new ForbiddenException('Only the driver can complete the ride');
    }

    await this.prisma.carpoolRide.update({
      where: { id: rideId },
      data: {
        status: 'completed',
        actualArrival: new Date(),
      },
    });

    // Update passenger statuses
    await this.prisma.carpoolPassenger.updateMany({
      where: { rideId, status: 'confirmed' },
      data: { status: 'completed' },
    });

    // Award karma to driver
    await this.prisma.karmaTransaction.create({
      data: {
        userId,
        amount: 15,
        reason: 'carpool_completed',
        sourceType: 'carpool_ride',
        sourceId: rideId,
      },
    });

    return { success: true };
  }

  // Cancel ride
  async cancelRide(userId: string, rideId: string, reason?: string) {
    const ride = await this.prisma.carpoolRide.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== userId) {
      throw new ForbiddenException('Only the driver can cancel the ride');
    }

    await this.prisma.carpoolRide.update({
      where: { id: rideId },
      data: {
        status: 'cancelled',
        cancelReason: reason,
      },
    });

    // Notify and refund passengers
    const passengers = await this.prisma.carpoolPassenger.findMany({
      where: { rideId, status: { in: ['pending', 'confirmed'] } },
    });

    await Promise.all(
      passengers.map(async p => {
        await this.prisma.carpoolPassenger.update({
          where: { id: p.id },
          data: { status: 'cancelled' },
        });

        await this.prisma.notification.create({
          data: {
            userId: p.userId,
            type: 'ride_cancelled',
            title: 'Ride Cancelled',
            body: reason || 'Your carpool ride has been cancelled',
            data: { rideId },
          },
        });
      }),
    );

    return { success: true };
  }

  // Rate ride
  async rateRide(
    userId: string,
    rideId: string,
    data: {
      rating: number;
      review?: string;
      isDriver: boolean;
    },
  ) {
    const ride = await this.prisma.carpoolRide.findUnique({
      where: { id: rideId },
      include: { passengers: true },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== 'completed') {
      throw new BadRequestException('Can only rate completed rides');
    }

    const isPassenger = ride.passengers.some(p => p.userId === userId && p.status === 'completed');
    const isDriver = ride.driverId === userId;

    if (!isPassenger && !isDriver) {
      throw new ForbiddenException('You were not part of this ride');
    }

    // Update rating on the ride
    if (isPassenger) {
      // Passenger rating the driver
      await this.prisma.carpoolRide.update({
        where: { id: rideId },
        data: {
          driverRating: data.rating,
          driverReview: data.review,
        },
      });
    } else {
      // Driver rating passengers (could be individual in a more complex system)
      await this.prisma.carpoolRide.update({
        where: { id: rideId },
        data: {
          passengerRating: data.rating,
          passengerReview: data.review,
        },
      });
    }

    return { success: true };
  }

  // Get matches
  async getMyMatches(userId: string) {
    const matches = await this.prisma.carpoolMatch.findMany({
      where: {
        OR: [
          { offerListing: { userId } },
          { requestListing: { userId } },
        ],
        status: 'pending',
      },
      include: {
        offerListing: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        requestListing: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return matches;
  }

  // Get popular routes
  async getPopularRoutes(neighborhoodId: string) {
    const routes = await this.prisma.carpoolListing.groupBy({
      by: ['startLocation', 'endLocation'],
      where: {
        neighborhoodId,
        isActive: true,
      },
      _count: true,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    return routes.map(r => ({
      startLocation: r.startLocation,
      endLocation: r.endLocation,
      count: r._count,
    }));
  }
}
