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
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-neutral-900">Edit Profile</h1>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center py-8 border-b border-neutral-100">
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
          className="relative group"
        >
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-primary-700">
                {name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </button>
        <p className="text-sm text-neutral-500 mt-2">
          {isUploadingAvatar ? 'Uploading...' : 'Tap to change photo'}
        </p>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={50}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Phone (read-only) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Phone
          </label>
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-100 rounded-xl">
            <span className="text-neutral-600">{user?.phone}</span>
            <span className="flex items-center gap-1 text-sm text-green-600">
              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
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
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your neighbors about yourself..."
            maxLength={200}
            rows={4}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-neutral-400 text-right mt-1">
            {bio.length}/200
          </p>
        </div>

        {/* Info Box */}
        <div className="flex gap-3 p-4 bg-primary-50 rounded-xl">
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-primary-600 text-xs font-bold">i</span>
          </div>
          <p className="text-sm text-primary-700">
            Your name and bio are visible to neighbors in your community.
            Use your real name for trust and verification.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
