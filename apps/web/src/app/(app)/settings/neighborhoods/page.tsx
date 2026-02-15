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

  const { data, error, isLoading, mutate } = useSWR<any>(
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
    <div className="max-w-2xl mx-auto bg-[var(--bg-secondary)] min-h-screen pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-[var(--bg-card)] shadow-card flex items-center justify-center press-scale"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-[var(--text-primary)]" />
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">My Neighborhoods</h1>
        </div>
        <button
          onClick={() => setShowJoinModal(true)}
          className="btn btn-primary flex items-center gap-1.5 px-4 py-2 text-sm font-semibold press-scale"
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
          <div className="card shadow-card text-center py-12 px-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-2">No neighborhoods yet</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Join a neighborhood to connect with your community
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="btn btn-primary px-6 py-2.5 font-semibold press-scale"
            >
              Join a Neighborhood
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((membership: Membership) => (
              <div
                key={membership.id}
                className="card shadow-card card-hover p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {membership.neighborhood.name}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        {membership.neighborhood.city}, {membership.neighborhood.state}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Users className="w-3 h-3" />
                          {membership.neighborhood.memberCount} members
                        </span>
                        {membership.role === 'admin' && (
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                            Admin
                          </span>
                        )}
                        {membership.role === 'moderator' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                            Moderator
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLeave(membership.neighborhood.id, membership.neighborhood.name)}
                    disabled={leavingId === membership.neighborhood.id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 press-scale-sm"
                    title="Leave neighborhood"
                  >
                    {leavingId === membership.neighborhood.id ? (
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    ) : (
                      <LogOut className="w-[18px] h-[18px]" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card shadow-elevated w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Join a Neighborhood
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Enter the invite code shared by your neighbor or community admin.
            </p>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-digit code"
              maxLength={8}
              className="input w-full text-center text-lg font-mono uppercase tracking-widest"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setInviteCode('');
                }}
                className="btn btn-ghost flex-1 py-3 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={isJoining || inviteCode.length < 8}
                className="btn btn-primary flex-1 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 press-scale"
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
