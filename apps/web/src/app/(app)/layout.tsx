'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
  Bell,
  Shield,
  MapPin,
} from 'lucide-react';

const sidebarNavItems = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/create', label: 'Create Post', icon: Plus },
  { href: '/inbox', label: 'Inbox', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

const bottomNavItems = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/create', label: 'Post', icon: Plus, isFab: true },
  { href: '/inbox', label: 'Inbox', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="w-8 h-8 border-[3px] border-primary-500 border-t-secondary-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeMembership = user.memberships?.[0];

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] pb-20 md:pb-0 md:pl-72">
      {/* ============ Desktop Sidebar ============ */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-72 md:flex-col bg-[var(--bg-card)] shadow-elevated z-30">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Gradient Logo Area */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-hero opacity-95" />
            <div className="relative px-6 py-5">
              <Link href="/feed" className="flex items-center gap-3 press-scale">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">ApniGully</span>
              </Link>
            </div>
          </div>

          {/* Neighborhood Selector */}
          {activeMembership && (
            <div className="mx-4 -mt-3 relative z-10">
              <div className="glass rounded-2xl px-4 py-3 shadow-card">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-secondary-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-secondary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Neighborhood</p>
                    <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                      {activeMembership.neighborhood?.name || 'Select Neighborhood'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 space-y-1">
            {sidebarNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 press-scale-sm ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                  style={isActive ? { background: 'var(--gradient-nav)' } : undefined}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Notifications Link */}
          <div className="px-3 pb-2">
            <Link
              href="/notifications"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 press-scale-sm ${
                pathname === '/notifications'
                  ? 'text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
              style={pathname === '/notifications' ? { background: 'var(--gradient-nav)' } : undefined}
            >
              <Bell className="w-5 h-5" />
              Notifications
            </Link>
          </div>

          {/* User Section */}
          <div className="px-4 py-4 border-t border-[var(--border-color-light)]">
            <Link href="/profile" className="flex items-center gap-3 press-scale-sm">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-primary-700 avatar-ring"
                   style={{ background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))' }}>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-accent-500" />
                  <p className="text-xs font-medium text-[var(--text-muted)]">Trust: {user.trustScore}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* ============ Mobile Header ============ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="relative flex items-center justify-between h-14 px-4 safe-area-top">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">
                {activeMembership?.neighborhood?.name || 'ApniGully'}
              </span>
            </div>
            <Link
              href="/notifications"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 press-scale"
            >
              <Bell className="w-[18px] h-[18px] text-white" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============ Main Content ============ */}
      <main className="pt-14 md:pt-0 animate-fade-in">{children}</main>

      {/* ============ Mobile Bottom Nav with FAB ============ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
        <div className="relative">
          {/* Nav Bar */}
          <div className="glass rounded-t-3xl shadow-nav mx-0">
            <div className="flex items-center justify-around h-16 px-2">
              {bottomNavItems.map(({ href, label, icon: Icon, isFab }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');

                if (isFab) {
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="flex flex-col items-center -mt-7 press-scale"
                    >
                      <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-glow transition-transform duration-200 hover:scale-105"
                           style={{ background: 'var(--gradient-button)' }}>
                        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 press-scale-sm transition-all duration-200"
                  >
                    <Icon className={`w-[22px] h-[22px] transition-all duration-200 ${
                      isActive ? 'text-primary-500' : 'text-[var(--text-muted)]'
                    }`} />
                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${
                      isActive ? 'text-primary-500' : 'text-[var(--text-muted)]'
                    }`}>
                      {label}
                    </span>
                    {/* Active dot indicator */}
                    <div className={`w-1 h-1 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-primary-500 scale-100'
                        : 'scale-0'
                    }`} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
