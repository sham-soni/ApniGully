import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DigestService } from './digest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsEnum, IsBoolean, IsString, IsOptional, Matches } from 'class-validator';
import { DigestFrequency } from '@prisma/client';

class UpdateDigestPreferencesDto {
  @IsEnum(DigestFrequency) @IsOptional() frequency?: DigestFrequency;
  @IsBoolean() @IsOptional() includeAlerts?: boolean;
  @IsBoolean() @IsOptional() includeRecommendations?: boolean;
  @IsBoolean() @IsOptional() includeRentals?: boolean;
  @IsString() @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/) @IsOptional() preferredTime?: string;
}

@ApiTags('digest')
@Controller('digest')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DigestController {
  constructor(private digestService: DigestService) {}

  @Get('preferences/:neighborhoodId')
  @ApiOperation({ summary: 'Get digest preferences' })
  getPreferences(@Request() req: any, @Param('neighborhoodId') id: string) {
    return this.digestService.getPreferences(req.user.id, id);
  }

  @Put('preferences/:neighborhoodId')
  @ApiOperation({ summary: 'Update digest preferences' })
  updatePreferences(@Request() req: any, @Param('neighborhoodId') id: string, @Body() dto: UpdateDigestPreferencesDto) {
    return this.digestService.updatePreferences(req.user.id, id, dto);
  }

  @Get('preview/:neighborhoodId')
  @ApiOperation({ summary: 'Preview digest' })
  previewDigest(@Param('neighborhoodId') id: string) {
    return this.digestService.generateDigest(id, 'daily');
  }
}
