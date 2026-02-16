import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RWAService } from './rwa.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('rwa')
@Controller('rwa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RWAController {
  constructor(private rwaService: RWAService) {}

  // RWA Management
  @Post('create/:neighborhoodId')
  @ApiOperation({ summary: 'Create RWA for neighborhood' })
  async createRWA(
    @Request() req: any,
    @Param('neighborhoodId') neighborhoodId: string,
    @Body() body: {
      name: string;
      registrationNo?: string;
      address?: string;
      email?: string;
      phone?: string;
    },
  ) {
    return this.rwaService.createRWA(req.user.id, neighborhoodId, body);
  }

  @Get(':neighborhoodId')
  @ApiOperation({ summary: 'Get RWA details' })
  async getRWA(@Param('neighborhoodId') neighborhoodId: string) {
    return this.rwaService.getRWA(neighborhoodId);
  }

  @Put(':rwaId')
  @ApiOperation({ summary: 'Update RWA details' })
  async updateRWA(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Body() body: Partial<{
      name: string;
      registrationNo: string;
      address: string;
      email: string;
      phone: string;
    }>,
  ) {
    return this.rwaService.updateRWA(req.user.id, rwaId, body);
  }

  // Maintenance Dues
  @Post(':rwaId/dues')
  @ApiOperation({ summary: 'Create maintenance due' })
  async createDue(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Body() body: {
      userId: string;
      unit: string;
      amount: number;
      dueDate: string;
      description?: string;
    },
  ) {
    return this.rwaService.createMaintenanceDue(req.user.id, rwaId, body);
  }

  @Get(':rwaId/dues')
  @ApiOperation({ summary: 'Get all maintenance dues' })
  async getDues(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.rwaService.getMaintenanceDues(req.user.id, rwaId, status, page, limit);
  }

  @Get('dues/my')
  @ApiOperation({ summary: 'Get my maintenance dues' })
  async getMyDues(@Request() req: any) {
    return this.rwaService.getUserDues(req.user.id);
  }

  @Post('dues/:dueId/pay')
  @ApiOperation({ summary: 'Pay maintenance due' })
  async payDue(
    @Request() req: any,
    @Param('dueId') dueId: string,
    @Body() body: { paymentId: string },
  ) {
    return this.rwaService.markDuePaid(req.user.id, dueId, body.paymentId);
  }

  // Complaints
  @Post(':rwaId/complaints')
  @ApiOperation({ summary: 'File a complaint' })
  async fileComplaint(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Body() body: {
      category: string;
      title: string;
      description: string;
      images?: string[];
      priority?: string;
    },
  ) {
    return this.rwaService.fileComplaint(req.user.id, rwaId, body);
  }

  @Get(':rwaId/complaints')
  @ApiOperation({ summary: 'Get complaints' })
  async getComplaints(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.rwaService.getComplaints(req.user.id, rwaId, status, page, limit);
  }

  @Get('complaints/:complaintId')
  @ApiOperation({ summary: 'Get complaint details' })
  async getComplaint(@Param('complaintId') complaintId: string) {
    return this.rwaService.getComplaint(complaintId);
  }

  @Post('complaints/:complaintId/update')
  @ApiOperation({ summary: 'Add complaint update' })
  async addComplaintUpdate(
    @Request() req: any,
    @Param('complaintId') complaintId: string,
    @Body() body: { message: string; status?: string },
  ) {
    return this.rwaService.addComplaintUpdate(req.user.id, complaintId, body);
  }

  @Put('complaints/:complaintId/assign')
  @ApiOperation({ summary: 'Assign complaint' })
  async assignComplaint(
    @Request() req: any,
    @Param('complaintId') complaintId: string,
    @Body() body: { assignedTo: string },
  ) {
    return this.rwaService.assignComplaint(req.user.id, complaintId, body.assignedTo);
  }

  // Meetings
  @Post(':rwaId/meetings')
  @ApiOperation({ summary: 'Schedule a meeting' })
  async scheduleMeeting(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Body() body: {
      title: string;
      description?: string;
      agenda?: string;
      location?: string;
      isOnline?: boolean;
      onlineLink?: string;
      scheduledAt: string;
      duration?: number;
    },
  ) {
    return this.rwaService.scheduleMeeting(req.user.id, rwaId, body);
  }

  @Get(':rwaId/meetings')
  @ApiOperation({ summary: 'Get meetings' })
  async getMeetings(
    @Param('rwaId') rwaId: string,
    @Query('upcoming') upcoming: boolean = true,
  ) {
    return this.rwaService.getMeetings(rwaId, upcoming);
  }

  @Post('meetings/:meetingId/vote')
  @ApiOperation({ summary: 'Create vote for meeting' })
  async createVote(
    @Request() req: any,
    @Param('meetingId') meetingId: string,
    @Body() body: {
      question: string;
      options: string[];
      isAnonymous?: boolean;
      closesAt?: string;
    },
  ) {
    return this.rwaService.createMeetingVote(req.user.id, meetingId, body);
  }

  @Post('votes/:voteId/cast')
  @ApiOperation({ summary: 'Cast vote' })
  async castVote(
    @Request() req: any,
    @Param('voteId') voteId: string,
    @Body() body: { optionIndex: number },
  ) {
    return this.rwaService.castVote(req.user.id, voteId, body.optionIndex);
  }

  // Documents
  @Post(':rwaId/documents')
  @ApiOperation({ summary: 'Upload document' })
  async uploadDocument(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Body() body: {
      title: string;
      category: string;
      url: string;
      isPublic?: boolean;
    },
  ) {
    return this.rwaService.uploadDocument(req.user.id, rwaId, body);
  }

  @Get(':rwaId/documents')
  @ApiOperation({ summary: 'Get documents' })
  async getDocuments(
    @Param('rwaId') rwaId: string,
    @Query('category') category?: string,
  ) {
    return this.rwaService.getDocuments(rwaId, category);
  }

  // Announcements
  @Post(':rwaId/announcements')
  @ApiOperation({ summary: 'Create announcement' })
  async createAnnouncement(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Body() body: {
      title: string;
      content: string;
      priority?: string;
      attachments?: string[];
      expiresAt?: string;
    },
  ) {
    return this.rwaService.createAnnouncement(req.user.id, rwaId, body);
  }

  @Get(':rwaId/announcements')
  @ApiOperation({ summary: 'Get announcements' })
  async getAnnouncements(
    @Param('rwaId') rwaId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.rwaService.getAnnouncements(rwaId, page, limit);
  }

  // Visitor Pass
  @Post(':rwaId/visitor-pass')
  @ApiOperation({ summary: 'Create visitor pass' })
  async createVisitorPass(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Body() body: {
      visitorName: string;
      visitorPhone?: string;
      visitorVehicle?: string;
      purpose: string;
      validFrom: string;
      validUntil: string;
    },
  ) {
    return this.rwaService.createVisitorPass(req.user.id, rwaId, body);
  }

  @Get('visitor-pass/:passCode')
  @ApiOperation({ summary: 'Verify visitor pass' })
  async verifyVisitorPass(@Param('passCode') passCode: string) {
    return this.rwaService.verifyVisitorPass(passCode);
  }

  @Put('visitor-pass/:passId/checkin')
  @ApiOperation({ summary: 'Check in visitor' })
  async checkinVisitor(
    @Request() req: any,
    @Param('passId') passId: string,
    @Body() body: { guardNotes?: string },
  ) {
    return this.rwaService.checkinVisitor(passId, body.guardNotes);
  }

  @Put('visitor-pass/:passId/checkout')
  @ApiOperation({ summary: 'Check out visitor' })
  async checkoutVisitor(@Param('passId') passId: string) {
    return this.rwaService.checkoutVisitor(passId);
  }

  // Accounts
  @Get(':rwaId/accounts')
  @ApiOperation({ summary: 'Get RWA accounts' })
  async getAccounts(@Request() req: any, @Param('rwaId') rwaId: string) {
    return this.rwaService.getAccounts(req.user.id, rwaId);
  }

  @Post(':rwaId/transactions')
  @ApiOperation({ summary: 'Record transaction' })
  async recordTransaction(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Body() body: {
      accountId: string;
      type: 'income' | 'expense';
      category: string;
      amount: number;
      description: string;
      transactionDate: string;
      receiptUrl?: string;
    },
  ) {
    return this.rwaService.recordTransaction(req.user.id, rwaId, body);
  }

  @Get(':rwaId/transactions')
  @ApiOperation({ summary: 'Get transactions' })
  async getTransactions(
    @Request() req: any,
    @Param('rwaId') rwaId: string,
    @Query('accountId') accountId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.rwaService.getTransactions(req.user.id, rwaId, accountId, page, limit);
  }
}
