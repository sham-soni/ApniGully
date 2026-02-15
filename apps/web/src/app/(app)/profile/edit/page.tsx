'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { uploadFile, validateFile } from '@/lib/upload';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, { maxSizeMB: 5 });
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload file
    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await uploadFile(file, 'avatars');
      await api.put('/users/me', { avatar: uploadedUrl });
      setAvatarUrl(uploadedUrl);
      updateUser({ avatar: uploadedUrl });
      toast.success('Photo updated');
    } catch (error) {
      toast.error('Failed to upload photo');
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/users/me', {
        name: name.trim(),
        bio: bio.trim() || undefined,
      });
      updateUser({ name: name.trim() });
      toast.success('Profile updated');
      router.back();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const displayAvatar = avatarPreview || avatarUrl;

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
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Edit Profile</h1>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center py-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <button
          onClick={handleAvatarClick}
          disabled={isUploadingAvatar}
          className="relative group press-scale"
        >
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-4 ring-[var(--bg-primary)] shadow-elevated">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-primary-700">
                {name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center border-2 border-[var(--bg-primary)] shadow-card">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </button>
        <p className="text-sm text-[var(--text-muted)] mt-3">
          {isUploadingAvatar ? 'Uploading...' : 'Tap to change photo'}
        </p>
      </div>

      {/* Form */}
      <div className="px-4 space-y-4">
        <div className="card shadow-card p-4 space-y-5">
          {/* Name */}
          <div>
            <label className="label">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={50}
              className="input w-full"
            />
          </div>

          {/* Phone (read-only) */}
          <div>
            <label className="label">
              Phone
            </label>
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)] rounded-2xl">
              <span className="text-[var(--text-secondary)]">{user?.phone}</span>
              <span className="flex items-center gap-1.5 text-sm text-accent-500 font-medium">
                <span className="w-4 h-4 rounded-full bg-accent-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Verified
              </span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="label">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your neighbors about yourself..."
              maxLength={200}
              rows={4}
              className="input w-full resize-none"
            />
            <p className="text-xs text-[var(--text-muted)] text-right mt-1">
              {bio.length}/200
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="card shadow-card p-4 bg-primary-50 dark:bg-primary-950/30">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-xs font-bold">i</span>
            </div>
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Your name and bio are visible to neighbors in your community.
              Use your real name for trust and verification.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 press-scale"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
}
