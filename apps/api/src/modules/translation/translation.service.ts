import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Supported Indian languages
const SUPPORTED_LANGUAGES = [
  'en', // English
  'hi', // Hindi
  'ta', // Tamil
  'te', // Telugu
  'bn', // Bengali
  'mr', // Marathi
  'gu', // Gujarati
  'kn', // Kannada
  'ml', // Malayalam
  'pa', // Punjabi
  'or', // Odia
  'as', // Assamese
  'ur', // Urdu
] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

@Injectable()
export class TranslationService {
  constructor(private prisma: PrismaService) {}

  // Check if language is supported
  isLanguageSupported(languageCode: string): boolean {
    return SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguage);
  }

  // Translate text content
  async translateText(
    userId: string,
    data: {
      text: string;
      sourceLanguage?: string;
      targetLanguage: string;
      contentType?: string;
      contentId?: string;
    },
  ) {
    const { text, sourceLanguage, targetLanguage, contentType, contentId } = data;

    if (!this.isLanguageSupported(targetLanguage)) {
      throw new BadRequestException(`Language ${targetLanguage} is not supported`);
    }

    if (sourceLanguage && !this.isLanguageSupported(sourceLanguage)) {
      throw new BadRequestException(`Language ${sourceLanguage} is not supported`);
    }

    // Check cache first
    const existingTranslation = await this.prisma.translation.findFirst({
      where: {
        sourceText: text,
        targetLanguage,
        ...(sourceLanguage && { sourceLanguage }),
      },
    });

    if (existingTranslation) {
      // Track usage
      await this.prisma.translationRequest.create({
        data: {
          userId,
          translationId: existingTranslation.id,
          sourceText: text,
          targetLanguage,
          contentType,
          contentId,
          cached: true,
        },
      });

      return {
        translatedText: existingTranslation.translatedText,
        sourceLanguage: existingTranslation.sourceLanguage,
        targetLanguage,
        cached: true,
      };
    }

    // Detect source language if not provided
    const detectedLanguage = sourceLanguage || this.detectLanguage(text);

    // Translate using AI service (mock implementation - in production, use Google Translate API or similar)
    const translatedText = await this.performTranslation(text, detectedLanguage, targetLanguage);

    // Cache the translation
    const translation = await this.prisma.translation.create({
      data: {
        sourceText: text,
        translatedText,
        sourceLanguage: detectedLanguage,
        targetLanguage,
      },
    });

    // Track usage
    await this.prisma.translationRequest.create({
      data: {
        userId,
        translationId: translation.id,
        sourceText: text,
        targetLanguage,
        contentType,
        contentId,
        cached: false,
      },
    });

    return {
      translatedText,
      sourceLanguage: detectedLanguage,
      targetLanguage,
      cached: false,
    };
  }

  // Detect language of text (mock implementation)
  private detectLanguage(text: string): string {
    // In production, use Google Cloud Translation API or similar
    // This is a simple heuristic based on character sets

    const hindiRegex = /[\u0900-\u097F]/;
    const tamilRegex = /[\u0B80-\u0BFF]/;
    const teluguRegex = /[\u0C00-\u0C7F]/;
    const bengaliRegex = /[\u0980-\u09FF]/;
    const marathiRegex = /[\u0900-\u097F]/; // Same as Hindi (Devanagari)
    const gujaratiRegex = /[\u0A80-\u0AFF]/;
    const kannadaRegex = /[\u0C80-\u0CFF]/;
    const malayalamRegex = /[\u0D00-\u0D7F]/;
    const punjabiRegex = /[\u0A00-\u0A7F]/;
    const odiaRegex = /[\u0B00-\u0B7F]/;
    const urduRegex = /[\u0600-\u06FF]/;

    if (tamilRegex.test(text)) return 'ta';
    if (teluguRegex.test(text)) return 'te';
    if (bengaliRegex.test(text)) return 'bn';
    if (gujaratiRegex.test(text)) return 'gu';
    if (kannadaRegex.test(text)) return 'kn';
    if (malayalamRegex.test(text)) return 'ml';
    if (punjabiRegex.test(text)) return 'pa';
    if (odiaRegex.test(text)) return 'or';
    if (urduRegex.test(text)) return 'ur';
    if (hindiRegex.test(text)) return 'hi';

    return 'en'; // Default to English
  }

  // Perform translation (mock implementation)
  private async performTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> {
    // In production, integrate with:
    // - Google Cloud Translation API
    // - Azure Translator
    // - AWS Translate
    // - OpenAI/Claude for context-aware translations

    // Mock implementation - return placeholder
    // In production, this would call the translation API
    return `[${targetLanguage}] ${text}`;
  }

  // Batch translate multiple texts
  async batchTranslate(
    userId: string,
    data: {
      texts: string[];
      targetLanguage: string;
      sourceLanguage?: string;
    },
  ) {
    const results = await Promise.all(
      data.texts.map(text =>
        this.translateText(userId, {
          text,
          targetLanguage: data.targetLanguage,
          sourceLanguage: data.sourceLanguage,
        }),
      ),
    );

    return results;
  }

  // Translate post content
  async translatePost(userId: string, postId: string, targetLanguage: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, content: true, title: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const translations: Record<string, string> = {};

    if (post.title) {
      const titleTranslation = await this.translateText(userId, {
        text: post.title,
        targetLanguage,
        contentType: 'post_title',
        contentId: postId,
      });
      translations.title = titleTranslation.translatedText;
    }

    if (post.content) {
      const contentTranslation = await this.translateText(userId, {
        text: post.content,
        targetLanguage,
        contentType: 'post_content',
        contentId: postId,
      });
      translations.content = contentTranslation.translatedText;
    }

    return {
      postId,
      targetLanguage,
      translations,
    };
  }

  // Translate message
  async translateMessage(userId: string, messageId: string, targetLanguage: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, content: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const translation = await this.translateText(userId, {
      text: message.content,
      targetLanguage,
      contentType: 'message',
      contentId: messageId,
    });

    return {
      messageId,
      targetLanguage,
      translatedText: translation.translatedText,
    };
  }

  // Get supported languages
  getSupportedLanguages() {
    const languageNames: Record<string, string> = {
      en: 'English',
      hi: 'हिंदी (Hindi)',
      ta: 'தமிழ் (Tamil)',
      te: 'తెలుగు (Telugu)',
      bn: 'বাংলা (Bengali)',
      mr: 'मराठी (Marathi)',
      gu: 'ગુજરાતી (Gujarati)',
      kn: 'ಕನ್ನಡ (Kannada)',
      ml: 'മലയാളം (Malayalam)',
      pa: 'ਪੰਜਾਬੀ (Punjabi)',
      or: 'ଓଡ଼ିଆ (Odia)',
      as: 'অসমীয়া (Assamese)',
      ur: 'اردو (Urdu)',
    };

    return SUPPORTED_LANGUAGES.map(code => ({
      code,
      name: languageNames[code],
    }));
  }

  // Set user's preferred language
  async setPreferredLanguage(userId: string, languageCode: string) {
    if (!this.isLanguageSupported(languageCode)) {
      throw new BadRequestException(`Language ${languageCode} is not supported`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: languageCode },
    });

    return { success: true, language: languageCode };
  }

  // Get user's translation history
  async getTranslationHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.translationRequest.findMany({
        where: { userId },
        include: {
          translation: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.translationRequest.count({ where: { userId } }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + requests.length < total,
      },
    };
  }

  // Auto-translate based on user preference
  async autoTranslate(
    userId: string,
    text: string,
    contentType?: string,
    contentId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true },
    });

    const targetLanguage = user?.preferredLanguage || 'en';
    const detectedLanguage = this.detectLanguage(text);

    // If already in preferred language, no translation needed
    if (detectedLanguage === targetLanguage) {
      return {
        translatedText: text,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        translated: false,
      };
    }

    const result = await this.translateText(userId, {
      text,
      sourceLanguage: detectedLanguage,
      targetLanguage,
      contentType,
      contentId,
    });

    return {
      ...result,
      translated: true,
    };
  }

  // Get translation statistics
  async getStats(userId: string) {
    const [totalRequests, cachedRequests, languageBreakdown] = await Promise.all([
      this.prisma.translationRequest.count({
        where: { userId },
      }),
      this.prisma.translationRequest.count({
        where: { userId, cached: true },
      }),
      this.prisma.translationRequest.groupBy({
        by: ['targetLanguage'],
        where: { userId },
        _count: true,
      }),
    ]);

    return {
      totalRequests,
      cachedRequests,
      cacheHitRate: totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0,
      languageBreakdown: languageBreakdown.map(l => ({
        language: l.targetLanguage,
        count: l._count,
      })),
    };
  }
}
