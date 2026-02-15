'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Phone, KeyRound, UserCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Step = 'phone' | 'otp' | 'profile';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const handleSendOtp = async (data: any) => {
    try {
      const response: any = await api.post('/auth/send-otp', { phone: data.phone });
      setPhone(data.phone);

      // In test mode, auto-verify OTP and skip the OTP screen
      if (response.skipOtp && response.testOtp) {
        toast.success('Dev mode: Auto-verifying OTP...');
        const verifyResponse: any = await api.post('/auth/verify-otp', {
          phone: data.phone,
          otp: response.testOtp,
        });
        login(verifyResponse.token, verifyResponse.user);
        if (verifyResponse.isNewUser || !verifyResponse.user.name) {
          setIsNewUser(true);
          setStep('profile');
        } else {
          router.push('/feed');
        }
        return;
      }

      setStep('otp');
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (data: any) => {
    try {
      const response: any = await api.post('/auth/verify-otp', {
        phone,
        otp: data.otp,
      });

      login(response.token, response.user);

      if (response.isNewUser || !response.user.name) {
        setIsNewUser(true);
        setStep('profile');
      } else {
        router.push('/feed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    }
  };

  const handleUpdateProfile = async (data: any) => {
    try {
      await api.put('/users/me', { name: data.name });
      router.push('/onboarding/neighborhood');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const stepTitles = {
    phone: 'Welcome to',
    otp: 'Verify your',
    profile: 'Set up your',
  };

  const stepSubtitles = {
    phone: 'ApniGully',
    otp: 'phone number',
    profile: 'profile',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-secondary)]">
      {/* Gradient Hero with curved bottom */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative px-6 pt-16 pb-24 text-center">
          <div className="w-16 h-16 mx-auto bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/25 mb-6 animate-fade-in">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <p className="text-white/70 text-sm font-medium tracking-wider uppercase mb-1 animate-slide-up">
            {stepTitles[step]}
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight animate-slide-up">
            {stepSubtitles[step]}
          </h1>
          <p className="text-white/60 text-sm mt-3 animate-slide-up">
            Connect with your neighborhood community
          </p>
        </div>
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-[var(--bg-secondary)]" style={{ borderRadius: '2rem 2rem 0 0' }} />
      </div>

      {/* Form Card */}
      <div className="flex-1 px-5 -mt-4 relative z-10 animate-slide-up">
        <div className="card p-6 shadow-elevated max-w-md mx-auto w-full">
          {step === 'phone' && (
            <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-5">
              <div>
                <label className="label flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-500" />
                  Phone Number
                </label>
                <div className="flex mt-1">
                  <span className="inline-flex items-center px-4 rounded-l-2xl text-sm font-semibold text-[var(--text-secondary)]"
                        style={{ background: 'var(--bg-tertiary)', border: '1.5px solid var(--border-color)', borderRight: 'none' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter a valid 10-digit phone number',
                      },
                    })}
                    placeholder="9876543210"
                    className="input rounded-l-none"
                    maxLength={10}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.phone.message as string}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-5">
              <div>
                <label className="label flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-secondary-500" />
                  Enter OTP
                </label>
                <p className="text-sm text-[var(--text-muted)] mb-3">
                  We sent a 6-digit code to <span className="font-semibold text-[var(--text-primary)]">+91 {phone}</span>
                </p>
                <input
                  type="text"
                  {...register('otp', {
                    required: 'OTP is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Enter a valid 6-digit OTP',
                    },
                  })}
                  placeholder="000000"
                  className="input text-center text-2xl tracking-[0.5em] font-bold"
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.otp.message as string}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="btn btn-ghost w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Phone Number
              </button>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-5">
              <div>
                <label className="label flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-accent-500" />
                  Your Name
                </label>
                <input
                  type="text"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                  placeholder="Enter your name"
                  className="input"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.name.message as string}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Continue'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center">
        <p className="text-xs text-[var(--text-muted)]">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="link text-xs">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="link text-xs">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
