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

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onClick,
    danger,
    toggle,
    value,
    onChange,
  }: {
    icon: any;
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
      className={`w-full flex items-center gap-4 p-4 hover:bg-[var(--bg-tertiary)] transition-colors ${
        danger ? 'text-red-500' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        danger ? 'bg-red-500/10' : 'bg-[var(--bg-tertiary)]'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <p className={`font-medium ${danger ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>
      {toggle ? (
        <div
          className={`w-12 h-7 rounded-full transition-colors ${
            value ? 'bg-primary-500' : 'bg-[var(--border-color)]'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </div>
      ) : (
        <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
      )}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto bg-[var(--bg-primary)] min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-[var(--bg-tertiary)] rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-medium text-[var(--text-primary)]">Settings</h1>
      </div>

      {/* Account Section */}
      <div className="border-b border-[var(--border-color-light)]">
        <p className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]">
          Account
        </p>
        <SettingItem
          icon={User}
          title="Edit Profile"
          subtitle="Name, photo, bio"
          onClick={() => router.push('/profile/edit')}
        />
        <SettingItem
          icon={Smartphone}
          title="Phone Number"
          subtitle={user?.phone || 'Not set'}
          onClick={() => router.push('/settings/phone')}
        />
        <SettingItem
          icon={MapPin}
          title="My Neighborhoods"
          subtitle="Manage your communities"
          onClick={() => router.push('/settings/neighborhoods')}
        />
      </div>

      {/* Notifications Section */}
      <div className="border-b border-[var(--border-color-light)]">
        <p className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]">
          Notifications
        </p>
        <SettingItem
          icon={Bell}
          title="Push Notifications"
          toggle
          value={notificationSettings.pushEnabled}
          onChange={(val) => setNotificationSettings({ ...notificationSettings, pushEnabled: val })}
        />
        <SettingItem
          icon={Bell}
          title="Message Notifications"
          subtitle="Get notified for new messages"
          toggle
          value={notificationSettings.messageNotifs}
          onChange={(val) => setNotificationSettings({ ...notificationSettings, messageNotifs: val })}
        />
        <SettingItem
          icon={Bell}
          title="Post Notifications"
          subtitle="Updates on posts you follow"
          toggle
          value={notificationSettings.postNotifs}
          onChange={(val) => setNotificationSettings({ ...notificationSettings, postNotifs: val })}
        />
        <SettingItem
          icon={Shield}
          title="Safety Alerts"
          subtitle="Critical alerts for your area"
          toggle
          value={notificationSettings.safetyAlerts}
          onChange={(val) => setNotificationSettings({ ...notificationSettings, safetyAlerts: val })}
        />
        <SettingItem
          icon={Bell}
          title="Email Digest"
          subtitle="Weekly summary of activity"
          toggle
          value={notificationSettings.emailDigest}
          onChange={(val) => setNotificationSettings({ ...notificationSettings, emailDigest: val })}
        />
      </div>

      {/* Preferences Section */}
      <div className="border-b border-[var(--border-color-light)]">
        <p className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]">
          Preferences
        </p>
        <SettingItem
          icon={Globe}
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
          title="Dark Mode"
          subtitle={resolvedTheme === 'dark' ? 'Currently on' : 'Currently off'}
          toggle
          value={resolvedTheme === 'dark'}
          onChange={toggleTheme}
        />
      </div>

      {/* Privacy Section */}
      <div className="border-b border-[var(--border-color-light)]">
        <p className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]">
          Privacy & Security
        </p>
        <SettingItem
          icon={Lock}
          title="Privacy Settings"
          subtitle="Control who can see your info"
          onClick={() => router.push('/settings/privacy')}
        />
        <SettingItem
          icon={Shield}
          title="Blocked Users"
          subtitle="Manage blocked accounts"
          onClick={() => router.push('/settings/blocked')}
        />
      </div>

      {/* Support Section */}
      <div className="border-b border-[var(--border-color-light)]">
        <p className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]">
          Support
        </p>
        <SettingItem
          icon={HelpCircle}
          title="Help Center"
          subtitle="FAQs and guides"
          onClick={() => window.open('/help', '_blank')}
        />
        <SettingItem
          icon={Info}
          title="About ApniGully"
          subtitle="Version 1.0.0"
          onClick={() => router.push('/about')}
        />
      </div>

      {/* Danger Zone */}
      <div>
        <p className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]">
          Account Actions
        </p>
        <SettingItem
          icon={LogOut}
          title="Logout"
          onClick={handleLogout}
        />
        <SettingItem
          icon={Trash2}
          title="Delete Account"
          subtitle="Permanently delete your account"
          onClick={handleDeleteAccount}
          danger
        />
      </div>
    </div>
  );
}
