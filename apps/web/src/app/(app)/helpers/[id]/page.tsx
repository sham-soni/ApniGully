'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo } from '@apnigully/shared';

function getTrustLevel(score: number) {
  if (score >= 80) return { label: 'Highly Trusted', color: 'text-green-600' };
  if (score >= 50) return { label: 'Trusted', color: 'text-blue-600' };
  if (score >= 20) return { label: 'Building Trust', color: 'text-yellow-600' };
  return { label: 'New', color: 'text-neutral-500' };
}
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Shield,
  Clock,
  Calendar,
  CheckCircle,
  ThumbsUp,
  Share2,
  Flag,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HelperProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isContacting, setIsContacting] = useState(false);

  const helperId = params.id as string;
  const { data, error } = useSWR(`/helpers/${helperId}`, fetcher) as { data: { data: any } | undefined; error: any };

  const handleContact = async () => {
    if (!user) {
      toast.error('Please login to contact');
      return;
    }

    setIsContacting(true);
    try {
      const response = await api.post('/chats', {
        participantId: data.data.userId,
        helperProfileId: helperId,
      });
      router.push(`/inbox/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    } finally {
      setIsContacting(false);
    }
  };

  const handleEndorse = async () => {
    if (!user) {
      toast.error('Please login to endorse');
      return;
    }

    try {
      await api.post(`/helpers/${helperId}/endorse`);
      toast.success('Endorsement added!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to endorse');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-neutral-500 mb-4">Helper not found</p>
        <button onClick={() => router.back()} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const helper = data.data;
  const trustLevel = getTrustLevel(helper.user?.trustScore || 0);
  const avgRating = helper.reviews?.length
    ? (helper.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / helper.reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-medium text-neutral-900">Helper Profile</h1>
      </div>

      {/* Profile Header */}
      <div className="p-6 text-center border-b border-neutral-100">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-3xl font-bold mx-auto mb-4">
          {helper.user?.name?.charAt(0).toUpperCase() || 'H'}
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-neutral-900">{helper.user?.name}</h2>
          {helper.isVerified && <CheckCircle className="w-5 h-5 text-primary-500" />}
        </div>

        <p className="text-primary-600 font-medium mb-2">{helper.category}</p>

        <div className="flex items-center justify-center gap-4 text-sm text-neutral-500 mb-4">
          {avgRating && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              {avgRating} ({helper.reviews?.length} reviews)
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {helper.areas?.join(', ') || 'Local'}
          </span>
        </div>

        {/* Trust Score */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-full">
          <Shield className={`w-4 h-4 ${
            trustLevel === 'high' ? 'text-green-500' :
            trustLevel === 'medium' ? 'text-yellow-500' : 'text-red-500'
          }`} />
          <span className="text-sm font-medium">
            Trust Score: {helper.user?.trustScore || 0}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            trustLevel === 'high' ? 'bg-green-100 text-green-700' :
            trustLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>
            {trustLevel.charAt(0).toUpperCase() + trustLevel.slice(1)}
          </span>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-neutral-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-neutral-900">{helper._count?.tasks || 0}</p>
          <p className="text-xs text-neutral-500">Tasks Done</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-neutral-900">{helper._count?.endorsements || 0}</p>
          <p className="text-xs text-neutral-500">Endorsements</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-neutral-900">
            {helper.experience ? `${helper.experience}y` : '-'}
          </p>
          <p className="text-xs text-neutral-500">Experience</p>
        </div>
      </div>

      {/* About */}
      {helper.bio && (
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-medium text-neutral-900 mb-2">About</h3>
          <p className="text-neutral-600">{helper.bio}</p>
        </div>
      )}

      {/* Services */}
      {helper.services && helper.services.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-medium text-neutral-900 mb-3">Services</h3>
          <div className="flex flex-wrap gap-2">
            {helper.services.map((service: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      {helper.availability && (
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-medium text-neutral-900 mb-3">Availability</h3>
          <div className="flex items-center gap-2 text-neutral-600">
            <Clock className="w-4 h-4" />
            <span>{helper.availability.hours || '9 AM - 6 PM'}</span>
          </div>
          {helper.availability.days && (
            <div className="flex items-center gap-2 text-neutral-600 mt-2">
              <Calendar className="w-4 h-4" />
              <span>{helper.availability.days.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Pricing */}
      {helper.hourlyRate && (
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-medium text-neutral-900 mb-2">Pricing</h3>
          <p className="text-2xl font-bold text-primary-600">
            ₹{helper.hourlyRate}<span className="text-sm font-normal text-neutral-500">/hour</span>
          </p>
        </div>
      )}

      {/* Reviews */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-900">Reviews</h3>
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-medium">{avgRating}</span>
              <span className="text-neutral-400">({helper.reviews?.length})</span>
            </div>
          )}
        </div>

        {(!helper.reviews || helper.reviews.length === 0) ? (
          <p className="text-neutral-500 text-sm">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {helper.reviews.slice(0, 5).map((review: any) => (
              <div key={review.id} className="border-b border-neutral-50 pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {review.reviewer?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.reviewer?.name}</p>
                      <p className="text-xs text-neutral-400">
                        {formatTimeAgo(new Date(review.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-neutral-600">{review.comment}</p>
                )}
                {review.task && (
                  <p className="text-xs text-primary-500 mt-1">
                    Task: {review.task.title}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Endorsements */}
      {helper.endorsements && helper.endorsements.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-medium text-neutral-900 mb-3">Endorsed By</h3>
          <div className="flex -space-x-2">
            {helper.endorsements.slice(0, 8).map((endorsement: any, idx: number) => (
              <div
                key={idx}
                className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-medium border-2 border-white"
                title={endorsement.endorser?.name}
              >
                {endorsement.endorser?.name?.charAt(0) || 'U'}
              </div>
            ))}
            {helper.endorsements.length > 8 && (
              <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 text-sm font-medium border-2 border-white">
                +{helper.endorsements.length - 8}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 max-w-2xl mx-auto">
        <div className="flex gap-3">
          <button
            onClick={handleEndorse}
            className="btn btn-secondary flex-1"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Endorse
          </button>
          <button
            onClick={handleContact}
            disabled={isContacting}
            className="btn btn-primary flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isContacting ? 'Starting...' : 'Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
