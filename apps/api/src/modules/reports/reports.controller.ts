import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles, MODERATION_ROLES } from '../auth/roles.guard';
import { IsString, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ReportStatus } from '@prisma/client';

class CreateReportDto {
  @IsEnum(['post', 'comment', 'user', 'message']) targetType: 'post' | 'comment' | 'user' | 'message';
  @IsUUID() targetId: string;
  @IsString() reason: string;
  @IsString() @MaxLength(1000) @IsOptional() description?: string;
}

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a report' })
  create(@Request() req: any, @Body() dto: CreateReportDto) {
    return this.reportsService.create(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my reports' })
  getMyReports(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reportsService.getUserReports(req.user.id, +page, +limit);
  }

  @Get('pending/:neighborhoodId')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Get pending reports (moderators)' })
  getPending(@Param('neighborhoodId') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reportsService.getPendingReports(id, +page, +limit);
  }

  @Put(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(...MODERATION_ROLES)
  @ApiOperation({ summary: 'Resolve a report (moderators)' })
  resolve(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: ReportStatus,
    @Body('resolution') resolution: string,
  ) {
    return this.reportsService.resolveReport(req.user.id, id, status, resolution);
  }
}
