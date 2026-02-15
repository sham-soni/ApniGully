'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Phone, Shield } from 'lucide-react';

export default function PhoneSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-[var(--text-primary)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Phone Number</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Current Phone */}
        <div className="card shadow-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Primary Phone</p>
              <p className="font-bold text-[var(--text-primary)]">{user?.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-accent-500 text-sm">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Verified and secured</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="card shadow-card p-4 bg-amber-50 dark:bg-amber-950/30">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Why can&apos;t I change my phone number?</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Your phone number is your primary identity on ApniGully. It&apos;s used for:
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
            <li>- Logging into your account</li>
            <li>- Verifying your identity</li>
            <li>- Receiving important alerts</li>
            <li>- Building trust with neighbors</li>
          </ul>
        </div>

        {/* Change Phone Info */}
        <div className="card shadow-card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Need to change your number?</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            If you need to update your phone number, please contact our support team.
            This helps us prevent unauthorized account access.
          </p>
          <button className="btn btn-primary px-4 py-2 text-sm font-semibold press-scale">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
