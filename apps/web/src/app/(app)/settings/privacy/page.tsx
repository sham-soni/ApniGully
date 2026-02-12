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

  const { data, isLoading } = useSWR<{ data: PrivacySettings }>(
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

  const SettingToggle = ({
    icon: Icon,
    title,
    description,
    value,
    onChange,
  }: {
    icon: any;
    title: string;
    description: string;
    value: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-start gap-4 p-4 border-b border-neutral-100">
      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-neutral-600" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          value ? 'bg-primary-500' : 'bg-neutral-300'
        }`}
      >
        <div
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-white min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-neutral-900">Privacy Settings</h1>
        {isSaving && <Loader2 className="w-4 h-4 text-primary-500 animate-spin ml-auto" />}
      </div>

      {/* Profile Visibility */}
      <div className="border-b border-neutral-100">
        <p className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider bg-neutral-50">
          Profile Visibility
        </p>
        <div className="p-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Who can see your profile</h3>
              <p className="text-sm text-neutral-500 mt-0.5">
                Control who can view your profile information
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleToggle('profileVisibility', 'neighbors')}
              className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
                settings.profileVisibility === 'neighbors'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <span className="font-medium">Neighbors Only</span>
              <p className="text-xs mt-1 opacity-70">Members of your neighborhood</p>
            </button>
            <button
              onClick={() => handleToggle('profileVisibility', 'public')}
              className={`flex-1 py-3 rounded-xl border-2 transition-colors ${
                settings.profileVisibility === 'public'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <span className="font-medium">Public</span>
              <p className="text-xs mt-1 opacity-70">Anyone on ApniGully</p>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Settings */}
      <div>
        <p className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider bg-neutral-50">
          Information Sharing
        </p>
        <SettingToggle
          icon={Phone}
          title="Show Phone Number"
          description="Allow others to see your phone number on your profile"
          value={settings.showPhone}
          onChange={(val) => handleToggle('showPhone', val)}
        />
        <SettingToggle
          icon={Wifi}
          title="Show Online Status"
          description="Let others see when you're active on ApniGully"
          value={settings.showOnlineStatus}
          onChange={(val) => handleToggle('showOnlineStatus', val)}
        />
        <SettingToggle
          icon={MapPin}
          title="Show Location"
          description="Show your approximate location on posts and profile"
          value={settings.showLocation}
          onChange={(val) => handleToggle('showLocation', val)}
        />
      </div>

      {/* Info Box */}
      <div className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-2">About Privacy on ApniGully</h3>
          <p className="text-sm text-blue-700">
            Your safety and privacy are important to us. These settings help you control
            what information is shared with others. Some features may be limited based on
            your privacy settings.
          </p>
        </div>
      </div>
    </div>
  );
}
