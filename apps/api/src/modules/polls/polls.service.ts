import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePollDto {
  postId: string;
  question: string;
  options: string[];
  allowMultiple?: boolean;
  showResults?: boolean;
  endsAt?: Date;
}

export interface VoteDto {
  optionIds: string[];
}

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  async createPoll(userId: string, data: CreatePollDto) {
    // Verify post ownership
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('Cannot create poll for another user\'s post');
    }

    // Check if poll already exists
    const existingPoll = await this.prisma.poll.findUnique({
      where: { postId: data.postId },
    });

    if (existingPoll) {
      throw new BadRequestException('Poll already exists for this post');
    }

    if (data.options.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }

    if (data.options.length > 10) {
      throw new BadRequestException('Poll cannot have more than 10 options');
    }

    return this.prisma.poll.create({
      data: {
        postId: data.postId,
        question: data.question,
        allowMultiple: data.allowMultiple || false,
        showResults: data.showResults ?? true,
        endsAt: data.endsAt,
        options: {
          create: data.options.map((text, index) => ({
            text,
            order: index,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getPoll(pollId: string, userId?: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        post: {
          select: {
            id: true,
            userId: true,
            neighborhoodId: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user has voted
    let userVotes: string[] = [];
    if (userId) {
      const votes = await this.prisma.pollVote.findMany({
        where: { pollId, userId },
        select: { optionId: true },
      });
      userVotes = votes.map((v) => v.optionId);
    }

    const hasVoted = userVotes.length > 0;

    // Calculate percentages
    const optionsWithStats = poll.options.map((option) => ({
      ...option,
      percentage:
        poll.totalVotes > 0
          ? Math.round((option.voteCount / poll.totalVotes) * 100)
          : 0,
      isSelected: userVotes.includes(option.id),
    }));

    return {
      ...poll,
      options: optionsWithStats,
      hasVoted,
      userVotes,
      isExpired: poll.endsAt ? new Date() > poll.endsAt : false,
    };
  }

  async vote(pollId: string, userId: string, optionIds: string[]) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (!poll.isActive) {
      throw new BadRequestException('Poll is no longer active');
    }

    if (poll.endsAt && new Date() > poll.endsAt) {
      throw new BadRequestException('Poll has ended');
    }

    // Validate options belong to this poll
    const validOptionIds = poll.options.map((o) => o.id);
    for (const optionId of optionIds) {
      if (!validOptionIds.includes(optionId)) {
        throw new BadRequestException('Invalid option');
      }
    }

    // Check if multiple votes allowed
    if (!poll.allowMultiple && optionIds.length > 1) {
      throw new BadRequestException('Multiple votes not allowed for this poll');
    }

    // Check if user already voted
    const existingVotes = await this.prisma.pollVote.findMany({
      where: { pollId, userId },
    });

    if (existingVotes.length > 0) {
      throw new BadRequestException('You have already voted on this poll');
    }

    // Create votes in transaction
    await this.prisma.$transaction(async (tx) => {
      // Create vote records
      await tx.pollVote.createMany({
        data: optionIds.map((optionId) => ({
          pollId,
          userId,
          optionId,
        })),
      });

      // Update vote counts
      for (const optionId of optionIds) {
        await tx.pollOption.update({
          where: { id: optionId },
          data: { voteCount: { increment: 1 } },
        });
      }

      // Update total votes (count as 1 vote per user, not per option)
      await tx.poll.update({
        where: { id: pollId },
        data: { totalVotes: { increment: 1 } },
      });
    });

    return this.getPoll(pollId, userId);
  }

  async removeVote(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (!poll.isActive) {
      throw new BadRequestException('Poll is no longer active');
    }

    const existingVotes = await this.prisma.pollVote.findMany({
      where: { pollId, userId },
    });

    if (existingVotes.length === 0) {
      throw new BadRequestException('You have not voted on this poll');
    }

    // Remove votes in transaction
    await this.prisma.$transaction(async (tx) => {
      // Decrement option vote counts
      for (const vote of existingVotes) {
        await tx.pollOption.update({
          where: { id: vote.optionId },
          data: { voteCount: { decrement: 1 } },
        });
      }

      // Delete vote records
      await tx.pollVote.deleteMany({
        where: { pollId, userId },
      });

      // Decrement total votes
      await tx.poll.update({
        where: { id: pollId },
        data: { totalVotes: { decrement: 1 } },
      });
    });

    return this.getPoll(pollId, userId);
  }

  async closePoll(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        post: {
          select: { userId: true },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.post.userId !== userId) {
      throw new ForbiddenException('Only the poll creator can close this poll');
    }

    return this.prisma.poll.update({
      where: { id: pollId },
      data: { isActive: false },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getPollByPostId(postId: string, userId?: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { postId },
    });

    if (!poll) {
      return null;
    }

    return this.getPoll(poll.id, userId);
  }
}
