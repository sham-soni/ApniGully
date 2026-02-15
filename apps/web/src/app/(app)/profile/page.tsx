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

  const { data: trustData } = useSWR<any>(user ? '/users/me/trust-score' : null, fetcher);
  const { data: endorsements } = useSWR<any>(user ? `/users/${user.id}/endorsements` : null, fetcher);

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
    { href: '/profile/edit', label: 'Edit Profile', icon: Edit, color: 'bg-primary-100 text-primary-600' },
    { href: '/profile/saved', label: 'Saved Posts', icon: Bookmark, color: 'bg-secondary-100 text-secondary-600' },
    { href: '/profile/activity', label: 'My Activity', icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { href: '/settings', label: 'Settings', icon: Settings, color: 'bg-neutral-200 text-neutral-600' },
    { href: '/help', label: 'Help & Support', icon: HelpCircle, color: 'bg-accent-100 text-accent-600' },
  ];

  const trustPercent = Math.min(user.trustScore || 0, 100);

  return (
    <div className="max-w-2xl mx-auto pb-6 animate-fade-in">
      {/* Profile Header with Gradient Banner */}
      <div className="relative">
        {/* Gradient Banner */}
        <div className="h-32 rounded-b-[2rem] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-10 w-20 h-20 rounded-full bg-white/5" />
        </div>

        {/* Avatar overlapping banner */}
        <div className="px-5 -mt-12 relative z-10">
          <div className="flex items-end gap-4">
            {/* Avatar with trust ring */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-elevated"
                   style={{
                     background: `conic-gradient(var(--color-primary-500) ${trustPercent * 3.6}deg, var(--border-color) ${trustPercent * 3.6}deg)`,
                     padding: '4px',
                   }}>
                <div className="w-full h-full rounded-full flex items-center justify-center bg-[var(--bg-card)]"
                     style={{ color: 'var(--color-primary-700)' }}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-card"
                     style={{ background: 'var(--gradient-button)' }}>
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{user.name}</h1>
              <p className="text-sm text-[var(--text-muted)]">{user.phone}</p>
              {user.memberships?.[0] && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {user.memberships[0].neighborhood?.name} · {user.memberships[0].role}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 mt-5">
        <div className="card p-4 shadow-card">
          <div className="grid grid-cols-3 divide-x divide-[var(--border-color-light)]">
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Shield className="w-4 h-4 text-primary-500" />
                <span className="text-2xl font-bold text-[var(--text-primary)]">{user.trustScore}</span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Trust</p>
            </div>
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-2xl font-bold text-[var(--text-primary)]">{endorsements?.length || 0}</span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Endorsed</p>
            </div>
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-secondary-500" />
                <span className="text-2xl font-bold text-[var(--text-primary)]">{(user as any)._count?.posts || 0}</span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Posts</p>
            </div>
          </div>

          {/* Trust Progress Bar */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color-light)]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[var(--text-secondary)]">Community Trust</span>
              <span className="font-bold text-primary-500">{trustPercent}/100</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${trustPercent}%`, background: 'var(--gradient-button)' }}
              />
            </div>
          </div>

          {trustData && (
            <div className="flex flex-wrap gap-2 mt-3">
              {trustData.verificationBonus > 0 && (
                <span className="badge badge-success text-[10px]">
                  <Check className="w-3 h-3 mr-1" />
                  Verified +{trustData.verificationBonus}
                </span>
              )}
              {trustData.endorsementBonus > 0 && (
                <span className="badge bg-amber-100 text-amber-700 text-[10px]">
                  <Users className="w-3 h-3 mr-1" />
                  Endorsed +{trustData.endorsementBonus}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Endorsements */}
      {endorsements && endorsements.length > 0 && (
        <div className="px-5 mt-4">
          <div className="card p-4 shadow-card">
            <h2 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Endorsements
            </h2>
            <div className="space-y-3">
              {endorsements.slice(0, 3).map((endorsement: any) => (
                <div key={endorsement.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                       style={{ background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))', color: 'var(--color-primary-700)' }}>
                    {endorsement.endorser?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {endorsement.endorser?.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {endorsement.message || `Endorsed for ${endorsement.type}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="px-5 mt-4">
        <div className="card shadow-card overflow-hidden">
          {menuItems.map(({ href, label, icon: Icon, color }, i) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--bg-tertiary)] transition-colors press-scale-sm ${
                i < menuItems.length - 1 ? 'border-b border-[var(--border-color-light)]' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span className="flex-1 font-medium text-[var(--text-primary)] text-sm">{label}</span>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-5 mt-4">
        <button
          onClick={handleLogout}
          className="w-full card shadow-card flex items-center gap-4 px-4 py-3.5 text-red-500 hover:bg-red-50 transition-colors press-scale-sm"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100 text-red-500">
            <LogOut className="w-[18px] h-[18px]" />
          </div>
          <span className="flex-1 text-left font-medium text-sm">Log Out</span>
        </button>
      </div>
    </div>
  );
}
