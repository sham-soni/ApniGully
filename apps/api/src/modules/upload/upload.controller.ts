import { Controller, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class GetUploadUrlDto {
  @IsString() fileType: string;
  @IsString() @IsOptional() folder?: string;
}

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('signed-url')
  @ApiOperation({ summary: 'Get signed upload URL' })
  getSignedUrl(@Request() req: any, @Body() dto: GetUploadUrlDto) {
    return this.uploadService.getSignedUploadUrl(req.user.id, dto.fileType, dto.folder);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete uploaded file' })
  deleteFile(@Param('key') key: string) {
    return this.uploadService.deleteFile(key);
  }
}
