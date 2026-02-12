import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateRentalDto,
  UpdateRentalDto,
  RentalFiltersDto,
  ScheduleVisitDto,
} from './dto/rentals.dto';

@ApiTags('rentals')
@Controller('rentals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RentalsController {
  constructor(private rentalsService: RentalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a rental listing' })
  async create(@Request() req: any, @Body() dto: CreateRentalDto) {
    return this.rentalsService.create(req.user.id, dto.neighborhoodId, dto);
  }

  @Get('neighborhood/:neighborhoodId')
  @ApiOperation({ summary: 'Get rental listings for a neighborhood' })
  async getListings(
    @Param('neighborhoodId') neighborhoodId: string,
    @Query() filters: RentalFiltersDto,
  ) {
    return this.rentalsService.getListings(neighborhoodId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rental by ID' })
  async findById(@Param('id') id: string) {
    return this.rentalsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a rental listing' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRentalDto,
  ) {
    return this.rentalsService.update(req.user.id, id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update rental status' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: 'available' | 'rented' | 'pending',
  ) {
    return this.rentalsService.updateStatus(req.user.id, id, status);
  }

  @Post(':id/schedule-visit')
  @ApiOperation({ summary: 'Request to schedule a visit' })
  async scheduleVisit(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ScheduleVisitDto,
  ) {
    return this.rentalsService.scheduleVisit(req.user.id, id, dto.message);
  }

  @Post('parse')
  @ApiOperation({ summary: 'Parse rental text to extract fields' })
  async parseText(@Body('text') text: string) {
    return this.rentalsService.parseRentalText(text);
  }
}
