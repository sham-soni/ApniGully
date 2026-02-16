import { Module } from '@nestjs/common';
import { SOSService } from './sos.service';
import { SOSController } from './sos.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [SOSController],
  providers: [SOSService],
  exports: [SOSService],
})
export class SOSModule {}
