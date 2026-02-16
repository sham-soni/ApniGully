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
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create subscription' })
  async createSubscription(
    @Request() req: any,
    @Body() body: {
      providerId: string;
      helperProfileId?: string;
      shopId?: string;
      name: string;
      description?: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      timeSlot?: string;
      amount: number;
      startDate: string;
      endDate?: string;
    },
  ) {
    return this.subscriptionsService.createSubscription(req.user.id, body);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my subscriptions' })
  async getMySubscriptions(
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    return this.subscriptionsService.getMySubscriptions(req.user.id, status);
  }

  @Get('provider')
  @ApiOperation({ summary: 'Get subscriptions as provider' })
  async getProviderSubscriptions(
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    return this.subscriptionsService.getProviderSubscriptions(req.user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details' })
  async getSubscription(@Request() req: any, @Param('id') id: string) {
    return this.subscriptionsService.getSubscription(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription' })
  async updateSubscription(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      description: string;
      timeSlot: string;
      daysOfWeek: number[];
      amount: number;
    }>,
  ) {
    return this.subscriptionsService.updateSubscription(req.user.id, id, body);
  }

  @Put(':id/pause')
  @ApiOperation({ summary: 'Pause subscription' })
  async pauseSubscription(@Request() req: any, @Param('id') id: string) {
    return this.subscriptionsService.pauseSubscription(req.user.id, id);
  }

  @Put(':id/resume')
  @ApiOperation({ summary: 'Resume subscription' })
  async resumeSubscription(@Request() req: any, @Param('id') id: string) {
    return this.subscriptionsService.resumeSubscription(req.user.id, id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.subscriptionsService.cancelSubscription(req.user.id, id, body.reason);
  }

  // Occurrences
  @Get(':id/occurrences')
  @ApiOperation({ summary: 'Get subscription occurrences' })
  async getOccurrences(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.subscriptionsService.getOccurrences(req.user.id, id, page, limit);
  }

  @Get(':id/upcoming')
  @ApiOperation({ summary: 'Get upcoming occurrences' })
  async getUpcoming(
    @Request() req: any,
    @Param('id') id: string,
    @Query('limit') limit: number = 7,
  ) {
    return this.subscriptionsService.getUpcomingOccurrences(req.user.id, id, limit);
  }

  @Put('occurrences/:occurrenceId/complete')
  @ApiOperation({ summary: 'Mark occurrence as completed' })
  async completeOccurrence(
    @Request() req: any,
    @Param('occurrenceId') occurrenceId: string,
    @Body() body: { notes?: string },
  ) {
    return this.subscriptionsService.completeOccurrence(req.user.id, occurrenceId, body.notes);
  }

  @Put('occurrences/:occurrenceId/skip')
  @ApiOperation({ summary: 'Skip an occurrence' })
  async skipOccurrence(
    @Request() req: any,
    @Param('occurrenceId') occurrenceId: string,
    @Body() body: { reason?: string },
  ) {
    return this.subscriptionsService.skipOccurrence(req.user.id, occurrenceId, body.reason);
  }

  @Post('occurrences/:occurrenceId/rate')
  @ApiOperation({ summary: 'Rate an occurrence' })
  async rateOccurrence(
    @Request() req: any,
    @Param('occurrenceId') occurrenceId: string,
    @Body() body: { rating: number },
  ) {
    return this.subscriptionsService.rateOccurrence(req.user.id, occurrenceId, body.rating);
  }

  // Payments
  @Get(':id/payments')
  @ApiOperation({ summary: 'Get subscription payments' })
  async getPayments(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.subscriptionsService.getPayments(req.user.id, id, page, limit);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Make subscription payment' })
  async makePayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { paymentId: string },
  ) {
    return this.subscriptionsService.recordPayment(req.user.id, id, body.paymentId);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get subscription calendar' })
  async getCalendar(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.subscriptionsService.getCalendar(req.user.id, startDate, endDate);
  }
}
