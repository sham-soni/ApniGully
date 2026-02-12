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

  const { data, error, isLoading, mutate } = useSWR<{ data: BlockedUser[] }>(
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
    <div className="max-w-2xl mx-auto bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-neutral-900">Blocked Users</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Info Box */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-neutral-600">
            Blocked users cannot see your posts, send you messages, or view your profile.
            You also won't see their content in your feed.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Ban className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="font-medium text-neutral-900 mb-2">No blocked users</h3>
            <p className="text-sm text-neutral-500">
              When you block someone, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                    {blocked.blockedUser.avatar ? (
                      <img
                        src={blocked.blockedUser.avatar}
                        alt={blocked.blockedUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-neutral-500">
                        {blocked.blockedUser.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">
                      {blocked.blockedUser.name}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Blocked on {formatDate(blocked.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(blocked.blockedUser.id, blocked.blockedUser.name)}
                  disabled={unblockingId === blocked.blockedUser.id}
                  className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50"
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
