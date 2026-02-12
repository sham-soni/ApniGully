import { Controller, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TaskStatus } from '@prisma/client';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my tasks as requester' })
  getMyTasks(@Request() req: any, @Query('status') status?: TaskStatus, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.tasksService.getUserTasks(req.user.id, 'requester', status, +page, +limit);
  }

  @Get('me/providing')
  @ApiOperation({ summary: 'Get tasks I am providing' })
  getProvidingTasks(@Request() req: any, @Query('status') status?: TaskStatus, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.tasksService.getUserTasks(req.user.id, 'provider', status, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findById(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.findById(id, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  updateStatus(@Request() req: any, @Param('id') id: string, @Body('status') status: TaskStatus) {
    return this.tasksService.updateStatus(req.user.id, id, status);
  }

  @Put(':id/amount')
  @ApiOperation({ summary: 'Set agreed amount' })
  setAmount(@Request() req: any, @Param('id') id: string, @Body('amount') amount: number) {
    return this.tasksService.setAgreedAmount(req.user.id, id, amount);
  }

  @Get(':id/can-review')
  @ApiOperation({ summary: 'Check if user can review task' })
  canReview(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.canReview(req.user.id, id);
  }
}
