import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
      });
    }

    // Convert paisa to rupees for display
    return {
      ...wallet,
      balanceRupees: wallet.balance / 100,
    };
  }

  async getWalletTransactions(userId: string, page: number, limit: number) {
    const wallet = await this.getOrCreateWallet(userId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      data: transactions.map(t => ({
        ...t,
        amountRupees: t.amount / 100,
        balanceAfterRupees: t.balanceAfter / 100,
      })),
      pagination: { page, limit, total, hasMore: skip + transactions.length < total },
    };
  }

  async addToWallet(userId: string, amountRupees: number, method: 'upi' | 'card' | 'netbanking') {
    if (amountRupees < 10) {
      throw new BadRequestException('Minimum amount is ₹10');
    }
    if (amountRupees > 100000) {
      throw new BadRequestException('Maximum amount is ₹1,00,000');
    }

    const amount = Math.round(amountRupees * 100); // Convert to paisa

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        payerId: userId,
        payeeId: userId, // Self - adding to wallet
        amount,
        method: method as PaymentMethod,
        status: 'pending',
        description: 'Add money to wallet',
        externalId: `ADD_${randomBytes(8).toString('hex').toUpperCase()}`,
      },
    });

    // In production, this would integrate with Razorpay/PayU
    // For now, we'll return payment details for UPI/card flow
    return {
      paymentId: payment.id,
      orderId: payment.externalId,
      amount: amountRupees,
      method,
      upiLink: method === 'upi' ? this.generateUPIDeepLink(amountRupees, payment.externalId!) : null,
    };
  }

  private generateUPIDeepLink(amount: number, orderId: string): string {
    // In production, use actual merchant VPA
    const merchantVPA = 'apnigully@upi';
    const merchantName = 'ApniGully';
    return `upi://pay?pa=${merchantVPA}&pn=${merchantName}&am=${amount}&tn=AddMoney-${orderId}&cu=INR`;
  }

  async initiatePayment(
    payerId: string,
    payeeId: string,
    amountRupees: number,
    method: 'upi' | 'wallet' | 'card' | 'netbanking',
    description?: string,
    taskId?: string,
  ) {
    if (payerId === payeeId) {
      throw new BadRequestException('Cannot pay yourself');
    }

    if (amountRupees < 1) {
      throw new BadRequestException('Minimum amount is ₹1');
    }

    const amount = Math.round(amountRupees * 100); // Convert to paisa

    // Verify payee exists
    const payee = await this.prisma.user.findUnique({
      where: { id: payeeId },
      select: { id: true, name: true },
    });

    if (!payee) {
      throw new NotFoundException('Payee not found');
    }

    // If wallet payment, check balance
    if (method === 'wallet') {
      const wallet = await this.getOrCreateWallet(payerId);
      if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        payerId,
        payeeId,
        amount,
        method: method as PaymentMethod,
        status: 'pending',
        description,
        taskId,
        externalId: `PAY_${randomBytes(8).toString('hex').toUpperCase()}`,
      },
    });

    // If wallet payment, process immediately
    if (method === 'wallet') {
      return this.processWalletPayment(payment.id);
    }

    return {
      paymentId: payment.id,
      orderId: payment.externalId,
      amount: amountRupees,
      payee: payee.name,
      method,
      upiLink: method === 'upi' ? this.generateP2PUPILink(payeeId, amountRupees, payment.externalId!) : null,
    };
  }

  private async generateP2PUPILink(payeeId: string, amount: number, orderId: string): Promise<string> {
    // In a real app, you'd fetch the payee's UPI ID
    // For now, return a placeholder
    return `upi://pay?pa=user@upi&am=${amount}&tn=Payment-${orderId}&cu=INR`;
  }

  private async processWalletPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Start transaction
    return this.prisma.$transaction(async (tx) => {
      // Deduct from payer's wallet
      const payerWallet = await tx.wallet.findUnique({
        where: { userId: payment.payerId },
      });

      if (!payerWallet || payerWallet.balance < payment.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.wallet.update({
        where: { id: payerWallet.id },
        data: { balance: { decrement: payment.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: payerWallet.id,
          type: 'debit',
          amount: payment.amount,
          description: payment.description || 'Payment sent',
          referenceId: payment.id,
          balanceAfter: payerWallet.balance - payment.amount,
        },
      });

      // Credit to payee's wallet
      let payeeWallet = await tx.wallet.findUnique({
        where: { userId: payment.payeeId },
      });

      if (!payeeWallet) {
        payeeWallet = await tx.wallet.create({
          data: { userId: payment.payeeId },
        });
      }

      await tx.wallet.update({
        where: { id: payeeWallet.id },
        data: { balance: { increment: payment.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: payeeWallet.id,
          type: 'credit',
          amount: payment.amount,
          description: payment.description || 'Payment received',
          referenceId: payment.id,
          balanceAfter: payeeWallet.balance + payment.amount,
        },
      });

      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      return {
        ...updatedPayment,
        amountRupees: updatedPayment.amount / 100,
      };
    });
  }

  async generateUPILink(userId: string, amountRupees: number, description: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a unique payment request ID
    const requestId = `REQ_${randomBytes(8).toString('hex').toUpperCase()}`;

    // In production, integrate with payment gateway to create a payment link
    return {
      requestId,
      amount: amountRupees,
      description,
      upiLink: `upi://pay?pa=apnigully@upi&pn=ApniGully&am=${amountRupees}&tn=${encodeURIComponent(description)}&cu=INR`,
      qrData: `upi://pay?pa=apnigully@upi&pn=ApniGully&am=${amountRupees}&tn=${encodeURIComponent(description)}&cu=INR`,
      expiresIn: 3600, // 1 hour
    };
  }

  async verifyUPIPayment(paymentId: string, upiRef: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'completed') {
      return { status: 'already_completed', payment };
    }

    // In production, verify with payment gateway
    // For now, assume verification passes
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'completed',
        externalRef: upiRef,
        completedAt: new Date(),
      },
    });

    // If this was an add-to-wallet payment, credit the wallet
    if (payment.payerId === payment.payeeId) {
      const wallet = await this.getOrCreateWallet(payment.payerId);
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: payment.amount } },
      });

      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount: payment.amount,
          description: 'Money added via UPI',
          referenceId: paymentId,
          balanceAfter: wallet.balance + payment.amount,
        },
      });
    }

    return {
      status: 'verified',
      payment: {
        ...updatedPayment,
        amountRupees: updatedPayment.amount / 100,
      },
    };
  }

  async confirmPayment(paymentId: string, externalRef?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'completed') {
      return { status: 'already_completed', payment };
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'completed',
        externalRef,
        completedAt: new Date(),
      },
    });
  }

  async cancelPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerId !== userId) {
      throw new ForbiddenException('You can only cancel your own payments');
    }

    if (payment.status !== 'pending') {
      throw new BadRequestException('Can only cancel pending payments');
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'cancelled' },
    });
  }

  async refundPayment(paymentId: string, userId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerId !== userId) {
      throw new ForbiddenException('You can only request refund for your own payments');
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException('Can only refund completed payments');
    }

    // In production, process refund through payment gateway
    // For wallet payments, reverse the transaction
    if (payment.method === 'wallet') {
      return this.prisma.$transaction(async (tx) => {
        // Deduct from payee's wallet
        const payeeWallet = await tx.wallet.findUnique({
          where: { userId: payment.payeeId },
        });

        if (payeeWallet && payeeWallet.balance >= payment.amount) {
          await tx.wallet.update({
            where: { id: payeeWallet.id },
            data: { balance: { decrement: payment.amount } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: payeeWallet.id,
              type: 'debit',
              amount: payment.amount,
              description: `Refund: ${reason}`,
              referenceId: paymentId,
              balanceAfter: payeeWallet.balance - payment.amount,
            },
          });
        }

        // Credit back to payer's wallet
        const payerWallet = await tx.wallet.findUnique({
          where: { userId: payment.payerId },
        });

        if (payerWallet) {
          await tx.wallet.update({
            where: { id: payerWallet.id },
            data: { balance: { increment: payment.amount } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: payerWallet.id,
              type: 'credit',
              amount: payment.amount,
              description: `Refund received: ${reason}`,
              referenceId: paymentId,
              balanceAfter: payerWallet.balance + payment.amount,
            },
          });
        }

        return tx.payment.update({
          where: { id: paymentId },
          data: { status: 'refunded' },
        });
      });
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'refunded',
        metadata: { refundReason: reason },
      },
    });
  }

  async getPaymentHistory(userId: string, type: 'sent' | 'received' | 'all', page: number, limit: number) {
    const skip = (page - 1) * limit;

    let where: any = {};
    if (type === 'sent') {
      where = { payerId: userId };
    } else if (type === 'received') {
      where = { payeeId: userId };
    } else {
      where = { OR: [{ payerId: userId }, { payeeId: userId }] };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Get user names
    const userIds = [...new Set(payments.flatMap(p => [p.payerId, p.payeeId]))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      data: payments.map(p => ({
        ...p,
        amountRupees: p.amount / 100,
        payer: userMap.get(p.payerId),
        payee: userMap.get(p.payeeId),
        direction: p.payerId === userId ? 'sent' : 'received',
      })),
      pagination: { page, limit, total, hasMore: skip + payments.length < total },
    };
  }

  async getPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerId !== userId && payment.payeeId !== userId) {
      throw new ForbiddenException('You can only view your own payments');
    }

    // Get user details
    const [payer, payee] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payment.payerId },
        select: { id: true, name: true, avatar: true },
      }),
      this.prisma.user.findUnique({
        where: { id: payment.payeeId },
        select: { id: true, name: true, avatar: true },
      }),
    ]);

    return {
      ...payment,
      amountRupees: payment.amount / 100,
      payer,
      payee,
      direction: payment.payerId === userId ? 'sent' : 'received',
    };
  }

  async createEscrow(userId: string, taskId: string, amountRupees: number) {
    // Verify task exists and user is the requester
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, requesterId: true, providerId: true, agreedAmount: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.requesterId !== userId) {
      throw new ForbiddenException('Only task requester can create escrow');
    }

    const amount = Math.round(amountRupees * 100);

    // Check wallet balance
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Create escrow payment
    const payment = await this.prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          amount,
          description: 'Escrow hold for task',
          referenceId: taskId,
          balanceAfter: wallet.balance - amount,
        },
      });

      // Create payment in processing state (escrow)
      return tx.payment.create({
        data: {
          payerId: userId,
          payeeId: task.providerId,
          amount,
          method: 'wallet',
          status: 'processing', // Held in escrow
          description: 'Task payment (escrow)',
          taskId,
          externalId: `ESC_${randomBytes(8).toString('hex').toUpperCase()}`,
        },
      });
    });

    return {
      ...payment,
      amountRupees: payment.amount / 100,
      status: 'escrow_held',
    };
  }

  async releaseEscrow(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.payerId !== userId) {
      throw new ForbiddenException('Only payer can release escrow');
    }

    if (payment.status !== 'processing') {
      throw new BadRequestException('Payment is not in escrow');
    }

    // Release to payee
    return this.prisma.$transaction(async (tx) => {
      let payeeWallet = await tx.wallet.findUnique({
        where: { userId: payment.payeeId },
      });

      if (!payeeWallet) {
        payeeWallet = await tx.wallet.create({
          data: { userId: payment.payeeId },
        });
      }

      await tx.wallet.update({
        where: { id: payeeWallet.id },
        data: { balance: { increment: payment.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: payeeWallet.id,
          type: 'credit',
          amount: payment.amount,
          description: 'Task payment released',
          referenceId: payment.id,
          balanceAfter: payeeWallet.balance + payment.amount,
        },
      });

      return tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });
    });
  }

  async handleRazorpayWebhook(body: any) {
    // In production, verify webhook signature
    const event = body.event;
    const payload = body.payload?.payment?.entity;

    if (!payload) {
      return { status: 'ignored' };
    }

    const orderId = payload.order_id || payload.notes?.orderId;

    if (!orderId) {
      return { status: 'no_order_id' };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { externalId: orderId },
    });

    if (!payment) {
      return { status: 'payment_not_found' };
    }

    if (event === 'payment.captured' || event === 'payment.authorized') {
      await this.verifyUPIPayment(payment.id, payload.id);
      return { status: 'success' };
    }

    if (event === 'payment.failed') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: payload.error_description,
        },
      });
      return { status: 'failed' };
    }

    return { status: 'unhandled_event' };
  }
}
