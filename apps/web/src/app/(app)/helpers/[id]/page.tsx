'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo } from '@apnigully/shared';

function getTrustLevel(score: number) {
  if (score >= 80) return 'verified';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
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
      const response: any = await api.post('/chats', {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-button)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-[var(--text-secondary)] mb-4">Helper not found</p>
          <button onClick={() => router.back()} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen">
        {/* Shimmer Header */}
        <div className="sticky top-0 glass px-4 py-3 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] animate-pulse" />
          <div className="h-5 w-32 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
        </div>
        {/* Shimmer Profile */}
        <div className="p-4">
          <div className="card p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-[var(--bg-tertiary)] animate-pulse mx-auto mb-4" />
            <div className="h-6 w-40 rounded-lg bg-[var(--bg-tertiary)] animate-pulse mx-auto mb-2" />
            <div className="h-4 w-24 rounded-lg bg-[var(--bg-tertiary)] animate-pulse mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="h-16 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="h-16 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="h-16 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const helper = data.data;
  const trustLevel = getTrustLevel(helper.user?.trustScore || 0);
  const avgRating = helper.reviews?.length
    ? (helper.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / helper.reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 glass px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
        <h1 className="font-bold text-[var(--text-primary)]">Helper Profile</h1>
      </div>

      {/* Profile Header Card with Gradient */}
      <div className="p-4 animate-slide-up">
        <div className="card overflow-hidden">
          {/* Gradient Banner */}
          <div className="h-28 relative" style={{ background: 'var(--gradient-hero)' }}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/20" />
              <div className="absolute bottom-2 right-12 w-10 h-10 rounded-full bg-white/15" />
            </div>
          </div>

          {/* Avatar overlapping the banner */}
          <div className="relative px-6 pb-6">
            <div className="-mt-14 mb-4 flex justify-center">
              <div className="avatar-ring">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-elevated border-4 border-[var(--bg-card)]" style={{ background: 'var(--gradient-button)' }}>
                  {helper.user?.name?.charAt(0).toUpperCase() || 'H'}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{helper.user?.name}</h2>
                {helper.isVerified && <CheckCircle className="w-5 h-5 text-primary-500" />}
              </div>

              <p className="font-semibold text-primary-500 mb-3">{helper.category}</p>

              <div className="flex items-center justify-center gap-4 text-sm text-[var(--text-muted)] mb-4">
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

              {/* Trust Score Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${
                trustLevel === 'high' ? 'bg-green-50' :
                trustLevel === 'medium' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <Shield className={`w-4 h-4 ${
                  trustLevel === 'high' ? 'text-green-500' :
                  trustLevel === 'medium' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Trust Score: {helper.user?.trustScore || 0}
                </span>
                <span className={`badge text-xs px-2 py-0.5 rounded-full font-semibold ${
                  trustLevel === 'high' ? 'bg-green-100 text-green-700' :
                  trustLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {trustLevel.charAt(0).toUpperCase() + trustLevel.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-4 pb-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="card shadow-elevated p-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold gradient-text">{helper._count?.tasks || 0}</p>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-1">Tasks Done</p>
            </div>
            <div className="text-center border-x border-[var(--border-color-light)]">
              <p className="text-2xl font-bold gradient-text">{helper._count?.endorsements || 0}</p>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-1">Endorsements</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold gradient-text">
                {helper.experience ? `${helper.experience}y` : '-'}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-1">Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      {helper.bio && (
        <div className="px-4 pb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">About</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">{helper.bio}</p>
          </div>
        </div>
      )}

      {/* Services / Skills */}
      {helper.services && helper.services.length > 0 && (
        <div className="px-4 pb-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">Services</h3>
            <div className="flex flex-wrap gap-2">
              {helper.services.map((service: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium"
                  style={{
                    background: idx % 3 === 0 ? 'var(--color-primary-100)' : idx % 3 === 1 ? 'var(--color-secondary-100)' : '#D1FAE5',
                    color: idx % 3 === 0 ? 'var(--color-primary-700)' : idx % 3 === 1 ? 'var(--color-secondary-700)' : '#065F46',
                  }}
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Availability */}
      {helper.availability && (
        <div className="px-4 pb-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">Availability</h3>
            <div className="flex items-center gap-3 text-[var(--text-secondary)]">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-500" />
              </div>
              <span>{helper.availability.hours || '9 AM - 6 PM'}</span>
            </div>
            {helper.availability.days && (
              <div className="flex items-center gap-3 text-[var(--text-secondary)] mt-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-secondary-500" />
                </div>
                <span>{helper.availability.days.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing */}
      {helper.hourlyRate && (
        <div className="px-4 pb-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">Pricing</h3>
            <p className="text-3xl font-bold gradient-text">
              {'\u20B9'}{helper.hourlyRate}<span className="text-sm font-normal text-[var(--text-muted)]">/hour</span>
            </p>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="px-4 pb-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)]">Reviews</h3>
            {avgRating && (
              <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-bold text-yellow-700">{avgRating}</span>
                <span className="text-yellow-600 text-sm">({helper.reviews?.length})</span>
              </div>
            )}
          </div>

          {(!helper.reviews || helper.reviews.length === 0) ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--gradient-button)', opacity: 0.15 }}>
                <Star className="w-6 h-6 text-primary-500" />
              </div>
              <p className="text-[var(--text-muted)] text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {helper.reviews.slice(0, 5).map((review: any) => (
                <div key={review.id} className="border-b border-[var(--border-color-light)] pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: 'var(--gradient-button)' }}>
                        {review.reviewer?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[var(--text-primary)]">{review.reviewer?.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatTimeAgo(new Date(review.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-[var(--border-color)]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{review.comment}</p>
                  )}
                  {review.task && (
                    <p className="text-xs text-primary-500 mt-2 font-medium">
                      Task: {review.task.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Endorsements */}
      {helper.endorsements && helper.endorsements.length > 0 && (
        <div className="px-4 pb-4 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <div className="card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">Endorsed By</h3>
            <div className="flex -space-x-2">
              {helper.endorsements.slice(0, 8).map((endorsement: any, idx: number) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold border-2 border-[var(--bg-card)] shadow-card"
                  style={{ background: 'var(--gradient-button)' }}
                  title={endorsement.endorser?.name}
                >
                  {endorsement.endorser?.name?.charAt(0) || 'U'}
                </div>
              ))}
              {helper.endorsements.length > 8 && (
                <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center text-[var(--text-secondary)] text-sm font-semibold border-2 border-[var(--bg-card)]">
                  +{helper.endorsements.length - 8}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 glass p-4 max-w-2xl mx-auto z-10">
        <div className="flex gap-3">
          <button
            onClick={handleEndorse}
            className="btn btn-ghost flex-1 press-scale"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Endorse
          </button>
          <button
            onClick={handleContact}
            disabled={isContacting}
            className="btn btn-primary flex-1 press-scale"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isContacting ? 'Starting...' : 'Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
