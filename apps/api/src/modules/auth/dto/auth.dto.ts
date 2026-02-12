import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Indian phone number (10 digits, starting with 6-9)',
    example: '9876543210',
  })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian phone number' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Indian phone number (10 digits, starting with 6-9)',
    example: '9876543210',
  })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian phone number' })
  phone: string;

  @ApiProperty({
    description: '6-digit OTP',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}
