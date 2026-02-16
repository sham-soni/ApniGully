import { Module } from '@nestjs/common';
import { RWAService } from './rwa.service';
import { RWAController } from './rwa.controller';

@Module({
  controllers: [RWAController],
  providers: [RWAService],
  exports: [RWAService],
})
export class RWAModule {}
