import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID, MaxLength } from 'class-validator';

class CreateAlertDto {
  @IsUUID() neighborhoodId: string;
  @IsString() @MaxLength(200) title: string;
  @IsString() @MaxLength(2000) content: string;
  @IsNumber() @IsOptional() latitude?: number;
  @IsNumber() @IsOptional() longitude?: number;
}

class CheckInDto {
  @IsBoolean() isSafe: boolean;
  @IsString() @MaxLength(500) @IsOptional() message?: string;
}

@ApiTags('safety')
@Controller('safety')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SafetyController {
  constructor(private safetyService: SafetyService) {}

  @Post('alert')
  @ApiOperation({ summary: 'Create safety alert' })
  createAlert(@Request() req: any, @Body() dto: CreateAlertDto) {
    return this.safetyService.createAlert(req.user.id, dto.neighborhoodId, dto);
  }

  @Get('alerts/:neighborhoodId')
  @ApiOperation({ summary: 'Get active alerts' })
  getAlerts(@Param('neighborhoodId') id: string) {
    return this.safetyService.getActiveAlerts(id);
  }

  @Post('alerts/:id/check-in')
  @ApiOperation({ summary: 'Check in on alert' })
  checkIn(@Request() req: any, @Param('id') id: string, @Body() dto: CheckInDto) {
    return this.safetyService.checkIn(req.user.id, id, dto.isSafe, dto.message);
  }

  @Put('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve alert' })
  resolveAlert(@Request() req: any, @Param('id') id: string) {
    return this.safetyService.resolveAlert(req.user.id, id);
  }

  @Get('alerts/:id/check-ins')
  @ApiOperation({ summary: 'Get check-ins for alert' })
  getCheckIns(@Param('id') id: string) {
    return this.safetyService.getCheckIns(id);
  }
}
