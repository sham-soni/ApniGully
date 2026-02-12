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
import { HelpersService } from './helpers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateHelperProfileDto,
  UpdateHelperProfileDto,
  HelperFiltersDto,
  BookingRequestDto,
} from './dto/helpers.dto';
import { PaginationDto } from '../users/dto/users.dto';

@ApiTags('helpers')
@Controller('helpers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HelpersController {
  constructor(private helpersService: HelpersService) {}

  @Post()
  @ApiOperation({ summary: 'Create helper profile' })
  async createProfile(@Request() req: any, @Body() dto: CreateHelperProfileDto) {
    return this.helpersService.createProfile(req.user.id, dto.neighborhoodId, dto as any);
  }

  @Get('neighborhood/:neighborhoodId')
  @ApiOperation({ summary: 'Get helpers in neighborhood' })
  async getHelpers(
    @Param('neighborhoodId') neighborhoodId: string,
    @Query() filters: HelperFiltersDto,
  ) {
    return this.helpersService.getHelpers(neighborhoodId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get helper by ID' })
  async findById(@Param('id') id: string) {
    return this.helpersService.findById(id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update my helper profile' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateHelperProfileDto) {
    return this.helpersService.updateProfile(req.user.id, dto as any);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get helper reviews' })
  async getReviews(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.helpersService.getReviews(id, query.page, query.limit);
  }

  @Get(':id/available')
  @ApiOperation({ summary: 'Check if helper is available now' })
  async isAvailable(@Param('id') id: string) {
    return { available: await this.helpersService.isAvailableNow(id) };
  }

  @Post(':id/book')
  @ApiOperation({ summary: 'Request a booking' })
  async requestBooking(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: BookingRequestDto,
  ) {
    return this.helpersService.requestBooking(req.user.id, id, dto);
  }
}
