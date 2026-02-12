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
    <div className="min-h-screen flex items-center justify-center bg-primary-500">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-2">ApniGully</h1>
        <p className="text-primary-100">Your Neighborhood Community</p>
        <div className="mt-8">
          <div className="inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
