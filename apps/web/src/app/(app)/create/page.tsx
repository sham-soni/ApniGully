'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api, offlineQueue } from '@/lib/api';
import { parseRentalPost } from '@apnigully/shared';
import {
  ArrowLeft,
  Image,
  MapPin,
  AlertTriangle,
  Megaphone,
  Wrench,
  Star,
  Home,
  ShoppingBag,
} from 'lucide-react';

const postTypes = [
  { key: 'announcement', label: 'Announcement', icon: Megaphone, description: 'Share news or updates', color: 'bg-blue-100 text-blue-600' },
  { key: 'request', label: 'Need Help', icon: Wrench, description: 'Ask for help or recommendations', color: 'bg-orange-100 text-orange-600' },
  { key: 'recommendation', label: 'Recommendation', icon: Star, description: 'Recommend a service or shop', color: 'bg-emerald-100 text-emerald-600' },
  { key: 'rental', label: 'Rental Listing', icon: Home, description: 'List a property for rent', color: 'bg-purple-100 text-purple-600' },
  { key: 'buy_sell', label: 'Buy/Sell', icon: ShoppingBag, description: 'List items for sale', color: 'bg-pink-100 text-pink-600' },
  { key: 'safety_alert', label: 'Safety Alert', icon: AlertTriangle, description: 'Report a safety concern', color: 'bg-red-100 text-red-600' },
];

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [parsedRental, setParsedRental] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const content = watch('content');
  const neighborhoodId = user?.memberships?.[0]?.neighborhoodId;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedType === 'rental') {
      const parsed = parseRentalPost(e.target.value);
      setParsedRental(parsed);
    }
  };

  const onSubmit = async (data: any) => {
    if (!neighborhoodId) {
      toast.error('Please join a neighborhood first');
      return;
    }

    try {
      const postData = {
        neighborhoodId,
        type: selectedType,
        title: data.title,
        content: data.content,
        tags: data.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
        isUrgent: data.isUrgent || false,
      };

      if (navigator.onLine) {
        await api.post('/posts', postData);
        toast.success('Post created successfully');
      } else {
        offlineQueue.add({
          type: 'post',
          data: { ...postData, localId: `local_${Date.now()}` },
          timestamp: Date.now(),
        });
        toast.success('Post queued for sync');
      }

      router.push('/feed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
    }
  };

  if (!selectedType) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-card)] shadow-card press-scale">
            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Create Post</h1>
        </div>

        <div className="px-4 pb-6">
          <p className="text-sm text-[var(--text-muted)] mb-4">What would you like to share?</p>
          <div className="grid grid-cols-2 gap-3">
            {postTypes.map(({ key, label, icon: Icon, description, color }) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className="card p-4 shadow-card text-left transition-all duration-200 press-scale-sm hover:shadow-card-hover group"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color} mb-3 transition-transform group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm text-[var(--text-primary)]">{label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedTypeInfo = postTypes.find(t => t.key === selectedType)!;
  const Icon = selectedTypeInfo.icon;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button type="button" onClick={() => setSelectedType(null)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-card)] shadow-card press-scale">
            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selectedTypeInfo.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-[var(--text-primary)]">{selectedTypeInfo.label}</span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary px-5 py-2 text-sm"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Post'}
          </button>
        </div>

        <div className="px-4 pb-6">
          <div className="card p-5 shadow-card space-y-4">
            {/* Title */}
            <input
              type="text"
              {...register('title')}
              placeholder="Add a title (optional)"
              className="w-full text-lg font-bold border-none outline-none bg-transparent placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
            />

            {/* Content */}
            <textarea
              {...register('content', {
                required: 'Please add some content',
                minLength: { value: 10, message: 'Content must be at least 10 characters' },
              })}
              onChange={(e) => {
                register('content').onChange(e);
                handleContentChange(e);
              }}
              placeholder="Share details with your neighbors..."
              rows={8}
              className="w-full border-none outline-none resize-none bg-transparent placeholder:text-[var(--text-muted)] text-[var(--text-primary)] text-sm leading-relaxed"
            />
            {errors.content && (
              <p className="text-red-500 text-sm font-medium">{errors.content.message as string}</p>
            )}

            {/* Parsed Rental Info */}
            {selectedType === 'rental' && parsedRental && Object.keys(parsedRental).length > 0 && (
              <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-tertiary)' }}>
                <p className="text-xs font-semibold text-primary-500 mb-2 uppercase tracking-wider">Auto-detected</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-[var(--text-secondary)]">
                  {parsedRental.bhk && <span>BHK: {parsedRental.bhk}</span>}
                  {parsedRental.rentAmount && <span>Rent: ₹{parsedRental.rentAmount.toLocaleString()}</span>}
                  {parsedRental.depositAmount && <span>Deposit: ₹{parsedRental.depositAmount.toLocaleString()}</span>}
                  {parsedRental.furnishing && <span>Furnishing: {parsedRental.furnishing}</span>}
                  {parsedRental.locality && <span>Area: {parsedRental.locality}</span>}
                </div>
              </div>
            )}

            {/* Tags */}
            <input
              type="text"
              {...register('tags')}
              placeholder="Add tags (comma separated)"
              className="w-full text-sm border-none outline-none bg-transparent placeholder:text-[var(--text-muted)] text-primary-500"
            />

            {/* Options Bar */}
            <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color-light)]">
              <button type="button" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-primary-500 transition-colors press-scale-sm">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)]">
                  <Image className="w-[18px] h-[18px]" />
                </div>
                <span className="text-xs font-semibold">Photos</span>
              </button>
              <button type="button" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-secondary-500 transition-colors press-scale-sm">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)]">
                  <MapPin className="w-[18px] h-[18px]" />
                </div>
                <span className="text-xs font-semibold">Location</span>
              </button>
              {selectedType === 'safety_alert' && (
                <label className="flex items-center gap-2 ml-auto cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isUrgent')}
                    className="w-4 h-4 text-red-500 border-neutral-300 rounded focus:ring-red-500"
                  />
                  <span className="text-xs font-semibold text-red-500">Urgent</span>
                </label>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
