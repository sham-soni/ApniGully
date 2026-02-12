'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Phone, Shield } from 'lucide-react';

export default function PhoneSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-neutral-900">Phone Number</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Phone */}
        <div className="bg-neutral-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Primary Phone</p>
              <p className="font-semibold text-neutral-900">{user?.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Shield className="w-4 h-4" />
            <span>Verified and secured</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-medium text-amber-800 mb-2">Why can&apos;t I change my phone number?</h3>
          <p className="text-sm text-amber-700">
            Your phone number is your primary identity on ApniGully. It&apos;s used for:
          </p>
          <ul className="text-sm text-amber-700 mt-2 space-y-1">
            <li>- Logging into your account</li>
            <li>- Verifying your identity</li>
            <li>- Receiving important alerts</li>
            <li>- Building trust with neighbors</li>
          </ul>
        </div>

        {/* Change Phone Info */}
        <div className="border border-neutral-200 rounded-xl p-4">
          <h3 className="font-medium text-neutral-900 mb-2">Need to change your number?</h3>
          <p className="text-sm text-neutral-600 mb-4">
            If you need to update your phone number, please contact our support team.
            This helps us prevent unauthorized account access.
          </p>
          <button className="text-primary-600 font-medium text-sm hover:underline">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
