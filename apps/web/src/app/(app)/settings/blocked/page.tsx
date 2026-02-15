'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { api, fetcher } from '@/lib/api';
import { ArrowLeft, UserX, Loader2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

interface BlockedUser {
  id: string;
  blockedUser: {
    id: string;
    name: string;
    avatar?: string;
    phone: string;
  };
  createdAt: string;
}

export default function BlockedUsersPage() {
  const router = useRouter();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<any>(
    '/users/me/blocked',
    fetcher
  );

  const blockedUsers = data?.data || [];

  const handleUnblock = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to unblock ${userName}?`)) return;

    setUnblockingId(userId);
    try {
      await api.delete(`/users/${userId}/block`);
      mutate();
      toast.success(`${userName} has been unblocked`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to unblock user');
    } finally {
      setUnblockingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-[var(--text-primary)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">Blocked Users</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Info Box */}
        <div className="card shadow-card p-4 mb-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Blocked users cannot see your posts, send you messages, or view your profile.
            You also won't see their content in your feed.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="card shadow-card text-center py-12 px-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
              <Ban className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-2">No blocked users</h3>
            <p className="text-sm text-[var(--text-muted)]">
              When you block someone, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((blocked: any) => (
              <div
                key={blocked.id}
                className="card shadow-card card-hover flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden ring-2 ring-[var(--border-color-light)]">
                    {blocked.blockedUser.avatar ? (
                      <img
                        src={blocked.blockedUser.avatar}
                        alt={blocked.blockedUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-[var(--text-muted)]">
                        {blocked.blockedUser.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                      {blocked.blockedUser.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Blocked on {formatDate(blocked.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(blocked.blockedUser.id, blocked.blockedUser.name)}
                  disabled={unblockingId === blocked.blockedUser.id}
                  className="btn btn-ghost px-4 py-2 text-sm font-semibold text-primary-500 hover:bg-primary-50 disabled:opacity-50 press-scale-sm"
                >
                  {unblockingId === blocked.blockedUser.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Unblock'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
