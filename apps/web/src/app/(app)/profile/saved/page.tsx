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
  const { data, isLoading, mutate } = useSWR(user ? '/posts/saved' : null, fetcher);

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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-4 border-b border-neutral-200 flex items-center gap-3">
        <Link href="/profile" className="p-1 text-neutral-500 hover:text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">Saved Posts</h1>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16 px-4">
          <Bookmark className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No saved posts yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Tap the bookmark icon on any post to save it here
          </p>
        </div>
      )}

      <div className="divide-y divide-neutral-100">
        {posts.map((post: any) => {
          const Icon = postTypeIcons[post.type] || Megaphone;
          const typeLabel = POST_TYPE_LABELS[post.type]?.en || post.type;

          return (
            <article key={post.id} className="bg-white p-4">
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

              <div className="mb-2">
                <span className={`badge ${typeColors[post.type] || 'bg-neutral-100 text-neutral-700'}`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {typeLabel}
                </span>
              </div>

              <Link href={`/posts/${post.id}`}>
                {post.title && (
                  <h3 className="font-semibold text-neutral-900 mb-1">{post.title}</h3>
                )}
                <p className="text-neutral-700 whitespace-pre-wrap line-clamp-4">{post.content}</p>
              </Link>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                <span className="flex items-center gap-2 text-neutral-500">
                  <Heart className={`w-5 h-5 ${post.userReaction ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-sm">{post._count?.reactions || 0}</span>
                </span>
                <Link
                  href={`/posts/${post.id}`}
                  className="flex items-center gap-2 text-neutral-500 hover:text-primary-500 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post._count?.comments || 0}</span>
                </Link>
                <button
                  onClick={() => handleUnsave(post.id)}
                  className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors"
                >
                  <Bookmark className="w-5 h-5 fill-primary-500" />
                </button>
                <button className="flex items-center gap-2 text-neutral-500 hover:text-primary-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
