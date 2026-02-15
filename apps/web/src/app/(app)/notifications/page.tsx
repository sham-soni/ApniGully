'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { formatTimeAgo } from '@apnigully/shared';
import {
  ArrowLeft,
  Bell,
  MessageCircle,
  Heart,
  UserPlus,
  Star,
  AlertTriangle,
  Check,
  CheckCheck,
  Settings,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIFICATION_ICONS: Record<string, any> = {
  message: MessageCircle,
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  review: Star,
  safety_alert: AlertTriangle,
  mention: MessageCircle,
  endorsement: Heart,
  task_update: Check,
  neighborhood: UserPlus,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  message: 'bg-blue-100 text-blue-600',
  like: 'bg-red-100 text-red-600',
  comment: 'bg-emerald-100 text-emerald-600',
  follow: 'bg-purple-100 text-purple-600',
  review: 'bg-amber-100 text-amber-600',
  safety_alert: 'bg-red-100 text-red-600',
  mention: 'bg-blue-100 text-blue-600',
  endorsement: 'bg-pink-100 text-pink-600',
  task_update: 'bg-primary-100 text-primary-600',
  neighborhood: 'bg-secondary-100 text-secondary-600',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data, mutate } = useSWR<any>('/notifications', fetcher);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      mutate();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      mutate();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      mutate();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const notifications = data?.data || [];
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n: any) => !n.isRead)
    : notifications;
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getNotificationLink = (notification: any): string => {
    const { type, data } = notification;
    switch (type) {
      case 'message':
        return `/inbox/${data?.chatId}`;
      case 'like':
      case 'comment':
        return `/posts/${data?.postId}`;
      case 'follow':
      case 'endorsement':
        return `/profile/${data?.userId}`;
      case 'review':
        return data?.helperProfileId ? `/helpers/${data.helperProfileId}` : `/shops/${data?.shopId}`;
      case 'safety_alert':
        return `/feed`;
      case 'task_update':
        return `/tasks/${data?.taskId}`;
      case 'neighborhood':
        return `/neighborhoods/${data?.neighborhoodId}`;
      default:
        return '/feed';
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-card)] shadow-card press-scale"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Notifications</h1>
            {unreadCount > 0 && (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: 'var(--gradient-button)' }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors press-scale"
              >
                <CheckCheck className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            )}
            <Link
              href="/settings"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors press-scale"
            >
              <Settings className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 press-scale-sm ${
              filter === 'all'
                ? 'text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] shadow-card'
            }`}
            style={filter === 'all' ? { background: 'var(--gradient-button)' } : undefined}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 press-scale-sm ${
              filter === 'unread'
                ? 'text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] shadow-card'
            }`}
            style={filter === 'unread' ? { background: 'var(--gradient-button)' } : undefined}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 space-y-2 pb-6">
        {filteredNotifications.length === 0 && (
          <div className="card p-16 text-center shadow-card">
            <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-4"
                 style={{ background: 'var(--gradient-hero-soft)' }}>
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
              {filter === 'unread'
                ? "You're all caught up!"
                : "When you get notifications, they'll show up here."}
            </p>
          </div>
        )}

        {filteredNotifications.map((notification: any, index: number) => {
          const NotifIcon = NOTIFICATION_ICONS[notification.type] || Bell;
          const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-neutral-100 text-neutral-600';

          return (
            <div
              key={notification.id}
              className="group animate-slide-up"
              style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
            >
              <Link
                href={getNotificationLink(notification)}
                onClick={() => handleMarkRead(notification.id)}
                className={`card flex items-start gap-3 p-4 shadow-card transition-all duration-200 press-scale-sm ${
                  !notification.isRead ? 'bg-gradient-card' : ''
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <NotifIcon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                    {formatTimeAgo(new Date(notification.createdAt))}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                       style={{ background: 'var(--gradient-button)' }} />
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(notification.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
