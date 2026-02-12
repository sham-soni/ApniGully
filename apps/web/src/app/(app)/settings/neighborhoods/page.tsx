'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { api, fetcher } from '@/lib/api';
import { ArrowLeft, MapPin, Plus, LogOut, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Membership {
  id: string;
  role: string;
  status: string;
  neighborhood: {
    id: string;
    name: string;
    city: string;
    state: string;
    memberCount: number;
  };
}

export default function NeighborhoodsSettingsPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{ data: Membership[] }>(
    '/users/me/memberships',
    fetcher
  );

  const memberships = data?.data || user?.memberships || [];

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setIsJoining(true);
    try {
      await api.post('/neighborhoods/join', { inviteCode: inviteCode.trim() });
      mutate();
      setShowJoinModal(false);
      setInviteCode('');
      toast.success('Joined neighborhood successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid invite code');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async (neighborhoodId: string, neighborhoodName: string) => {
    if (!confirm(`Are you sure you want to leave ${neighborhoodName}?`)) return;

    setLeavingId(neighborhoodId);
    try {
      await api.post(`/neighborhoods/${neighborhoodId}/leave`);
      mutate();
      toast.success('Left neighborhood');
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave neighborhood');
    } finally {
      setLeavingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-neutral-900">My Neighborhoods</h1>
        </div>
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600"
        >
          <Plus className="w-4 h-4" />
          Join
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : memberships.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-medium text-neutral-900 mb-2">No neighborhoods yet</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Join a neighborhood to connect with your community
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600"
            >
              Join a Neighborhood
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((membership: Membership) => (
              <div
                key={membership.id}
                className="border border-neutral-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {membership.neighborhood.name}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {membership.neighborhood.city}, {membership.neighborhood.state}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Users className="w-3 h-3" />
                          {membership.neighborhood.memberCount} members
                        </span>
                        {membership.role === 'admin' && (
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                            Admin
                          </span>
                        )}
                        {membership.role === 'moderator' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            Moderator
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLeave(membership.neighborhood.id, membership.neighborhood.name)}
                    disabled={leavingId === membership.neighborhood.id}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    title="Leave neighborhood"
                  >
                    {leavingId === membership.neighborhood.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogOut className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Join a Neighborhood
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Enter the invite code shared by your neighbor or community admin.
            </p>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-digit code"
              maxLength={8}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase tracking-widest text-center text-lg font-mono"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setInviteCode('');
                }}
                className="flex-1 py-3 border border-neutral-200 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={isJoining || inviteCode.length < 8}
                className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
