'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  ChevronRight,
  Smartphone,
  MapPin,
  Lock,
  Trash2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    emailDigest: true,
    messageNotifs: true,
    postNotifs: true,
    safetyAlerts: true,
  });
  const [language, setLanguage] = useState('en');

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/login');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = prompt('Type "DELETE" to confirm account deletion');
    if (confirmed !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    try {
      await api.delete('/users/me');
      toast.success('Account deleted');
      logout();
      router.push('/login');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const iconStyles: Record<string, string> = {
    User: 'bg-primary-100 text-primary-600',
    Smartphone: 'bg-violet-100 text-violet-600',
    MapPin: 'bg-emerald-100 text-emerald-600',
    Bell: 'bg-amber-100 text-amber-600',
    Shield: 'bg-red-100 text-red-600',
    Globe: 'bg-blue-100 text-blue-600',
    Moon: 'bg-indigo-100 text-indigo-600',
    Sun: 'bg-yellow-100 text-yellow-600',
    Lock: 'bg-slate-100 text-slate-600',
    HelpCircle: 'bg-cyan-100 text-cyan-600',
    Info: 'bg-teal-100 text-teal-600',
    LogOut: 'bg-orange-100 text-orange-600',
    Trash2: 'bg-red-100 text-red-600',
  };

  const SettingItem = ({
    icon: Icon,
    iconName,
    title,
    subtitle,
    onClick,
    danger,
    toggle,
    value,
    onChange,
  }: {
    icon: any;
    iconName?: string;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    danger?: boolean;
    toggle?: boolean;
    value?: boolean;
    onChange?: (val: boolean) => void;
  }) => (
    <button
      onClick={toggle ? () => onChange?.(!value) : onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 press-scale-sm transition-colors ${
        danger ? 'text-red-500' : ''
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        danger ? 'bg-red-100 text-red-600' : (iconName && iconStyles[iconName]) || 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
      }`}>
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`font-medium text-sm ${danger ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {toggle ? (
        <div
          className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            value ? 'bg-accent-500' : 'bg-[var(--border-color)]'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${
              value ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </div>
      ) : (
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
      )}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-[var(--text-primary)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Settings</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Account Section */}
        <div className="card shadow-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Account
          </p>
          <SettingItem
            icon={User}
            iconName="User"
            title="Edit Profile"
            subtitle="Name, photo, bio"
            onClick={() => router.push('/profile/edit')}
          />
          <SettingItem
            icon={Smartphone}
            iconName="Smartphone"
            title="Phone Number"
            subtitle={user?.phone || 'Not set'}
            onClick={() => router.push('/settings/phone')}
          />
          <SettingItem
            icon={MapPin}
            iconName="MapPin"
            title="My Neighborhoods"
            subtitle="Manage your communities"
            onClick={() => router.push('/settings/neighborhoods')}
          />
        </div>

        {/* Notifications Section */}
        <div className="card shadow-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Notifications
          </p>
          <SettingItem
            icon={Bell}
            iconName="Bell"
            title="Push Notifications"
            toggle
            value={notificationSettings.pushEnabled}
            onChange={(val) => setNotificationSettings({ ...notificationSettings, pushEnabled: val })}
          />
          <SettingItem
            icon={Bell}
            iconName="Bell"
            title="Message Notifications"
            subtitle="Get notified for new messages"
            toggle
            value={notificationSettings.messageNotifs}
            onChange={(val) => setNotificationSettings({ ...notificationSettings, messageNotifs: val })}
          />
          <SettingItem
            icon={Bell}
            iconName="Bell"
            title="Post Notifications"
            subtitle="Updates on posts you follow"
            toggle
            value={notificationSettings.postNotifs}
            onChange={(val) => setNotificationSettings({ ...notificationSettings, postNotifs: val })}
          />
          <SettingItem
            icon={Shield}
            iconName="Shield"
            title="Safety Alerts"
            subtitle="Critical alerts for your area"
            toggle
            value={notificationSettings.safetyAlerts}
            onChange={(val) => setNotificationSettings({ ...notificationSettings, safetyAlerts: val })}
          />
          <SettingItem
            icon={Bell}
            iconName="Bell"
            title="Email Digest"
            subtitle="Weekly summary of activity"
            toggle
            value={notificationSettings.emailDigest}
            onChange={(val) => setNotificationSettings({ ...notificationSettings, emailDigest: val })}
          />
        </div>

        {/* Preferences Section */}
        <div className="card shadow-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Preferences
          </p>
          <SettingItem
            icon={Globe}
            iconName="Globe"
            title="Language"
            subtitle={language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Regional'}
            onClick={() => {
              const langs = ['en', 'hi', 'mr', 'ta', 'te', 'bn'];
              const idx = langs.indexOf(language);
              setLanguage(langs[(idx + 1) % langs.length]);
            }}
          />
          <SettingItem
            icon={resolvedTheme === 'dark' ? Sun : Moon}
            iconName={resolvedTheme === 'dark' ? 'Sun' : 'Moon'}
            title="Dark Mode"
            subtitle={resolvedTheme === 'dark' ? 'Currently on' : 'Currently off'}
            toggle
            value={resolvedTheme === 'dark'}
            onChange={toggleTheme}
          />
        </div>

        {/* Privacy Section */}
        <div className="card shadow-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Privacy & Security
          </p>
          <SettingItem
            icon={Lock}
            iconName="Lock"
            title="Privacy Settings"
            subtitle="Control who can see your info"
            onClick={() => router.push('/settings/privacy')}
          />
          <SettingItem
            icon={Shield}
            iconName="Shield"
            title="Blocked Users"
            subtitle="Manage blocked accounts"
            onClick={() => router.push('/settings/blocked')}
          />
        </div>

        {/* Support Section */}
        <div className="card shadow-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Support
          </p>
          <SettingItem
            icon={HelpCircle}
            iconName="HelpCircle"
            title="Help Center"
            subtitle="FAQs and guides"
            onClick={() => window.open('/help', '_blank')}
          />
          <SettingItem
            icon={Info}
            iconName="Info"
            title="About ApniGully"
            subtitle="Version 1.0.0"
            onClick={() => router.push('/about')}
          />
        </div>

        {/* Danger Zone */}
        <div className="card shadow-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Account Actions
          </p>
          <SettingItem
            icon={LogOut}
            iconName="LogOut"
            title="Logout"
            onClick={handleLogout}
          />
          <SettingItem
            icon={Trash2}
            iconName="Trash2"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onClick={handleDeleteAccount}
            danger
          />
        </div>
      </div>
    </div>
  );
}
