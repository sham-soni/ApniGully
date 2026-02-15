'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo } from '@apnigully/shared';

const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Tag,
  Share2,
  CheckCircle,
  ExternalLink,
  Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isContacting, setIsContacting] = useState(false);

  const shopId = params.id as string;
  const { data, error } = useSWR<any>(`/shops/${shopId}`, fetcher);

  const handleContact = async () => {
    if (!user) {
      toast.error('Please login to contact');
      return;
    }

    setIsContacting(true);
    try {
      const response: any = await api.post('/chats', {
        participantId: data.data.ownerId,
        shopId: shopId,
      });
      router.push(`/inbox/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    } finally {
      setIsContacting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-button)' }}>
            <Tag className="w-8 h-8 text-white" />
          </div>
          <p className="text-[var(--text-secondary)] mb-4">Shop not found</p>
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
          <div className="h-5 w-28 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
        </div>
        {/* Shimmer Banner */}
        <div className="h-48 bg-[var(--bg-tertiary)] animate-pulse" />
        {/* Shimmer Content */}
        <div className="p-4 space-y-4">
          <div className="card p-5 space-y-3">
            <div className="h-6 w-48 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            <div className="h-4 w-32 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            <div className="h-4 w-full rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
          </div>
          <div className="card p-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="h-16 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="h-16 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shop = data.data;
  const avgRating = shop.reviews?.length
    ? (shop.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / shop.reviews.length).toFixed(1)
    : null;

  const activeOffers = shop.offers?.filter((o: any) =>
    new Date(o.validUntil) > new Date() && o.isActive
  ) || [];

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
        <h1 className="font-bold text-[var(--text-primary)]">Shop Details</h1>
      </div>

      {/* Category Gradient Banner */}
      {shop.images && shop.images.length > 0 ? (
        <div className="relative h-52 animate-fade-in">
          <img
            src={shop.images[0]}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Floating category badge */}
          <div className="absolute bottom-4 left-4">
            <span className="px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-elevated" style={{ background: 'var(--gradient-button)' }}>
              {shop.category}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-40 relative animate-fade-in" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-6 left-12 w-20 h-20 rounded-full bg-white/20" />
            <div className="absolute bottom-4 right-16 w-12 h-12 rounded-full bg-white/15" />
          </div>
          <div className="absolute bottom-4 left-4">
            <span className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-white/20 backdrop-blur-sm">
              {shop.category}
            </span>
          </div>
        </div>
      )}

      {/* Shop Info Card */}
      <div className="px-4 -mt-4 relative z-[1] animate-slide-up">
        <div className="card shadow-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{shop.name}</h2>
                {shop.isVerified && <CheckCircle className="w-5 h-5 text-primary-500" />}
              </div>
              <p className="text-primary-500 font-semibold text-sm">{shop.category}</p>
            </div>
            {avgRating && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 shadow-card">
                <Star className="w-4 h-4 text-green-600 fill-current" />
                <span className="font-bold text-green-700">{avgRating}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-3">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span>{shop.address || shop.neighborhood?.name}</span>
          </div>

          {shop.description && (
            <p className="text-[var(--text-secondary)] leading-relaxed">{shop.description}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pt-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="card shadow-card p-4">
          <div className="grid grid-cols-3 gap-3">
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="flex flex-col items-center gap-2 p-3 bg-[var(--bg-tertiary)] rounded-2xl press-scale transition-colors hover:bg-[var(--color-primary-100)]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-button)' }}>
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Call</span>
              </a>
            )}
            <button
              onClick={handleContact}
              className="flex flex-col items-center gap-2 p-3 bg-[var(--bg-tertiary)] rounded-2xl press-scale transition-colors hover:bg-[var(--color-secondary-100)]"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-[var(--text-secondary)]">Message</span>
            </button>
            <button
              onClick={() => {
                navigator.share?.({
                  title: shop.name,
                  url: window.location.href,
                }).catch(() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied');
                });
              }}
              className="flex flex-col items-center gap-2 p-3 bg-[var(--bg-tertiary)] rounded-2xl press-scale transition-colors hover:bg-green-50"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-[var(--text-secondary)]">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      {shop.timing && (
        <div className="px-4 pt-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="card shadow-card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-500" />
              </div>
              Business Hours
            </h3>
            <div className="space-y-2.5 text-sm">
              {Object.entries(shop.timing).map(([day, hours]: [string, any]) => (
                <div key={day} className="flex justify-between items-center py-1">
                  <span className="text-[var(--text-secondary)] capitalize font-medium">{day}</span>
                  <span className={`font-semibold ${hours === 'Closed' ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                    {hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Offers */}
      {activeOffers.length > 0 && (
        <div className="px-4 pt-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="card shadow-card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Percent className="w-4 h-4 text-primary-500" />
              </div>
              Active Offers
            </h3>
            <div className="space-y-3">
              {activeOffers.map((offer: any) => (
                <div
                  key={offer.id}
                  className="rounded-2xl p-4 border border-[var(--border-color-light)] overflow-hidden relative"
                  style={{ background: 'var(--gradient-hero)' }}
                >
                  <div className="relative z-[1]">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-white">{offer.title}</h4>
                      <span className="bg-white text-primary-600 text-xs font-bold px-3 py-1 rounded-xl shadow-card">
                        {offer.discountPercent}% OFF
                      </span>
                    </div>
                    {offer.description && (
                      <p className="text-sm text-white/80 mb-2">{offer.description}</p>
                    )}
                    <p className="text-xs text-white/70 font-medium">
                      Valid until {new Date(offer.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products/Services */}
      {shop.products && shop.products.length > 0 && (
        <div className="px-4 pt-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="card shadow-card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Tag className="w-4 h-4 text-primary-500" />
              </div>
              Products & Services
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {shop.products.map((product: any, idx: number) => (
                <div key={idx} className="bg-[var(--bg-tertiary)] rounded-2xl p-4 press-scale-sm transition-colors hover:bg-[var(--color-primary-100)]">
                  <p className="font-semibold text-[var(--text-primary)]">{product.name}</p>
                  {product.price && (
                    <p className="text-primary-500 font-bold mt-1">{formatINR(product.price)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="px-4 pt-4 pb-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
        <div className="card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[var(--text-primary)]">Reviews</h3>
            {avgRating && (
              <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-bold text-yellow-700">{avgRating}</span>
                <span className="text-yellow-600 text-sm">({shop.reviews?.length})</span>
              </div>
            )}
          </div>

          {(!shop.reviews || shop.reviews.length === 0) ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--gradient-button)', opacity: 0.15 }}>
                <Star className="w-6 h-6 text-primary-500" />
              </div>
              <p className="text-[var(--text-muted)] text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shop.reviews.slice(0, 5).map((review: any) => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 glass p-4 max-w-2xl mx-auto z-10">
        <div className="flex gap-3">
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="btn btn-ghost flex-1 press-scale"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </a>
          )}
          <button
            onClick={handleContact}
            disabled={isContacting}
            className="btn btn-primary flex-1 press-scale"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isContacting ? 'Starting...' : 'Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
