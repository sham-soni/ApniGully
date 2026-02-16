import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user gamification profile' })
  async getProfile(@Request() req: any) {
    return this.gamificationService.getProfile(req.user.id);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get all available badges' })
  async getAllBadges() {
    return this.gamificationService.getAllBadges();
  }

  @Get('badges/my')
  @ApiOperation({ summary: 'Get user earned badges' })
  async getMyBadges(@Request() req: any) {
    return this.gamificationService.getUserBadges(req.user.id);
  }

  @Get('leaderboard/:neighborhoodId')
  @ApiOperation({ summary: 'Get neighborhood leaderboard' })
  async getLeaderboard(
    @Param('neighborhoodId') neighborhoodId: string,
    @Query('type') type: 'karma' | 'streak' | 'helpful' = 'karma',
    @Query('limit') limit: number = 20,
  ) {
    return this.gamificationService.getLeaderboard(neighborhoodId, type, limit);
  }

  @Get('karma/history')
  @ApiOperation({ summary: 'Get karma transaction history' })
  async getKarmaHistory(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.gamificationService.getKarmaHistory(req.user.id, page, limit);
  }

  @Get('challenges')
  @ApiOperation({ summary: 'Get active challenges' })
  async getActiveChallenges(@Request() req: any) {
    return this.gamificationService.getActiveChallenges(req.user.id);
  }

  @Post('challenges/:challengeId/join')
  @ApiOperation({ summary: 'Join a challenge' })
  async joinChallenge(
    @Request() req: any,
    @Param('challengeId') challengeId: string,
  ) {
    return this.gamificationService.joinChallenge(req.user.id, challengeId);
  }

  @Post('daily-checkin')
  @ApiOperation({ summary: 'Daily check-in for streak' })
  async dailyCheckin(@Request() req: any) {
    return this.gamificationService.dailyCheckin(req.user.id);
  }

  @Get('level-progress')
  @ApiOperation({ summary: 'Get level progress details' })
  async getLevelProgress(@Request() req: any) {
    return this.gamificationService.getLevelProgress(req.user.id);
  }

  @Post('referral')
  @ApiOperation({ summary: 'Track referral' })
  async trackReferral(
    @Request() req: any,
    @Body() body: { referredUserId: string },
  ) {
    return this.gamificationService.trackReferral(req.user.id, body.referredUserId);
  }
}
