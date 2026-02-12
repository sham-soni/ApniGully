'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
      await api.post('/auth/send-otp', { phone: data.phone });
      setPhone(data.phone);
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-primary-500 text-white px-6 pt-16 pb-12">
        <h1 className="text-3xl font-bold">ApniGully</h1>
        <p className="text-primary-100 mt-2">Connect with your neighborhood</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8">
        {step === 'phone' && (
          <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-lg text-neutral-600">
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
                <p className="text-red-500 text-sm mt-1">{errors.phone.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Enter OTP
              </label>
              <p className="text-sm text-neutral-500 mb-4">
                We sent a 6-digit code to +91 {phone}
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
                placeholder="123456"
                className="input text-center text-2xl tracking-widest"
                maxLength={6}
              />
              {errors.otp && (
                <p className="text-red-500 text-sm mt-1">{errors.otp.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="btn btn-ghost w-full"
            >
              Change Phone Number
            </button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-sm text-neutral-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
