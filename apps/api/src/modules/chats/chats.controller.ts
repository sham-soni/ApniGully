import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateChatDto,
  SendMessageDto,
  MessagesQueryDto,
  SyncMessagesDto,
} from './dto/chats.dto';
import { PaginationDto } from '../users/dto/users.dto';

@ApiTags('chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or get existing chat' })
  async createChat(@Request() req: any, @Body() dto: CreateChatDto) {
    return this.chatsService.createOrGetChat(
      req.user.id,
      dto.participantId,
      dto.type || 'direct',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats' })
  async getChats(@Request() req: any, @Query() query: PaginationDto) {
    return this.chatsService.getChats(req.user.id, query.page, query.limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread messages count' })
  async getUnreadCount(@Request() req: any) {
    return this.chatsService.getUnreadCount(req.user.id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get message templates' })
  async getTemplates() {
    return this.chatsService.getMessageTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by ID' })
  async getChat(@Request() req: any, @Param('id') id: string) {
    return this.chatsService.getChatById(req.user.id, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  async getMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.chatsService.getMessages(
      req.user.id,
      id,
      query.page,
      query.limit,
      query.before,
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatsService.sendMessage(req.user.id, id, dto);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.chatsService.markAsRead(req.user.id, id);
  }

  @Put(':id/block')
  @ApiOperation({ summary: 'Block user in chat' })
  async blockUser(@Request() req: any, @Param('id') id: string) {
    return this.chatsService.blockUser(req.user.id, id);
  }

  @Put(':id/unblock')
  @ApiOperation({ summary: 'Unblock user in chat' })
  async unblockUser(@Request() req: any, @Param('id') id: string) {
    return this.chatsService.unblockUser(req.user.id, id);
  }

  @Put(':id/mute')
  @ApiOperation({ summary: 'Mute or unmute chat' })
  async muteChat(
    @Request() req: any,
    @Param('id') id: string,
    @Body('muted') muted: boolean,
  ) {
    return this.chatsService.muteChat(req.user.id, id, muted);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync offline messages' })
  async syncMessages(@Request() req: any, @Body() dto: SyncMessagesDto) {
    return this.chatsService.syncOfflineMessages(req.user.id, dto.messages);
  }
}
