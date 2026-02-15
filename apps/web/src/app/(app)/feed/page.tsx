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
  AlertTriangle,
  Home as HomeIcon,
  Wrench,
  Star,
  ShoppingBag,
  Megaphone,
  MapPin,
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
  { key: 'all', label: 'All', color: 'bg-gradient-to-r from-primary-500 to-secondary-500' },
  { key: 'request', label: 'Requests', dot: 'bg-orange-500' },
  { key: 'rental', label: 'Rentals', dot: 'bg-purple-500' },
  { key: 'helper_listing', label: 'Helpers', dot: 'bg-cyan-500' },
  { key: 'recommendation', label: 'Reviews', dot: 'bg-emerald-500' },
  { key: 'safety_alert', label: 'Alerts', dot: 'bg-red-500' },
];

export default function FeedPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');

  const neighborhoodId = user?.memberships?.[0]?.neighborhoodId;

  const { data, error, isLoading, mutate } = useSWR<any>(
    neighborhoodId
      ? `/posts/feed/${neighborhoodId}?${activeFilter !== 'all' ? `type=${activeFilter}` : ''}`
      : null,
    fetcher
  );

  if (!neighborhoodId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
             style={{ background: 'var(--gradient-hero-soft)' }}>
          <MapPin className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Join a Neighborhood</h2>
        <p className="text-[var(--text-muted)] text-center mb-6 max-w-xs">
          Connect with your neighbors by joining a neighborhood community.
        </p>
        <Link href="/onboarding/neighborhood" className="btn btn-primary px-8">
          Find Your Neighborhood
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Compose Box */}
      <div className="p-4">
        <Link
          href="/create"
          className="card flex items-center gap-3 p-4 shadow-card card-hover"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-primary-700 avatar-ring flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))' }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-[var(--text-muted)] text-sm">Share something with your neighbors...</span>
        </Link>
      </div>

      {/* Filter Pills */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {filterTypes.map(({ key, label, dot }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 press-scale-sm ${
                activeFilter === key
                  ? 'text-white shadow-md'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] shadow-card hover:shadow-card-hover'
              }`}
              style={activeFilter === key ? { background: 'var(--gradient-button)' } : undefined}
            >
              {dot && activeFilter !== key && (
                <span className={`w-2 h-2 rounded-full ${dot}`} />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 space-y-4 pb-6">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-28 rounded-lg" />
                    <div className="skeleton h-3 w-16 rounded-lg" />
                  </div>
                </div>
                <div className="skeleton h-4 w-full rounded-lg" />
                <div className="skeleton h-4 w-3/4 rounded-lg" />
                <div className="skeleton h-40 w-full rounded-2xl" />
              </div>
            ))}
          </>
        )}

        {error && (
          <div className="card p-8 text-center">
            <p className="text-red-500 font-medium">Failed to load posts. Please try again.</p>
          </div>
        )}

        {data?.data?.length === 0 && (
          <div className="card p-12 text-center">
            <Megaphone className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[var(--text-muted)] font-medium">No posts yet. Be the first to share something!</p>
          </div>
        )}

        {data?.data?.map((post: any, index: number) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, index }: { post: any; index: number }) {
  const [liked, setLiked] = useState(!!post.userReaction);
  const [likeCount, setLikeCount] = useState(post._count?.reactions || 0);
  const [animateLike, setAnimateLike] = useState(false);

  const Icon = postTypeIcons[post.type] || Megaphone;
  const typeLabel = POST_TYPE_LABELS[post.type]?.en || post.type;

  const typeColors: Record<string, { bg: string; text: string; dot: string }> = {
    announcement: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    request: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    recommendation: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    rental: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    helper_listing: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    buy_sell: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
    safety_alert: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  };

  const colors = typeColors[post.type] || { bg: 'bg-neutral-50', text: 'text-neutral-700', dot: 'bg-neutral-500' };

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    if (!liked) {
      setAnimateLike(true);
      setTimeout(() => setAnimateLike(false), 400);
    }
  };

  return (
    <article className="card shadow-card animate-slide-up" style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
                 style={{ background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))', color: 'var(--color-primary-700)' }}>
              {post.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-primary)] text-sm">{post.user?.name}</span>
                {post.user?.isVerified && (
                  <span className="badge-gradient badge text-[10px] px-2 py-0.5">Verified</span>
                )}
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {formatTimeAgo(new Date(post.createdAt))}
              </span>
            </div>
          </div>
          <button className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors press-scale-sm">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Type Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`badge ${colors.bg} ${colors.text}`}>
            <Icon className="w-3 h-3 mr-1.5" />
            {typeLabel}
          </span>
          {post.isUrgent && (
            <span className="badge bg-red-100 text-red-700">Urgent</span>
          )}
        </div>

        {/* Content */}
        <Link href={`/posts/${post.id}`} className="block press-scale-sm">
          {post.title && (
            <h3 className="font-bold text-[var(--text-primary)] mb-1.5">{post.title}</h3>
          )}
          <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap line-clamp-4 leading-relaxed">{post.content}</p>
        </Link>

        {/* Images */}
        {post.images?.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
            {post.images.slice(0, 4).map((img: string, i: number) => (
              <div
                key={i}
                className="aspect-square bg-[var(--bg-tertiary)] rounded-xl overflow-hidden"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs font-semibold text-primary-500">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color-light)]">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-red-500 transition-all press-scale-sm"
          >
            <Heart className={`w-5 h-5 transition-all ${liked ? 'fill-red-500 text-red-500' : ''} ${animateLike ? 'animate-heart-beat' : ''}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-secondary-500 transition-colors press-scale-sm"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post._count?.comments || 0}</span>
          </Link>
          <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-primary-500 transition-colors press-scale-sm">
            <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-primary-500 text-primary-500' : ''}`} />
          </button>
          <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-secondary-500 transition-colors press-scale-sm">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
