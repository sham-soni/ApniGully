'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo, POST_TYPE_LABELS } from '@apnigully/shared';
import {
  ArrowLeft,
  Bookmark,
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  Megaphone,
  Wrench,
  Star,
  Home as HomeIcon,
  ShoppingBag,
} from 'lucide-react';

const postTypeIcons: Record<string, any> = {
  announcement: Megaphone,
  request: Wrench,
  recommendation: Star,
  rental: HomeIcon,
  helper_listing: Wrench,
  buy_sell: ShoppingBag,
  safety_alert: Megaphone,
};

const typeColors: Record<string, string> = {
  announcement: 'bg-blue-100 text-blue-700',
  request: 'bg-orange-100 text-orange-700',
  recommendation: 'bg-green-100 text-green-700',
  rental: 'bg-purple-100 text-purple-700',
  helper_listing: 'bg-cyan-100 text-cyan-700',
  buy_sell: 'bg-pink-100 text-pink-700',
  safety_alert: 'bg-red-100 text-red-700',
};

export default function SavedPostsPage() {
  const { user } = useAuth();
  const { data, isLoading, mutate } = useSWR(user ? '/posts/saved' : null, fetcher) as { data: { data: any[] } | undefined; isLoading: boolean; mutate: any };

  const handleUnsave = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/save`);
      mutate();
    } catch (error) {
      // ignore
    }
  };

  const posts = data?.data || [];

  return (
    <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 z-10">
        <Link
          href="/profile"
          className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-[var(--text-primary)]" />
        </Link>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Saved Posts</h1>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="p-4">
          <div className="card shadow-card text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-2">No saved posts yet</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Tap the bookmark icon on any post to save it here
            </p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {posts.map((post: any) => {
          const Icon = postTypeIcons[post.type] || Megaphone;
          const typeLabel = POST_TYPE_LABELS[post.type]?.en || post.type;

          return (
            <article key={post.id} className="card shadow-card card-hover p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center text-[var(--text-secondary)] font-bold ring-2 ring-[var(--border-color-light)]">
                    {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--text-primary)]">{post.user?.name}</span>
                      {post.user?.isVerified && (
                        <span className="text-primary-500 text-xs font-semibold">Verified</span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTimeAgo(new Date(post.createdAt))}
                    </span>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] press-scale-sm">
                  <MoreHorizontal className="w-[18px] h-[18px]" />
                </button>
              </div>

              <div className="mb-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeColors[post.type] || 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                  <Icon className="w-3 h-3" />
                  {typeLabel}
                </span>
              </div>

              <Link href={`/posts/${post.id}`}>
                {post.title && (
                  <h3 className="font-bold text-[var(--text-primary)] mb-1">{post.title}</h3>
                )}
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-4">{post.content}</p>
              </Link>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color-light)]">
                <span className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Heart className={`w-[18px] h-[18px] ${post.userReaction ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-xs font-medium">{post._count?.reactions || 0}</span>
                </span>
                <Link
                  href={`/posts/${post.id}`}
                  className="flex items-center gap-2 text-[var(--text-muted)] hover:text-primary-500 transition-colors"
                >
                  <MessageCircle className="w-[18px] h-[18px]" />
                  <span className="text-xs font-medium">{post._count?.comments || 0}</span>
                </Link>
                <button
                  onClick={() => handleUnsave(post.id)}
                  className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors press-scale-sm"
                >
                  <Bookmark className="w-[18px] h-[18px] fill-primary-500" />
                </button>
                <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-primary-500 transition-colors press-scale-sm">
                  <Share2 className="w-[18px] h-[18px]" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
