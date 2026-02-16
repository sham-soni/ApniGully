import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PriceIndexService } from './price-index.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('price-index')
@Controller('price-index')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PriceIndexController {
  constructor(private priceIndexService: PriceIndexService) {}

  @Post('entries')
  @ApiOperation({ summary: 'Add price entry' })
  async addPriceEntry(
    @Request() req: any,
    @Body() body: {
      neighborhoodId: string;
      itemName: string;
      category: string;
      price: number;
      unit: string;
      shopName?: string;
      shopId?: string;
      notes?: string;
    },
  ) {
    return this.priceIndexService.addPriceEntry(req.user.id, body);
  }

  @Get('neighborhood/:neighborhoodId')
  @ApiOperation({ summary: 'Get price index for neighborhood' })
  async getPriceIndex(
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('category') category?: string,
  ) {
    return this.priceIndexService.getPriceIndex(neighborhoodId, category);
  }

  @Get('items/:itemId/history')
  @ApiOperation({ summary: 'Get item price history' })
  async getItemHistory(
    @Param('itemId') itemId: string,
    @Query('days') days: number = 30,
  ) {
    return this.priceIndexService.getItemPriceHistory(itemId, days);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare prices across neighborhoods' })
  async comparePrices(
    @Query('itemName') itemName: string,
    @Query('neighborhoodIds') neighborhoodIds: string,
  ) {
    const ids = neighborhoodIds.split(',');
    return this.priceIndexService.comparePrices(itemName, ids);
  }

  @Get('search/:neighborhoodId')
  @ApiOperation({ summary: 'Search items' })
  async searchItems(
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('q') query: string,
  ) {
    return this.priceIndexService.searchItems(neighborhoodId, query);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Set price alert' })
  async setPriceAlert(
    @Request() req: any,
    @Body() body: {
      priceItemId: string;
      alertType: 'below' | 'above';
      targetPrice: number;
    },
  ) {
    return this.priceIndexService.setPriceAlert(req.user.id, body);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get my price alerts' })
  async getMyAlerts(@Request() req: any) {
    return this.priceIndexService.getMyAlerts(req.user.id);
  }

  @Delete('alerts/:alertId')
  @ApiOperation({ summary: 'Delete price alert' })
  async deleteAlert(@Request() req: any, @Param('alertId') alertId: string) {
    return this.priceIndexService.deleteAlert(req.user.id, alertId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get price categories' })
  async getCategories() {
    return this.priceIndexService.getCategories();
  }

  @Get('trending/:neighborhoodId')
  @ApiOperation({ summary: 'Get trending prices' })
  async getTrendingPrices(@Param('neighborhoodId') neighborhoodId: string) {
    return this.priceIndexService.getTrendingPrices(neighborhoodId);
  }

  @Get('contributions')
  @ApiOperation({ summary: 'Get my price contributions' })
  async getMyContributions(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.priceIndexService.getMyContributions(req.user.id, page, limit);
  }

  @Post('basket')
  @ApiOperation({ summary: 'Calculate basket cost' })
  async getBasketCost(
    @Body() body: {
      neighborhoodId: string;
      itemIds: string[];
    },
  ) {
    return this.priceIndexService.getBasketCost(body.neighborhoodId, body.itemIds);
  }
}
