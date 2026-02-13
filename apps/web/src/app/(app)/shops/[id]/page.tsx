'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo, formatINR } from '@apnigully/shared';
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
  const { data, error } = useSWR(`/shops/${shopId}`, fetcher);

  const handleContact = async () => {
    if (!user) {
      toast.error('Please login to contact');
      return;
    }

    setIsContacting(true);
    try {
      const response = await api.post('/chats', {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-neutral-500 mb-4">Shop not found</p>
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

  const shop = data.data;
  const avgRating = shop.reviews?.length
    ? (shop.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / shop.reviews.length).toFixed(1)
    : null;

  const activeOffers = shop.offers?.filter((o: any) =>
    new Date(o.validUntil) > new Date() && o.isActive
  ) || [];

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
        <h1 className="font-medium text-neutral-900">Shop Details</h1>
      </div>

      {/* Shop Image */}
      {shop.images && shop.images.length > 0 ? (
        <div className="relative h-48 bg-neutral-100">
          <img
            src={shop.images[0]}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-r from-primary-400 to-primary-600" />
      )}

      {/* Shop Info */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">{shop.name}</h2>
              {shop.isVerified && <CheckCircle className="w-5 h-5 text-primary-500" />}
            </div>
            <p className="text-primary-600">{shop.category}</p>
          </div>
          {avgRating && (
            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
              <Star className="w-4 h-4 text-green-600 fill-current" />
              <span className="font-medium text-green-700">{avgRating}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-neutral-500 text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span>{shop.address || shop.neighborhood?.name}</span>
        </div>

        {shop.description && (
          <p className="text-neutral-600">{shop.description}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-neutral-100">
        {shop.phone && (
          <a
            href={`tel:${shop.phone}`}
            className="flex flex-col items-center gap-1 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100"
          >
            <Phone className="w-5 h-5 text-primary-600" />
            <span className="text-xs text-neutral-600">Call</span>
          </a>
        )}
        <button
          onClick={handleContact}
          className="flex flex-col items-center gap-1 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100"
        >
          <MessageCircle className="w-5 h-5 text-primary-600" />
          <span className="text-xs text-neutral-600">Message</span>
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
          className="flex flex-col items-center gap-1 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100"
        >
          <Share2 className="w-5 h-5 text-primary-600" />
          <span className="text-xs text-neutral-600">Share</span>
        </button>
      </div>

      {/* Business Hours */}
      {shop.timing && (
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Business Hours
          </h3>
          <div className="space-y-2 text-sm">
            {Object.entries(shop.timing).map(([day, hours]: [string, any]) => (
              <div key={day} className="flex justify-between">
                <span className="text-neutral-600 capitalize">{day}</span>
                <span className={hours === 'Closed' ? 'text-red-500' : 'text-neutral-900'}>
                  {hours}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Offers */}
      {activeOffers.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Active Offers
          </h3>
          <div className="space-y-3">
            {activeOffers.map((offer: any) => (
              <div
                key={offer.id}
                className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-primary-900">{offer.title}</h4>
                  <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                    {offer.discountPercent}% OFF
                  </span>
                </div>
                {offer.description && (
                  <p className="text-sm text-primary-700 mb-2">{offer.description}</p>
                )}
                <p className="text-xs text-primary-600">
                  Valid until {new Date(offer.validUntil).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products/Services */}
      {shop.products && shop.products.length > 0 && (
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Products & Services
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {shop.products.map((product: any, idx: number) => (
              <div key={idx} className="bg-neutral-50 rounded-lg p-3">
                <p className="font-medium text-neutral-900">{product.name}</p>
                {product.price && (
                  <p className="text-primary-600 font-medium">{formatINR(product.price)}</p>
                )}
              </div>
            ))}
          </div>
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
              <span className="text-neutral-400">({shop.reviews?.length})</span>
            </div>
          )}
        </div>

        {(!shop.reviews || shop.reviews.length === 0) ? (
          <p className="text-neutral-500 text-sm">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {shop.reviews.slice(0, 5).map((review: any) => (
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 max-w-2xl mx-auto">
        <div className="flex gap-3">
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="btn btn-secondary flex-1"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </a>
          )}
          <button
            onClick={handleContact}
            disabled={isContacting}
            className="btn btn-primary flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isContacting ? 'Starting...' : 'Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
