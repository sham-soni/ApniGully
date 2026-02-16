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
import { CallingService } from './calling.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('calling')
@Controller('calling')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CallingController {
  constructor(private callingService: CallingService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a call' })
  async initiateCall(
    @Request() req: any,
    @Body() body: {
      receiverId: string;
      type: 'voice' | 'video';
    },
  ) {
    return this.callingService.initiateCall(req.user.id, body.receiverId, body.type);
  }

  @Put(':callId/accept')
  @ApiOperation({ summary: 'Accept incoming call' })
  async acceptCall(@Request() req: any, @Param('callId') callId: string) {
    return this.callingService.acceptCall(req.user.id, callId);
  }

  @Put(':callId/decline')
  @ApiOperation({ summary: 'Decline incoming call' })
  async declineCall(@Request() req: any, @Param('callId') callId: string) {
    return this.callingService.declineCall(req.user.id, callId);
  }

  @Put(':callId/end')
  @ApiOperation({ summary: 'End call' })
  async endCall(@Request() req: any, @Param('callId') callId: string) {
    return this.callingService.endCall(req.user.id, callId);
  }

  @Put(':callId/quality')
  @ApiOperation({ summary: 'Report call quality metrics' })
  async reportQuality(
    @Request() req: any,
    @Param('callId') callId: string,
    @Body() body: {
      audioQuality?: number;
      videoQuality?: number;
      latency?: number;
      packetLoss?: number;
    },
  ) {
    return this.callingService.reportQuality(callId, body);
  }

  @Get('token/:callId')
  @ApiOperation({ summary: 'Get WebRTC token for call' })
  async getToken(@Request() req: any, @Param('callId') callId: string) {
    return this.callingService.getCallToken(req.user.id, callId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get call history' })
  async getHistory(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.callingService.getCallHistory(req.user.id, page, limit);
  }

  @Get(':callId')
  @ApiOperation({ summary: 'Get call details' })
  async getCall(@Request() req: any, @Param('callId') callId: string) {
    return this.callingService.getCall(req.user.id, callId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active call' })
  async getActiveCall(@Request() req: any) {
    return this.callingService.getActiveCall(req.user.id);
  }

  @Post('ice-candidate')
  @ApiOperation({ summary: 'Exchange ICE candidate' })
  async exchangeICECandidate(
    @Request() req: any,
    @Body() body: {
      callId: string;
      candidate: any;
    },
  ) {
    return this.callingService.handleICECandidate(req.user.id, body.callId, body.candidate);
  }
}
