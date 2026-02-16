import { Module } from '@nestjs/common';
import { SmartHomeService } from './smart-home.service';
import { SmartHomeController } from './smart-home.controller';

@Module({
  controllers: [SmartHomeController],
  providers: [SmartHomeService],
  exports: [SmartHomeService],
})
export class SmartHomeModule {}
