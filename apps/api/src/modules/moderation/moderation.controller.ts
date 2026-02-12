import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles, MODERATION_ROLES } from '../auth/roles.guard';
import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, Min, MaxLength } from 'class-validator';
import { ModerationActionType } from '@prisma/client';

class TakeActionDto {
  @IsUUID() neighborhoodId: string;
  @IsEnum(['post', 'comment', 'user']) targetType: 'post' | 'comment' | 'user';
  @IsUUID() targetId: string;
  @IsEnum(ModerationActionType) action: ModerationActionType;
  @IsString() @MaxLength(500) reason: string;
  @IsNumber() @Min(1) @IsOptional() duration?: number;
}

@ApiTags('moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MODERATION_ROLES)
@ApiBearerAuth()
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Post('action')
  @ApiOperation({ summary: 'Take moderation action' })
  takeAction(@Request() req: any, @Body() dto: TakeActionDto) {
    return this.moderationService.takeAction(req.user.id, dto.neighborhoodId, dto);
  }

  @Get('actions/:neighborhoodId')
  @ApiOperation({ summary: 'Get moderation actions' })
  getActions(@Param('neighborhoodId') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.moderationService.getActions(id, +page, +limit);
  }

  @Get('audit/:neighborhoodId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get audit logs' })
  getAuditLogs(@Param('neighborhoodId') id: string, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.moderationService.getAuditLogs(id, +page, +limit);
  }
}
