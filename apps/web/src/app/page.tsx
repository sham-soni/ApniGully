'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.memberships && user.memberships.length > 0) {
          router.push('/feed');
        } else {
          router.push('/onboarding/neighborhood');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--glass-border)] flex items-center justify-center mx-auto mb-6 shadow-glow">
          <span className="text-4xl font-black gradient-text">A</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">ApniGully</h1>
        <p className="text-white/70 text-lg">Your Neighborhood Community</p>
        <div className="mt-8">
          <div className="inline-block w-8 h-8 border-4 border-white/80 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
