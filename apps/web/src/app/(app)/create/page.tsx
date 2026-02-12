'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api, offlineQueue } from '@/lib/api';
import { parseRentalPost } from '@apnigully/shared';
import {
  X,
  Image,
  MapPin,
  AlertTriangle,
  Megaphone,
  Wrench,
  Star,
  Home,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';

const postTypes = [
  { key: 'announcement', label: 'Announcement', icon: Megaphone, description: 'Share news or updates' },
  { key: 'request', label: 'Need Help', icon: Wrench, description: 'Ask for help or recommendations' },
  { key: 'recommendation', label: 'Recommendation', icon: Star, description: 'Recommend a service or shop' },
  { key: 'rental', label: 'Rental Listing', icon: Home, description: 'List a property for rent' },
  { key: 'buy_sell', label: 'Buy/Sell', icon: ShoppingBag, description: 'List items for sale' },
  { key: 'safety_alert', label: 'Safety Alert', icon: AlertTriangle, description: 'Report a safety concern' },
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

  // Auto-parse rental content
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
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Create Post</h1>
          <div className="w-9" />
        </div>

        <div className="p-4">
          <p className="text-neutral-600 mb-4">What would you like to share?</p>
          <div className="space-y-2">
            {postTypes.map(({ key, label, icon: Icon, description }) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-neutral-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-neutral-900">{label}</p>
                  <p className="text-sm text-neutral-500">{description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
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
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <button type="button" onClick={() => setSelectedType(null)} className="p-2 -ml-2">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary-500" />
            <span className="font-medium">{selectedTypeInfo.label}</span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary px-4 py-1.5"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Title (optional) */}
          <div>
            <input
              type="text"
              {...register('title')}
              placeholder="Add a title (optional)"
              className="w-full text-xl font-semibold border-none outline-none placeholder:text-neutral-400"
            />
          </div>

          {/* Content */}
          <div>
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
              rows={6}
              className="w-full border-none outline-none resize-none placeholder:text-neutral-400"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message as string}</p>
            )}
          </div>

          {/* Parsed Rental Info */}
          {selectedType === 'rental' && parsedRental && Object.keys(parsedRental).length > 0 && (
            <div className="p-3 bg-primary-50 rounded-lg">
              <p className="text-sm font-medium text-primary-700 mb-2">Auto-detected:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {parsedRental.bhk && <span>BHK: {parsedRental.bhk}</span>}
                {parsedRental.rentAmount && <span>Rent: ₹{parsedRental.rentAmount.toLocaleString()}</span>}
                {parsedRental.depositAmount && <span>Deposit: ₹{parsedRental.depositAmount.toLocaleString()}</span>}
                {parsedRental.furnishing && <span>Furnishing: {parsedRental.furnishing}</span>}
                {parsedRental.locality && <span>Area: {parsedRental.locality}</span>}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <input
              type="text"
              {...register('tags')}
              placeholder="Add tags (comma separated)"
              className="w-full text-sm border-none outline-none placeholder:text-neutral-400"
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-4 pt-4 border-t border-neutral-200">
            <button type="button" className="flex items-center gap-2 text-neutral-600 hover:text-primary-500">
              <Image className="w-5 h-5" />
              <span className="text-sm">Photos</span>
            </button>
            <button type="button" className="flex items-center gap-2 text-neutral-600 hover:text-primary-500">
              <MapPin className="w-5 h-5" />
              <span className="text-sm">Location</span>
            </button>
            {selectedType === 'safety_alert' && (
              <label className="flex items-center gap-2 ml-auto">
                <input
                  type="checkbox"
                  {...register('isUrgent')}
                  className="w-4 h-4 text-red-500 border-neutral-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-red-600">Mark as Urgent</span>
              </label>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
