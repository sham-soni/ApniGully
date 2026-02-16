import { Module } from '@nestjs/common';
import { PriceIndexService } from './price-index.service';
import { PriceIndexController } from './price-index.controller';

@Module({
  controllers: [PriceIndexController],
  providers: [PriceIndexService],
  exports: [PriceIndexService],
})
export class PriceIndexModule {}
