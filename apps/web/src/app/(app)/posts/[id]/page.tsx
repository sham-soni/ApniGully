'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo, POST_TYPE_CONFIG } from '@apnigully/shared';
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

  const postId = params.id as string;
  const { data, mutate, error } = useSWR(`/posts/${postId}`, fetcher);

  const handleReaction = async () => {
    if (!user) {
      toast.error('Please login to react');
      return;
    }

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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-neutral-500 mb-4">Post not found</p>
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

  const post = data.data;
  const typeConfig = POST_TYPE_CONFIG[post.type as keyof typeof POST_TYPE_CONFIG];
  const hasLiked = post.reactions?.some((r: any) => r.userId === user?.id && r.type === 'like');

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-medium text-neutral-900">Post</h1>
      </div>

      {/* Post Content */}
      <div className="p-4 border-b border-neutral-100">
        {/* Author */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
              {post.author?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">{post.author?.name}</span>
                {post.author?.isVerified && (
                  <CheckCircle className="w-4 h-4 text-primary-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
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
              className="p-2 hover:bg-neutral-100 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5 text-neutral-500" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20 min-w-[160px]">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50"
                  >
                    Copy link
                  </button>
                  <button
                    onClick={handleReport}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 text-red-600"
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
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3"
            style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
          >
            {typeConfig.label}
          </span>
        )}

        {/* Content */}
        <div className="mb-4">
          {post.title && (
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">{post.title}</h2>
          )}
          <p className="text-neutral-800 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Parsed Data for Rentals */}
        {post.type === 'rental' && post.parsedData && (
          <div className="bg-neutral-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-neutral-900 mb-2">Property Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {post.parsedData.bhk && (
                <div>
                  <span className="text-neutral-500">Type:</span>{' '}
                  <span className="font-medium">{post.parsedData.bhk}</span>
                </div>
              )}
              {post.parsedData.rent && (
                <div>
                  <span className="text-neutral-500">Rent:</span>{' '}
                  <span className="font-medium">₹{post.parsedData.rent.toLocaleString()}/mo</span>
                </div>
              )}
              {post.parsedData.deposit && (
                <div>
                  <span className="text-neutral-500">Deposit:</span>{' '}
                  <span className="font-medium">₹{post.parsedData.deposit.toLocaleString()}</span>
                </div>
              )}
              {post.parsedData.furnishing && (
                <div>
                  <span className="text-neutral-500">Furnishing:</span>{' '}
                  <span className="font-medium">{post.parsedData.furnishing}</span>
                </div>
              )}
              {post.parsedData.amenities && post.parsedData.amenities.length > 0 && (
                <div className="col-span-2">
                  <span className="text-neutral-500">Amenities:</span>{' '}
                  <span className="font-medium">{post.parsedData.amenities.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-4 -mx-4">
            <div className="flex overflow-x-auto gap-2 px-4 pb-2">
              {post.images.map((img: string, idx: number) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Post image ${idx + 1}`}
                  className="h-64 w-auto rounded-lg object-cover flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <button
            onClick={handleReaction}
            className={`flex items-center gap-2 ${hasLiked ? 'text-red-500' : 'text-neutral-500'}`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{post._count?.reactions || 0}</span>
          </button>

          <button className="flex items-center gap-2 text-neutral-500">
            <MessageCircle className="w-5 h-5" />
            <span>{post._count?.comments || 0}</span>
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
            className="flex items-center gap-2 text-neutral-500"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button className="flex items-center gap-2 text-neutral-500">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="divide-y divide-neutral-100">
        <div className="p-4">
          <h3 className="font-medium text-neutral-900 mb-4">
            Comments ({post.comments?.length || 0})
          </h3>

          {(!post.comments || post.comments.length === 0) && (
            <p className="text-neutral-500 text-sm">No comments yet. Be the first to comment!</p>
          )}

          {post.comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-3 mb-4">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-medium flex-shrink-0">
                {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.author?.name}</span>
                  <span className="text-xs text-neutral-400">
                    {formatTimeAgo(new Date(comment.createdAt))}
                  </span>
                </div>
                <p className="text-sm text-neutral-700">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
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
            className="flex-1 input"
          />
          <button
            onClick={handleComment}
            disabled={!comment.trim() || isSubmitting}
            className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom padding for fixed input */}
      <div className="h-20" />
    </div>
  );
}
