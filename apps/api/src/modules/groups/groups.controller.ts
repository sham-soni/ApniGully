import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { GroupType } from '@prisma/client';

class CreateGroupDto {
  @IsUUID() neighborhoodId: string;
  @IsString() @MaxLength(100) name: string;
  @IsString() @MaxLength(500) @IsOptional() description?: string;
  @IsEnum(GroupType) type: GroupType;
  @IsBoolean() @IsOptional() isPrivate?: boolean;
  @IsUUID() @IsOptional() buildingId?: string;
}

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a group' })
  create(@Request() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(req.user.id, dto.neighborhoodId, dto);
  }

  @Get('neighborhood/:neighborhoodId')
  @ApiOperation({ summary: 'Get groups in neighborhood' })
  getGroups(@Request() req: any, @Param('neighborhoodId') id: string) {
    return this.groupsService.getGroups(id, req.user.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a group' })
  join(@Request() req: any, @Param('id') id: string) {
    return this.groupsService.join(req.user.id, id);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a group' })
  leave(@Request() req: any, @Param('id') id: string) {
    return this.groupsService.leave(req.user.id, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get group members' })
  getMembers(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.groupsService.getMembers(id, +page, +limit);
  }
}
