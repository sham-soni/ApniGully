import { Module } from '@nestjs/common';
import { CallingService } from './calling.service';
import { CallingController } from './calling.controller';

@Module({
  controllers: [CallingController],
  providers: [CallingService],
  exports: [CallingService],
})
export class CallingModule {}
