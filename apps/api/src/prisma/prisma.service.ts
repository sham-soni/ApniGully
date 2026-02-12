import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in correct order to respect foreign keys
    const tablesToClean = [
      'AuditLog',
      'SafeCheckIn',
      'SafetyAlert',
      'Offer',
      'DigestPreference',
      'Notification',
      'ModerationAction',
      'Report',
      'Review',
      'Task',
      'Message',
      'ChatParticipant',
      'Chat',
      'Endorsement',
      'Shop',
      'HelperProfile',
      'RentalListing',
      'SavedPost',
      'Reaction',
      'Comment',
      'Post',
      'GroupMember',
      'MicroGroup',
      'Membership',
      'Building',
      'OtpRequest',
      'User',
      'Neighborhood',
    ];

    for (const table of tablesToClean) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
  }
}
