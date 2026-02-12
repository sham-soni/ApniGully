import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NeighborhoodsService } from './neighborhoods.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles, MODERATION_ROLES } from '../auth/roles.guard';
import {
  CreateNeighborhoodDto,
  JoinNeighborhoodDto,
  CreateBuildingDto,
  SearchLocationDto,
  UpdateMemberRoleDto,
} from './dto/neighborhoods.dto';
import { PaginationDto } from '../users/dto/users.dto';

@ApiTags('neighborhoods')
@Controller('neighborhoods')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NeighborhoodsController {
  constructor(private neighborhoodsService: NeighborhoodsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new neighborhood' })
  async create(@Request() req: any, @Body() dto: CreateNeighborhoodDto) {
    return this.neighborhoodsService.create(req.user.id, dto);
  }

  @Get('search/location')
  @ApiOperation({ summary: 'Search neighborhoods by location' })
  async searchByLocation(@Query() query: SearchLocationDto) {
    return this.neighborhoodsService.searchByLocation(
      query.latitude,
      query.longitude,
      query.radiusKm,
    );
  }

  @Get('search/pincode/:pincode')
  @ApiOperation({ summary: 'Search neighborhoods by pincode' })
  async searchByPincode(@Param('pincode') pincode: string) {
    return this.neighborhoodsService.searchByPincode(pincode);
  }

  @Get('search/name')
  @ApiOperation({ summary: 'Search neighborhoods by name' })
  async searchByName(@Query('q') query: string) {
    return this.neighborhoodsService.searchByName(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get neighborhood by ID' })
  async findById(@Param('id') id: string) {
    return this.neighborhoodsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get neighborhood by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.neighborhoodsService.findBySlug(slug);
  }

  @Post('join/invite')
  @ApiOperation({ summary: 'Join neighborhood by invite code' })
  async joinByInvite(@Request() req: any, @Body() dto: JoinNeighborhoodDto) {
    return this.neighborhoodsService.joinByInviteCode(
      req.user.id,
      dto.inviteCode,
      dto.buildingId,
      dto.unit,
    );
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Request to join a neighborhood' })
  async requestJoin(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { buildingId?: string; unit?: string },
  ) {
    return this.neighborhoodsService.requestJoin(
      req.user.id,
      id,
      dto.buildingId,
      dto.unit,
    );
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a neighborhood' })
  async leave(@Request() req: any, @Param('id') id: string) {
    return this.neighborhoodsService.leaveNeighborhood(req.user.id, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get neighborhood members' })
  async getMembers(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.neighborhoodsService.getMembers(id, query.page, query.limit);
  }

  @Get(':id/members/pending')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Get pending member requests' })
  async getPendingMembers(@Param('id') id: string) {
    return this.neighborhoodsService.getPendingMembers(id);
  }

  @Put('members/:membershipId/approve')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Approve a pending member' })
  async approveMember(@Request() req: any, @Param('membershipId') membershipId: string) {
    return this.neighborhoodsService.approveMember(req.user.id, membershipId);
  }

  @Put('members/:membershipId/reject')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Reject a pending member' })
  async rejectMember(@Request() req: any, @Param('membershipId') membershipId: string) {
    return this.neighborhoodsService.rejectMember(req.user.id, membershipId);
  }

  @Put('members/:membershipId/role')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Request() req: any,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.neighborhoodsService.updateMemberRole(req.user.id, membershipId, dto.role);
  }

  @Get(':id/buildings')
  @ApiOperation({ summary: 'Get neighborhood buildings' })
  async getBuildings(@Param('id') id: string) {
    return this.neighborhoodsService.getBuildings(id);
  }

  @Post(':id/buildings')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Create a building' })
  async createBuilding(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateBuildingDto,
  ) {
    return this.neighborhoodsService.createBuilding(req.user.id, id, dto);
  }

  @Post(':id/invite-code/regenerate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Regenerate invite code' })
  async regenerateInviteCode(@Request() req: any, @Param('id') id: string) {
    return this.neighborhoodsService.regenerateInviteCode(req.user.id, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get neighborhood statistics' })
  async getStats(@Param('id') id: string) {
    return this.neighborhoodsService.getStats(id);
  }
}
