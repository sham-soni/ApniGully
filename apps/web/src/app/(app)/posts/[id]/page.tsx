'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo, POST_TYPE_LABELS } from '@apnigully/shared';

const POST_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  announcement: { label: 'Announcement', color: 'var(--color-primary-500)' },
  request: { label: 'Request', color: '#f97316' },
  recommendation: { label: 'Recommendation', color: '#eab308' },
  rental: { label: 'Rental', color: '#a855f7' },
  helper_listing: { label: 'Helper', color: '#06b6d4' },
  buy_sell: { label: 'Buy/Sell', color: '#10b981' },
  safety_alert: { label: 'Alert', color: '#ef4444' },
  update: { label: 'Update', color: 'var(--color-primary-500)' },
  alert: { label: 'Alert', color: '#ef4444' },
  event: { label: 'Event', color: '#8b5cf6' },
  question: { label: 'Question', color: '#3b82f6' },
  lost_found: { label: 'Lost & Found', color: '#f59e0b' },
};
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  MapPin,
  Flag,
  Bookmark,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const postId = params.id as string;
  const { data, mutate, error } = useSWR(`/posts/${postId}`, fetcher) as { data: { data: any } | undefined; mutate: any; error: any };

  const handleReaction = async () => {
    if (!user) {
      toast.error('Please login to react');
      return;
    }

    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 600);

    try {
      await api.post(`/posts/${postId}/reactions`, { type: 'like' });
      mutate();
    } catch (error) {
      console.error('Reaction failed:', error);
    }
  };

  const handleComment = async () => {
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comments`, { content: comment.trim() });
      setComment('');
      mutate();
      toast.success('Comment added');
    } catch (error) {
      console.error('Comment failed:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    setShowMenu(false);
    const reason = prompt('Why are you reporting this post?');
    if (!reason) return;

    try {
      await api.post('/reports', {
        targetType: 'post',
        targetId: postId,
        reason,
      });
      toast.success('Report submitted');
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gradient-button)' }}>
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-[var(--text-secondary)] mb-4">Post not found</p>
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
          <div className="h-5 w-16 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
        </div>
        {/* Shimmer Content */}
        <div className="p-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
                <div className="h-3 w-24 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 w-full rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="h-4 w-3/4 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="h-4 w-1/2 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
            </div>
            <div className="h-48 w-full rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const post = data.data;
  const typeConfig = POST_TYPE_CONFIG[post.type as keyof typeof POST_TYPE_CONFIG];
  const hasLiked = post.reactions?.some((r: any) => r.userId === user?.id && r.type === 'like');

  return (
    <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen">
      {/* Header */}
      <div className="sticky top-0 glass px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
        <h1 className="font-bold text-[var(--text-primary)]">Post</h1>
      </div>

      {/* Post Content Card */}
      <div className="p-4 animate-slide-up">
        <div className="card p-5">
          {/* Author */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="avatar-ring">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: 'var(--gradient-button)' }}>
                  {post.author?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{post.author?.name}</span>
                  {post.author?.isVerified && (
                    <CheckCircle className="w-4 h-4 text-primary-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <span>{formatTimeAgo(new Date(post.createdAt))}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {post.neighborhood?.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center press-scale-sm"
              >
                <MoreHorizontal className="w-5 h-5 text-[var(--text-muted)]" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-[var(--bg-card)] rounded-2xl shadow-elevated py-2 z-20 min-w-[180px] border border-[var(--border-color-light)] animate-fade-in">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copied');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={handleReport}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Flag className="w-4 h-4 inline mr-2" />
                      Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Type Badge */}
          {typeConfig && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold mb-4 text-white"
              style={{ background: typeConfig.color }}
            >
              {typeConfig.label}
            </span>
          )}

          {/* Content */}
          <div className="mb-4">
            {post.title && (
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">{post.title}</h2>
            )}
            <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </div>

          {/* Parsed Data for Rentals */}
          {post.type === 'rental' && post.parsedData && (
            <div className="bg-[var(--bg-tertiary)] rounded-2xl p-4 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Property Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {post.parsedData.bhk && (
                  <div className="bg-[var(--bg-card)] rounded-xl p-3">
                    <span className="text-[var(--text-muted)] text-xs">Type</span>
                    <p className="font-semibold text-[var(--text-primary)]">{post.parsedData.bhk}</p>
                  </div>
                )}
                {post.parsedData.rent && (
                  <div className="bg-[var(--bg-card)] rounded-xl p-3">
                    <span className="text-[var(--text-muted)] text-xs">Rent</span>
                    <p className="font-semibold text-primary-600">{'\u20B9'}{post.parsedData.rent.toLocaleString()}/mo</p>
                  </div>
                )}
                {post.parsedData.deposit && (
                  <div className="bg-[var(--bg-card)] rounded-xl p-3">
                    <span className="text-[var(--text-muted)] text-xs">Deposit</span>
                    <p className="font-semibold text-[var(--text-primary)]">{'\u20B9'}{post.parsedData.deposit.toLocaleString()}</p>
                  </div>
                )}
                {post.parsedData.furnishing && (
                  <div className="bg-[var(--bg-card)] rounded-xl p-3">
                    <span className="text-[var(--text-muted)] text-xs">Furnishing</span>
                    <p className="font-semibold text-[var(--text-primary)]">{post.parsedData.furnishing}</p>
                  </div>
                )}
                {post.parsedData.amenities && post.parsedData.amenities.length > 0 && (
                  <div className="col-span-2 bg-[var(--bg-card)] rounded-xl p-3">
                    <span className="text-[var(--text-muted)] text-xs">Amenities</span>
                    <p className="font-semibold text-[var(--text-primary)]">{post.parsedData.amenities.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mb-4 -mx-1">
              <div className="flex overflow-x-auto gap-3 px-1 pb-2">
                {post.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Post image ${idx + 1}`}
                    className="h-64 w-auto rounded-2xl object-cover flex-shrink-0 shadow-card"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color-light)]">
            <button
              onClick={handleReaction}
              className={`flex items-center gap-2 press-scale-sm transition-colors ${hasLiked ? 'text-red-500' : 'text-[var(--text-muted)]'}`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''} ${likeAnimating ? 'animate-heart-beat' : ''}`} />
              <span className="font-medium text-sm">{post._count?.reactions || 0}</span>
            </button>

            <button className="flex items-center gap-2 text-[var(--text-muted)] press-scale-sm">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium text-sm">{post._count?.comments || 0}</span>
            </button>

            <button
              onClick={() => {
                navigator.share?.({
                  title: post.title || 'Check out this post',
                  url: window.location.href,
                }).catch(() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied');
                });
              }}
              className="flex items-center gap-2 text-[var(--text-muted)] press-scale-sm"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button className="flex items-center gap-2 text-[var(--text-muted)] press-scale-sm">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="px-4 pb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="card p-5">
          <h3 className="font-bold text-[var(--text-primary)] mb-4">
            Comments ({post.comments?.length || 0})
          </h3>

          {(!post.comments || post.comments.length === 0) && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--gradient-button)', opacity: 0.15 }}>
                <MessageCircle className="w-6 h-6 text-primary-500" />
              </div>
              <p className="text-[var(--text-muted)] text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}

          <div className="space-y-4">
            {post.comments?.map((comment: any, idx: number) => (
              <div key={comment.id} className="flex gap-3 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" style={{ background: 'var(--gradient-button)' }}>
                  {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 bg-[var(--bg-tertiary)] rounded-2xl rounded-tl-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">{comment.author?.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTimeAgo(new Date(comment.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 glass p-4 max-w-2xl mx-auto z-10">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleComment();
              }
            }}
            placeholder="Add a comment..."
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color-light)] rounded-2xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
          />
          <button
            onClick={handleComment}
            disabled={!comment.trim() || isSubmitting}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-50 press-scale transition-all"
            style={{ background: 'var(--gradient-button)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom padding for fixed input */}
      <div className="h-24" />
    </div>
  );
}
