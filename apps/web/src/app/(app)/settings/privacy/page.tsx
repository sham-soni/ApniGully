'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, fetcher } from '@/lib/api';
import useSWR from 'swr';
import { ArrowLeft, Eye, Phone, Wifi, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PrivacySettings {
  profileVisibility: 'neighbors' | 'public';
  showPhone: boolean;
  showOnlineStatus: boolean;
  showLocation: boolean;
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'neighbors',
    showPhone: false,
    showOnlineStatus: true,
    showLocation: true,
  });

  const { data, isLoading } = useSWR<any>(
    '/users/me/settings',
    fetcher
  );

  useEffect(() => {
    if (data?.data) {
      setSettings(data.data);
    }
  }, [data]);

  const handleToggle = async (key: keyof PrivacySettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      await api.put('/users/me/settings', { [key]: value });
      toast.success('Setting updated');
    } catch (error) {
      // Revert on error
      setSettings(settings);
      toast.error('Failed to update setting');
    } finally {
      setIsSaving(false);
    }
  };

  const iconStyles: Record<string, string> = {
    Phone: 'bg-violet-100 text-violet-600',
    Wifi: 'bg-emerald-100 text-emerald-600',
    MapPin: 'bg-amber-100 text-amber-600',
  };

  const SettingToggle = ({
    icon: Icon,
    iconName,
    title,
    description,
    value,
    onChange,
  }: {
    icon: any;
    iconName?: string;
    title: string;
    description: string;
    value: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        (iconName && iconStyles[iconName]) || 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
      }`}>
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-[var(--text-primary)]">{title}</h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-accent-500' : 'bg-[var(--border-color)]'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            value ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

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
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Privacy Settings</h1>
        {isSaving && <Loader2 className="w-4 h-4 text-primary-500 animate-spin ml-auto" />}
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Visibility */}
        <div className="card shadow-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Profile Visibility
          </p>
          <div className="px-4 pb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Eye className="w-[18px] h-[18px] text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-[var(--text-primary)]">Who can see your profile</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Control who can view your profile information
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleToggle('profileVisibility', 'neighbors')}
                className={`flex-1 py-3 rounded-2xl border-2 transition-all press-scale-sm ${
                  settings.profileVisibility === 'neighbors'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-glow'
                    : 'border-[var(--border-color-light)] text-[var(--text-secondary)] hover:border-[var(--border-color)]'
                }`}
              >
                <span className="font-semibold text-sm">Neighbors Only</span>
                <p className="text-xs mt-1 opacity-70">Members of your neighborhood</p>
              </button>
              <button
                onClick={() => handleToggle('profileVisibility', 'public')}
                className={`flex-1 py-3 rounded-2xl border-2 transition-all press-scale-sm ${
                  settings.profileVisibility === 'public'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-glow'
                    : 'border-[var(--border-color-light)] text-[var(--text-secondary)] hover:border-[var(--border-color)]'
                }`}
              >
                <span className="font-semibold text-sm">Public</span>
                <p className="text-xs mt-1 opacity-70">Anyone on ApniGully</p>
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="card shadow-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Information Sharing
          </p>
          <SettingToggle
            icon={Phone}
            iconName="Phone"
            title="Show Phone Number"
            description="Allow others to see your phone number on your profile"
            value={settings.showPhone}
            onChange={(val) => handleToggle('showPhone', val)}
          />
          <SettingToggle
            icon={Wifi}
            iconName="Wifi"
            title="Show Online Status"
            description="Let others see when you're active on ApniGully"
            value={settings.showOnlineStatus}
            onChange={(val) => handleToggle('showOnlineStatus', val)}
          />
          <SettingToggle
            icon={MapPin}
            iconName="MapPin"
            title="Show Location"
            description="Show your approximate location on posts and profile"
            value={settings.showLocation}
            onChange={(val) => handleToggle('showLocation', val)}
          />
        </div>

        {/* Info Box */}
        <div className="card shadow-card p-4 bg-secondary-50 dark:bg-secondary-950/30">
          <h3 className="font-semibold text-secondary-800 dark:text-secondary-200 mb-2">About Privacy on ApniGully</h3>
          <p className="text-sm text-secondary-700 dark:text-secondary-300">
            Your safety and privacy are important to us. These settings help you control
            what information is shared with others. Some features may be limited based on
            your privacy settings.
          </p>
        </div>
      </div>
    </div>
  );
}
