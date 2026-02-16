import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TranslationService } from './translation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('translation')
@Controller('translation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TranslationController {
  constructor(private translationService: TranslationService) {}

  @Post()
  @ApiOperation({ summary: 'Translate text' })
  async translate(
    @Request() req: any,
    @Body() body: {
      text: string;
      sourceLanguage?: string;
      targetLanguage: string;
      contentType?: string;
      contentId?: string;
    },
  ) {
    return this.translationService.translateText(req.user.id, body);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch translate texts' })
  async batchTranslate(
    @Request() req: any,
    @Body() body: {
      texts: string[];
      targetLanguage: string;
      sourceLanguage?: string;
    },
  ) {
    return this.translationService.batchTranslate(req.user.id, body);
  }

  @Post('auto')
  @ApiOperation({ summary: 'Auto-translate based on user preference' })
  async autoTranslate(
    @Request() req: any,
    @Body() body: {
      text: string;
      contentType?: string;
      contentId?: string;
    },
  ) {
    return this.translationService.autoTranslate(
      req.user.id,
      body.text,
      body.contentType,
      body.contentId,
    );
  }

  @Post('post/:postId')
  @ApiOperation({ summary: 'Translate a post' })
  async translatePost(
    @Request() req: any,
    @Param('postId') postId: string,
    @Body() body: { targetLanguage: string },
  ) {
    return this.translationService.translatePost(req.user.id, postId, body.targetLanguage);
  }

  @Post('message/:messageId')
  @ApiOperation({ summary: 'Translate a message' })
  async translateMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body() body: { targetLanguage: string },
  ) {
    return this.translationService.translateMessage(req.user.id, messageId, body.targetLanguage);
  }

  @Get('languages')
  @ApiOperation({ summary: 'Get supported languages' })
  async getSupportedLanguages() {
    return this.translationService.getSupportedLanguages();
  }

  @Post('preference')
  @ApiOperation({ summary: 'Set preferred language' })
  async setPreferredLanguage(
    @Request() req: any,
    @Body() body: { languageCode: string },
  ) {
    return this.translationService.setPreferredLanguage(req.user.id, body.languageCode);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get translation history' })
  async getHistory(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.translationService.getTranslationHistory(req.user.id, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get translation statistics' })
  async getStats(@Request() req: any) {
    return this.translationService.getStats(req.user.id);
  }
}
