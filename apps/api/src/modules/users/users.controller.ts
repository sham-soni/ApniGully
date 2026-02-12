import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto, CreateEndorsementDto, PaginationDto, UpdateSettingsDto, BlockUserDto } from './dto/users.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Put('me/push-token')
  @ApiOperation({ summary: 'Update push notification token' })
  async updatePushToken(@Request() req: any, @Body('pushToken') pushToken: string) {
    return this.usersService.updatePushToken(req.user.id, pushToken);
  }

  @Get('me/trust-score')
  @ApiOperation({ summary: 'Get current user trust score breakdown' })
  async getMyTrustScore(@Request() req: any) {
    return this.usersService.getUserTrustScore(req.user.id);
  }

  @Get('me/activity')
  @ApiOperation({ summary: 'Get current user activity' })
  async getMyActivity(@Request() req: any, @Query() query: PaginationDto) {
    return this.usersService.getUserActivity(req.user.id, query.page, query.limit);
  }

  @Get('me/saved')
  @ApiOperation({ summary: 'Get saved posts' })
  async getSavedPosts(@Request() req: any, @Query() query: PaginationDto) {
    return this.usersService.getSavedPosts(req.user.id, query.page, query.limit);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(@Request() req: any) {
    return this.usersService.deleteAccount(req.user.id);
  }

  // Settings endpoints
  @Get('me/settings')
  @ApiOperation({ summary: 'Get user settings' })
  async getSettings(@Request() req: any) {
    return { data: await this.usersService.getSettings(req.user.id) };
  }

  @Put('me/settings')
  @ApiOperation({ summary: 'Update user settings' })
  async updateSettings(@Request() req: any, @Body() dto: UpdateSettingsDto) {
    return { data: await this.usersService.updateSettings(req.user.id, dto) };
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Partially update user settings' })
  async patchSettings(@Request() req: any, @Body() dto: UpdateSettingsDto) {
    return { data: await this.usersService.updateSettings(req.user.id, dto) };
  }

  // Blocked users endpoints
  @Get('me/blocked')
  @ApiOperation({ summary: 'Get blocked users list' })
  async getBlockedUsers(@Request() req: any) {
    const blockedUsers = await this.usersService.getBlockedUsers(req.user.id);
    return {
      data: blockedUsers.map(bu => ({
        id: bu.id,
        blockedUser: bu.blocked,
        createdAt: bu.createdAt,
      })),
    };
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: BlockUserDto,
  ) {
    return this.usersService.blockUser(req.user.id, id, dto?.reason);
  }

  @Delete(':id/block')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Request() req: any, @Param('id') id: string) {
    await this.usersService.unblockUser(req.user.id, id);
    return { success: true };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/trust-score')
  @ApiOperation({ summary: 'Get user trust score' })
  async getUserTrustScore(@Param('id') id: string) {
    return this.usersService.getUserTrustScore(id);
  }

  @Get(':id/endorsements')
  @ApiOperation({ summary: 'Get user endorsements' })
  async getEndorsements(@Param('id') id: string) {
    return this.usersService.getEndorsements(id);
  }

  @Post(':id/endorse')
  @ApiOperation({ summary: 'Endorse a user' })
  async endorseUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateEndorsementDto,
  ) {
    return this.usersService.createEndorsement(
      req.user.id,
      id,
      dto.type,
      dto.message,
    );
  }
}
