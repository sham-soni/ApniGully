import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOtp } from '@apnigully/shared';

@Injectable()
export class AuthService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly OTP_RATE_LIMIT = 5; // per hour

  // TESTING MODE: Set to true to bypass OTP verification
  private readonly SKIP_OTP_VERIFICATION = true;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    // Check rate limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await this.prisma.otpRequest.count({
      where: {
        phone,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentRequests >= this.OTP_RATE_LIMIT) {
      throw new BadRequestException('Too many OTP requests. Please try again later.');
    }

    // Generate OTP
    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Find or check for existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    // Store OTP
    await this.prisma.otpRequest.create({
      data: {
        phone,
        otp,
        expiresAt,
        userId: existingUser?.id,
      },
    });

    // In production, send SMS via service like Twilio, MSG91, etc.
    // For development, log the OTP
    if (process.env.NODE_ENV !== 'production') {
      console.log(`OTP for ${phone}: ${otp}`);
    } else {
      // await this.smsService.sendOtp(phone, otp);
    }

    return {
      success: true,
      message: 'OTP sent successfully',
      // In test mode, tell frontend to auto-verify
      ...(this.SKIP_OTP_VERIFICATION && { skipOtp: true, testOtp: '123456' }),
    };
  }

  async verifyOtp(phone: string, otp: string): Promise<{
    token: string;
    user: any;
    isNewUser: boolean;
  }> {
    // TESTING MODE: Skip OTP verification entirely
    if (!this.SKIP_OTP_VERIFICATION) {
      // Find the most recent unused OTP for this phone
      const otpRequest = await this.prisma.otpRequest.findFirst({
        where: {
          phone,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRequest) {
        throw new UnauthorizedException('OTP expired or not found');
      }

      // Check attempts
      if (otpRequest.attempts >= this.MAX_OTP_ATTEMPTS) {
        throw new UnauthorizedException('Maximum OTP attempts exceeded');
      }

      // Verify OTP
      if (otpRequest.otp !== otp) {
        await this.prisma.otpRequest.update({
          where: { id: otpRequest.id },
          data: { attempts: { increment: 1 } },
        });
        throw new UnauthorizedException('Invalid OTP');
      }

      // Mark OTP as used
      await this.prisma.otpRequest.update({
        where: { id: otpRequest.id },
        data: { isUsed: true },
      });
    } else {
      console.log(`[TESTING MODE] Skipping OTP verification for ${phone}`);
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: '', // Will be updated during onboarding
          language: 'en',
        },
      });
    }

    // Update last seen
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    // Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
    });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        language: user.language,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
      },
      isNewUser,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            neighborhood: true,
            building: true,
          },
        },
      },
    });

    if (!user || !user.isActive || user.isBanned) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check if ban has expired
    if (user.isBanned && user.banExpiresAt && user.banExpiresAt < new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isBanned: false, banExpiresAt: null },
      });
      user.isBanned = false;
    }

    if (user.isBanned) {
      throw new UnauthorizedException('User is banned');
    }

    return user;
  }

  async refreshToken(userId: string): Promise<{ token: string }> {
    const user = await this.validateUser(userId);

    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
    });

    return { token };
  }

  async logout(userId: string): Promise<{ success: boolean }> {
    // In a production app with Redis, we'd invalidate the token here
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });

    return { success: true };
  }
}
