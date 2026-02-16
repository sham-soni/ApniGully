import { Module } from '@nestjs/common';
import { AIFeedService } from './ai-feed.service';
import { AIFeedController } from './ai-feed.controller';

@Module({
  controllers: [AIFeedController],
  providers: [AIFeedService],
  exports: [AIFeedService],
})
export class AIFeedModule {}
