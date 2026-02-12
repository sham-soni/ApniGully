import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
        provider: { select: { id: true, name: true, avatar: true } },
        helperProfile: { select: { id: true, skills: true } },
        shop: { select: { id: true, name: true } },
        chat: true,
        reviews: true,
      },
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.requesterId !== userId && task.providerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    return task;
  }

  async getUserTasks(userId: string, role: 'requester' | 'provider', status?: TaskStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = role === 'requester' ? { requesterId: userId } : { providerId: userId };
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, avatar: true } },
          provider: { select: { id: true, name: true, avatar: true } },
          helperProfile: { select: { skills: true } },
          shop: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data: tasks, pagination: { page, limit, total, hasMore: skip + tasks.length < total } };
  }

  async updateStatus(userId: string, taskId: string, status: TaskStatus) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!task) throw new NotFoundException('Task not found');
    if (task.requesterId !== userId && task.providerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Validate status transitions
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      pending: ['accepted', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[task.status].includes(status)) {
      throw new BadRequestException(`Cannot transition from ${task.status} to ${status}`);
    }

    // Provider accepts/starts, requester can only cancel
    if (['accepted', 'in_progress'].includes(status) && task.providerId !== userId) {
      throw new ForbiddenException('Only provider can accept/start tasks');
    }

    // Both can mark as completed
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    // Send review prompt when completed
    if (status === 'completed' && !task.reviewPromptSent) {
      await this.sendReviewPrompt(taskId);
    }

    return updated;
  }

  async sendReviewPrompt(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { chat: true },
    });

    if (!task || !task.chat) return;

    // Create system message prompting for review
    await this.prisma.message.create({
      data: {
        chatId: task.chat.id,
        senderId: task.providerId, // System acts as provider
        content: 'Task completed! Please leave a review to help the community.',
        type: 'system',
      },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: { reviewPromptSent: true },
    });
  }

  async setAgreedAmount(userId: string, taskId: string, amount: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!task) throw new NotFoundException('Task not found');
    if (task.requesterId !== userId && task.providerId !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { agreedAmount: amount },
    });
  }

  async canReview(userId: string, taskId: string): Promise<boolean> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { reviews: { where: { userId } } },
    });

    if (!task) return false;
    if (task.status !== 'completed') return false;
    if (task.requesterId !== userId) return false;
    if (task.reviews.length > 0) return false;

    return true;
  }
}
