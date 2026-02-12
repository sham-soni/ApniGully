'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher } from '@/lib/api';
import { formatTimeAgo, POST_TYPE_LABELS } from '@apnigully/shared';
import {
  MessageCircle,
  Heart,
  Bookmark,
  Share2,
  MoreHorizontal,
  Filter,
  AlertTriangle,
  Home as HomeIcon,
  Wrench,
  Star,
  ShoppingBag,
  Megaphone,
} from 'lucide-react';

const postTypeIcons: Record<string, any> = {
  announcement: Megaphone,
  request: Wrench,
  recommendation: Star,
  rental: HomeIcon,
  helper_listing: Wrench,
  buy_sell: ShoppingBag,
  safety_alert: AlertTriangle,
};

const filterTypes = [
  { key: 'all', label: 'All' },
  { key: 'request', label: 'Requests' },
  { key: 'rental', label: 'Rentals' },
  { key: 'helper_listing', label: 'Helpers' },
  { key: 'recommendation', label: 'Reviews' },
  { key: 'safety_alert', label: 'Alerts' },
];

export default function FeedPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');

  const neighborhoodId = user?.memberships?.[0]?.neighborhoodId;

  const { data, error, isLoading, mutate } = useSWR(
    neighborhoodId
      ? `/posts/feed/${neighborhoodId}?${activeFilter !== 'all' ? `type=${activeFilter}` : ''}`
      : null,
    fetcher
  );

  if (!neighborhoodId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <HomeIcon className="w-16 h-16 text-neutral-300 mb-4" />
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Join a Neighborhood</h2>
        <p className="text-neutral-600 text-center mb-6">
          Connect with your neighbors by joining a neighborhood community.
        </p>
        <Link href="/onboarding/neighborhood" className="btn btn-primary">
          Find Your Neighborhood
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Compose Box */}
      <div className="bg-white border-b border-neutral-200 p-4">
        <Link
          href="/create"
          className="flex items-center gap-3 p-3 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
        >
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-neutral-500">Share something with your neighbors...</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {filterTypes.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === key
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="divide-y divide-neutral-200">
        {isLoading && (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-red-500">
            Failed to load posts. Please try again.
          </div>
        )}

        {data?.data?.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            No posts yet. Be the first to share something!
          </div>
        )}

        {data?.data?.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const Icon = postTypeIcons[post.type] || Megaphone;
  const typeLabel = POST_TYPE_LABELS[post.type]?.en || post.type;

  const typeColors: Record<string, string> = {
    announcement: 'bg-blue-100 text-blue-700',
    request: 'bg-orange-100 text-orange-700',
    recommendation: 'bg-green-100 text-green-700',
    rental: 'bg-purple-100 text-purple-700',
    helper_listing: 'bg-cyan-100 text-cyan-700',
    buy_sell: 'bg-pink-100 text-pink-700',
    safety_alert: 'bg-red-100 text-red-700',
  };

  return (
    <article className="bg-white p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 font-medium">
            {post.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-900">{post.user?.name}</span>
              {post.user?.isVerified && (
                <span className="text-primary-500 text-xs">Verified</span>
              )}
            </div>
            <span className="text-sm text-neutral-500">
              {formatTimeAgo(new Date(post.createdAt))}
            </span>
          </div>
        </div>
        <button className="p-1 text-neutral-400 hover:text-neutral-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Type Badge */}
      <div className="mb-2">
        <span className={`badge ${typeColors[post.type] || 'bg-neutral-100 text-neutral-700'}`}>
          <Icon className="w-3 h-3 mr-1" />
          {typeLabel}
        </span>
        {post.isUrgent && (
          <span className="badge bg-red-100 text-red-700 ml-2">Urgent</span>
        )}
      </div>

      {/* Content */}
      <Link href={`/posts/${post.id}`}>
        {post.title && (
          <h3 className="font-semibold text-neutral-900 mb-1">{post.title}</h3>
        )}
        <p className="text-neutral-700 whitespace-pre-wrap line-clamp-4">{post.content}</p>
      </Link>

      {/* Images */}
      {post.images?.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
          {post.images.slice(0, 4).map((img: string, i: number) => (
            <div
              key={i}
              className="aspect-square bg-neutral-200 rounded-lg overflow-hidden"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-sm text-primary-600">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
        <button className="flex items-center gap-2 text-neutral-500 hover:text-red-500 transition-colors">
          <Heart className={`w-5 h-5 ${post.userReaction ? 'fill-red-500 text-red-500' : ''}`} />
          <span className="text-sm">{post._count?.reactions || 0}</span>
        </button>
        <Link
          href={`/posts/${post.id}`}
          className="flex items-center gap-2 text-neutral-500 hover:text-primary-500 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post._count?.comments || 0}</span>
        </Link>
        <button className="flex items-center gap-2 text-neutral-500 hover:text-primary-500 transition-colors">
          <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-primary-500 text-primary-500' : ''}`} />
        </button>
        <button className="flex items-center gap-2 text-neutral-500 hover:text-primary-500 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
