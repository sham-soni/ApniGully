import { Module } from '@nestjs/common';
import { VirtualToursService } from './virtual-tours.service';
import { VirtualToursController } from './virtual-tours.controller';

@Module({
  controllers: [VirtualToursController],
  providers: [VirtualToursService],
  exports: [VirtualToursService],
})
export class VirtualToursModule {}
