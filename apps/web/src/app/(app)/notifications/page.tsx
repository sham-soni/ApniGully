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
  comment: 'bg-green-100 text-green-600',
  follow: 'bg-purple-100 text-purple-600',
  review: 'bg-yellow-100 text-yellow-600',
  safety_alert: 'bg-red-100 text-red-600',
  mention: 'bg-blue-100 text-blue-600',
  endorsement: 'bg-pink-100 text-pink-600',
  task_update: 'bg-primary-100 text-primary-600',
  neighborhood: 'bg-primary-100 text-primary-600',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data, mutate } = useSWR('/notifications', fetcher);
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
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-medium text-neutral-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-2 hover:bg-neutral-100 rounded-full"
                title="Mark all as read"
              >
                <CheckCheck className="w-5 h-5 text-neutral-500" />
              </button>
            )}
            <Link
              href="/settings"
              className="p-2 hover:bg-neutral-100 rounded-full"
            >
              <Settings className="w-5 h-5 text-neutral-500" />
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-neutral-100">
        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-16 h-16 text-neutral-300 mb-4" />
            <h2 className="text-lg font-medium text-neutral-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h2>
            <p className="text-neutral-500 max-w-xs">
              {filter === 'unread'
                ? 'You\'re all caught up!'
                : 'When you get notifications, they\'ll show up here.'}
            </p>
          </div>
        )}

        {filteredNotifications.map((notification: any) => {
          const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
          const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-neutral-100 text-neutral-600';

          return (
            <div
              key={notification.id}
              className={`relative ${!notification.isRead ? 'bg-primary-50/50' : ''}`}
            >
              <Link
                href={getNotificationLink(notification)}
                onClick={() => handleMarkRead(notification.id)}
                className="flex items-start gap-3 p-4 hover:bg-neutral-50 transition-colors"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.isRead ? 'font-medium text-neutral-900' : 'text-neutral-700'}`}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    {formatTimeAgo(new Date(notification.createdAt))}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </Link>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(notification.id);
                }}
                className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
