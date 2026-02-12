'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import {
  Settings,
  Shield,
  Star,
  Users,
  FileText,
  Bookmark,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
  Edit,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: trustData } = useSWR(user ? '/users/me/trust-score' : null, fetcher);
  const { data: endorsements } = useSWR(user ? `/users/${user.id}/endorsements` : null, fetcher);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors
    }
    logout();
  };

  if (!user) return null;

  const menuItems = [
    { href: '/profile/edit', label: 'Edit Profile', icon: Edit },
    { href: '/profile/saved', label: 'Saved Posts', icon: Bookmark },
    { href: '/profile/activity', label: 'My Activity', icon: FileText },
    { href: '/profile/settings', label: 'Settings', icon: Settings },
    { href: '/help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-6 border-b border-neutral-200">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900">{user.name}</h1>
              {user.isVerified && (
                <span className="badge badge-primary">
                  <Check className="w-3 h-3 mr-0.5" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-neutral-600 mt-1">{user.phone}</p>
            {user.memberships?.[0] && (
              <p className="text-sm text-neutral-500 mt-1">
                {user.memberships[0].neighborhood?.name} • {user.memberships[0].role}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Trust Score */}
      <div className="bg-white p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-neutral-900">Community Trust</h2>
          <Link href="/profile/trust" className="text-sm text-primary-600">
            Learn more
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-primary-500" />
              <span className="text-2xl font-bold text-neutral-900">{user.trustScore}</span>
              <span className="text-neutral-500">/100</span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${user.trustScore}%` }}
              />
            </div>
          </div>

          <div className="text-center px-4 border-l border-neutral-200">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-lg font-bold text-neutral-900">
                {endorsements?.length || 0}
              </span>
            </div>
            <p className="text-xs text-neutral-500">Endorsements</p>
          </div>
        </div>

        {trustData && (
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            {trustData.verificationBonus > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" />
                <span>Verified (+{trustData.verificationBonus})</span>
              </div>
            )}
            {trustData.endorsementBonus > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <Users className="w-4 h-4" />
                <span>Endorsed (+{trustData.endorsementBonus})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Endorsements */}
      {endorsements && endorsements.length > 0 && (
        <div className="bg-white p-4 border-b border-neutral-200">
          <h2 className="font-medium text-neutral-900 mb-3">Endorsements</h2>
          <div className="space-y-3">
            {endorsements.slice(0, 3).map((endorsement: any) => (
              <div key={endorsement.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 text-sm font-medium">
                  {endorsement.endorser?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {endorsement.endorser?.name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {endorsement.message || `Endorsed for ${endorsement.type}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="bg-white">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50"
          >
            <Icon className="w-5 h-5 text-neutral-500" />
            <span className="flex-1 text-neutral-900">{label}</span>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="flex-1 text-left">Log Out</span>
        </button>
      </div>
    </div>
  );
}
