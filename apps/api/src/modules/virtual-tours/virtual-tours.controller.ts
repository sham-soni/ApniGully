import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VirtualToursService } from './virtual-tours.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('virtual-tours')
@Controller('virtual-tours')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VirtualToursController {
  constructor(private virtualToursService: VirtualToursService) {}

  @Post('rental/:rentalId')
  @ApiOperation({ summary: 'Add virtual tour to rental' })
  async addTour(
    @Request() req: any,
    @Param('rentalId') rentalId: string,
    @Body() body: {
      type: '360_photo' | 'video' | '3d_model';
      url: string;
      thumbnailUrl?: string;
      roomName?: string;
    },
  ) {
    return this.virtualToursService.addTour(req.user.id, rentalId, body);
  }

  @Get('rental/:rentalId')
  @ApiOperation({ summary: 'Get virtual tours for rental' })
  async getTours(@Param('rentalId') rentalId: string) {
    return this.virtualToursService.getTours(rentalId);
  }

  @Put(':tourId')
  @ApiOperation({ summary: 'Update tour' })
  async updateTour(
    @Request() req: any,
    @Param('tourId') tourId: string,
    @Body() body: Partial<{
      roomName: string;
      order: number;
      thumbnailUrl: string;
    }>,
  ) {
    return this.virtualToursService.updateTour(req.user.id, tourId, body);
  }

  @Delete(':tourId')
  @ApiOperation({ summary: 'Delete tour' })
  async deleteTour(@Request() req: any, @Param('tourId') tourId: string) {
    return this.virtualToursService.deleteTour(req.user.id, tourId);
  }

  @Post(':tourId/view')
  @ApiOperation({ summary: 'Track tour view' })
  async trackView(@Param('tourId') tourId: string) {
    return this.virtualToursService.trackView(tourId);
  }

  @Put('rental/:rentalId/reorder')
  @ApiOperation({ summary: 'Reorder tours' })
  async reorderTours(
    @Request() req: any,
    @Param('rentalId') rentalId: string,
    @Body() body: { tourIds: string[] },
  ) {
    return this.virtualToursService.reorderTours(req.user.id, rentalId, body.tourIds);
  }

  // Tour Bookings
  @Post('bookings')
  @ApiOperation({ summary: 'Book a tour' })
  async bookTour(
    @Request() req: any,
    @Body() body: {
      rentalId: string;
      type: 'in_person' | 'video_call';
      scheduledAt: string;
      duration?: number;
      notes?: string;
    },
  ) {
    return this.virtualToursService.bookTour(req.user.id, body);
  }

  @Get('bookings/my')
  @ApiOperation({ summary: 'Get my tour bookings' })
  async getMyBookings(
    @Request() req: any,
    @Query('type') type: 'visitor' | 'owner' | 'all' = 'all',
  ) {
    return this.virtualToursService.getMyBookings(req.user.id, type);
  }

  @Get('bookings/rental/:rentalId')
  @ApiOperation({ summary: 'Get bookings for rental' })
  async getRentalBookings(
    @Request() req: any,
    @Param('rentalId') rentalId: string,
  ) {
    return this.virtualToursService.getRentalBookings(req.user.id, rentalId);
  }

  @Put('bookings/:bookingId/confirm')
  @ApiOperation({ summary: 'Confirm booking' })
  async confirmBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
  ) {
    return this.virtualToursService.confirmBooking(req.user.id, bookingId);
  }

  @Put('bookings/:bookingId/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  async cancelBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body() body: { reason?: string },
  ) {
    return this.virtualToursService.cancelBooking(req.user.id, bookingId, body.reason);
  }

  @Put('bookings/:bookingId/complete')
  @ApiOperation({ summary: 'Mark booking as completed' })
  async completeBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
  ) {
    return this.virtualToursService.completeBooking(req.user.id, bookingId);
  }

  @Put('bookings/:bookingId/reschedule')
  @ApiOperation({ summary: 'Reschedule booking' })
  async rescheduleBooking(
    @Request() req: any,
    @Param('bookingId') bookingId: string,
    @Body() body: { scheduledAt: string },
  ) {
    return this.virtualToursService.rescheduleBooking(req.user.id, bookingId, body.scheduledAt);
  }
}
