import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet balance and info' })
  async getWallet(@Request() req: any) {
    return this.paymentsService.getOrCreateWallet(req.user.id);
  }

  @Get('wallet/transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  async getWalletTransactions(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.paymentsService.getWalletTransactions(req.user.id, page, limit);
  }

  @Post('wallet/add')
  @ApiOperation({ summary: 'Add money to wallet' })
  async addToWallet(
    @Request() req: any,
    @Body() body: { amount: number; method: 'upi' | 'card' | 'netbanking' },
  ) {
    return this.paymentsService.addToWallet(req.user.id, body.amount, body.method);
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a payment' })
  async initiatePayment(
    @Request() req: any,
    @Body() body: {
      payeeId: string;
      amount: number;
      method: 'upi' | 'wallet' | 'card' | 'netbanking';
      description?: string;
      taskId?: string;
    },
  ) {
    return this.paymentsService.initiatePayment(
      req.user.id,
      body.payeeId,
      body.amount,
      body.method,
      body.description,
      body.taskId,
    );
  }

  @Post('upi/generate')
  @ApiOperation({ summary: 'Generate UPI payment link' })
  async generateUPILink(
    @Request() req: any,
    @Body() body: { amount: number; description: string },
  ) {
    return this.paymentsService.generateUPILink(req.user.id, body.amount, body.description);
  }

  @Post('upi/verify')
  @ApiOperation({ summary: 'Verify UPI payment' })
  async verifyUPIPayment(
    @Request() req: any,
    @Body() body: { paymentId: string; upiRef: string },
  ) {
    return this.paymentsService.verifyUPIPayment(body.paymentId, body.upiRef);
  }

  @Post(':paymentId/confirm')
  @ApiOperation({ summary: 'Confirm payment completion' })
  async confirmPayment(
    @Request() req: any,
    @Param('paymentId') paymentId: string,
    @Body() body: { externalRef?: string },
  ) {
    return this.paymentsService.confirmPayment(paymentId, body.externalRef);
  }

  @Post(':paymentId/cancel')
  @ApiOperation({ summary: 'Cancel a payment' })
  async cancelPayment(
    @Request() req: any,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.cancelPayment(paymentId, req.user.id);
  }

  @Post(':paymentId/refund')
  @ApiOperation({ summary: 'Request refund' })
  async refundPayment(
    @Request() req: any,
    @Param('paymentId') paymentId: string,
    @Body() body: { reason: string },
  ) {
    return this.paymentsService.refundPayment(paymentId, req.user.id, body.reason);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  async getPaymentHistory(
    @Request() req: any,
    @Query('type') type: 'sent' | 'received' | 'all' = 'all',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.paymentsService.getPaymentHistory(req.user.id, type, page, limit);
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get payment details' })
  async getPayment(@Request() req: any, @Param('paymentId') paymentId: string) {
    return this.paymentsService.getPayment(paymentId, req.user.id);
  }

  @Post('escrow/create')
  @ApiOperation({ summary: 'Create escrow for task' })
  async createEscrow(
    @Request() req: any,
    @Body() body: { taskId: string; amount: number },
  ) {
    return this.paymentsService.createEscrow(req.user.id, body.taskId, body.amount);
  }

  @Post('escrow/:paymentId/release')
  @ApiOperation({ summary: 'Release escrow payment' })
  async releaseEscrow(
    @Request() req: any,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.releaseEscrow(paymentId, req.user.id);
  }

  @Post('webhook/razorpay')
  @ApiOperation({ summary: 'Razorpay webhook' })
  async razorpayWebhook(@Body() body: any) {
    return this.paymentsService.handleRazorpayWebhook(body);
  }
}
