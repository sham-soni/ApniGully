import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

@Injectable()
export class UploadService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION') || 'ap-south-1',
    });
    this.bucketName = this.configService.get('S3_BUCKET') || 'apnigully-uploads';
  }

  async getSignedUploadUrl(userId: string, fileType: string, folder: string = 'general'): Promise<{
    uploadUrl: string;
    fileUrl: string;
    key: string;
  }> {
    const extension = fileType.split('/')[1] || 'jpg';
    const key = `${folder}/${userId}/${nanoid()}.${extension}`;

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType,
      Expires: 300, // 5 minutes
    });

    const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: key,
    }).promise();
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: 3600, // 1 hour
    });
  }
}
