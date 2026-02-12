import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NeighborhoodsModule } from './modules/neighborhoods/neighborhoods.module';
import { PostsModule } from './modules/posts/posts.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { HelpersModule } from './modules/helpers/helpers.module';
import { ShopsModule } from './modules/shops/shops.module';
import { ChatsModule } from './modules/chats/chats.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { DigestModule } from './modules/digest/digest.module';
import { UploadModule } from './modules/upload/upload.module';
import { SafetyModule } from './modules/safety/safety.module';
import { GroupsModule } from './modules/groups/groups.module';
import { OffersModule } from './modules/offers/offers.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { HealthModule } from './modules/health/health.module';
import { PollsModule } from './modules/polls/polls.module';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    NeighborhoodsModule,
    PostsModule,
    RentalsModule,
    HelpersModule,
    ShopsModule,
    ChatsModule,
    TasksModule,
    ReviewsModule,
    ReportsModule,
    ModerationModule,
    NotificationsModule,
    SearchModule,
    DigestModule,
    UploadModule,
    SafetyModule,
    GroupsModule,
    OffersModule,
    WebsocketModule,
    HealthModule,
    PollsModule,
    EventsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
