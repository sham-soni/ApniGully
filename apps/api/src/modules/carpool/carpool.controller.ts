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
import { CarpoolService } from './carpool.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('carpool')
@Controller('carpool')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CarpoolController {
  constructor(private carpoolService: CarpoolService) {}

  @Post('listings')
  @ApiOperation({ summary: 'Create carpool listing' })
  async createListing(
    @Request() req: any,
    @Body() body: {
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
    return this.carpoolService.createListing(req.user.id, body);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search carpool listings' })
  async searchListings(
    @Request() req: any,
    @Query('neighborhoodId') neighborhoodId: string,
    @Query('type') type?: 'offer' | 'request',
    @Query('startLocation') startLocation?: string,
    @Query('endLocation') endLocation?: string,
    @Query('date') date?: string,
    @Query('minSeats') minSeats?: number,
    @Query('womenOnly') womenOnly?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.carpoolService.searchListings(req.user.id, {
      neighborhoodId,
      type,
      startLocation,
      endLocation,
      date,
      minSeats,
      womenOnly,
      page,
      limit,
    });
  }

  @Get('listings/my')
  @ApiOperation({ summary: 'Get my listings' })
  async getMyListings(@Request() req: any, @Query('type') type?: string) {
    return this.carpoolService.getMyListings(req.user.id, type);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get listing details' })
  async getListing(@Request() req: any, @Param('id') id: string) {
    return this.carpoolService.getListing(req.user.id, id);
  }

  @Put('listings/:id')
  @ApiOperation({ summary: 'Update listing' })
  async updateListing(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.carpoolService.updateListing(req.user.id, id, body);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Delete listing' })
  async deleteListing(@Request() req: any, @Param('id') id: string) {
    return this.carpoolService.deleteListing(req.user.id, id);
  }

  @Post('listings/:id/join')
  @ApiOperation({ summary: 'Request to join ride' })
  async requestToJoin(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      seatsNeeded: number;
      pickupLocation?: string;
      dropLocation?: string;
      message?: string;
    },
  ) {
    return this.carpoolService.requestToJoin(req.user.id, id, body);
  }

  @Put('passengers/:id/respond')
  @ApiOperation({ summary: 'Accept or reject passenger request' })
  async respondToRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { action: 'accept' | 'reject' },
  ) {
    return this.carpoolService.respondToRequest(req.user.id, id, body.action);
  }

  @Get('rides/passenger')
  @ApiOperation({ summary: 'Get my rides as passenger' })
  async getMyRides(@Request() req: any, @Query('status') status?: string) {
    return this.carpoolService.getMyRides(req.user.id, status);
  }

  @Get('rides/driver')
  @ApiOperation({ summary: 'Get rides I am driving' })
  async getMyDrivingRides(@Request() req: any) {
    return this.carpoolService.getMyDrivingRides(req.user.id);
  }

  @Put('rides/:id/start')
  @ApiOperation({ summary: 'Start ride' })
  async startRide(@Request() req: any, @Param('id') id: string) {
    return this.carpoolService.startRide(req.user.id, id);
  }

  @Put('rides/:id/complete')
  @ApiOperation({ summary: 'Complete ride' })
  async completeRide(@Request() req: any, @Param('id') id: string) {
    return this.carpoolService.completeRide(req.user.id, id);
  }

  @Put('rides/:id/cancel')
  @ApiOperation({ summary: 'Cancel ride' })
  async cancelRide(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.carpoolService.cancelRide(req.user.id, id, body.reason);
  }

  @Post('rides/:id/rate')
  @ApiOperation({ summary: 'Rate ride' })
  async rateRide(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      rating: number;
      review?: string;
      isDriver: boolean;
    },
  ) {
    return this.carpoolService.rateRide(req.user.id, id, body);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get my carpool matches' })
  async getMyMatches(@Request() req: any) {
    return this.carpoolService.getMyMatches(req.user.id);
  }

  @Get('routes/popular/:neighborhoodId')
  @ApiOperation({ summary: 'Get popular routes' })
  async getPopularRoutes(@Param('neighborhoodId') neighborhoodId: string) {
    return this.carpoolService.getPopularRoutes(neighborhoodId);
  }
}
