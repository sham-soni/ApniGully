'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher, api } from '@/lib/api';
import { MapPin, Search, Plus, ArrowRight, Home, Users, Shield, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

// Dynamic import to avoid SSR issues with Google Maps
const MapLocationPicker = dynamic(
  () => import('@/components/MapLocationPicker'),
  { ssr: false, loading: () => <div className="h-64 bg-[var(--bg-tertiary)] rounded-2xl animate-pulse" /> }
);

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}

export default function NeighborhoodOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState<'search' | 'create' | 'join'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);

  // Form state for creating neighborhood
  const [createForm, setCreateForm] = useState({
    name: '',
    city: '',
    state: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
  });

  const { data: neighborhoods } = useSWR<any>(
    searchQuery.length >= 2 ? `/neighborhoods/search/name?q=${searchQuery}` : null,
    fetcher
  ) as { data: any[] | undefined };

  // Redirect if user already has an active membership
  useEffect(() => {
    if ((user?.memberships?.length ?? 0) > 0) {
      router.push('/feed');
      return;
    }
  }, [user, router]);

  // Auto-join with invite code
  useEffect(() => {
    if (inviteCode && inviteCode.length === 8) {
      handleJoinWithCode();
    }
  }, []);

  const handleLocationSelect = (location: LocationData) => {
    setCreateForm({
      ...createForm,
      city: location.city || createForm.city,
      state: location.state || createForm.state,
      pincode: location.pincode || createForm.pincode,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setLocationSelected(true);
  };

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/neighborhoods/join/invite', { inviteCode });
      toast.success('Successfully joined neighborhood!');
      router.push('/feed');
    } catch (error: any) {
      toast.error(error.message || 'Invalid invite code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinNeighborhood = async () => {
    if (!selectedNeighborhood) return;

    setIsSubmitting(true);
    try {
      await api.post(`/neighborhoods/${selectedNeighborhood.id}/join`);
      toast.success('Join request sent! Waiting for approval.');
      router.push('/feed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNeighborhood = async () => {
    if (!createForm.name.trim()) {
      toast.error('Please enter a neighborhood name');
      return;
    }

    if (!locationSelected && !createForm.city) {
      toast.error('Please select a location on the map');
      return;
    }

    if (!createForm.pincode || createForm.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/neighborhoods', createForm);
      toast.success('Neighborhood created! You are now the admin.');
      router.push('/feed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create neighborhood');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step indicator progress
  const stepIndex = step === 'search' ? 0 : step === 'create' ? 1 : 2;

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <div className="max-w-lg mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Welcome to ApniGully
          </h1>
          <p className="text-[var(--text-muted)]">
            Join your neighborhood community to get started
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8 px-4 animate-slide-up">
          {['Find', 'Join / Create'].map((label, i) => (
            <div key={label} className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-tertiary)]">
                <div
                  className="h-full rounded-full bg-gradient-button transition-all duration-500"
                  style={{ width: stepIndex >= i ? '100%' : '0%' }}
                />
              </div>
              <p className={`text-xs mt-1.5 text-center ${stepIndex >= i ? 'text-primary-500 font-medium' : 'text-[var(--text-muted)]'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Invite Code Section */}
        <div className="card p-5 mb-6 animate-slide-up">
          <h3 className="font-medium text-[var(--text-primary)] mb-3">Have an invite code?</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-digit code"
              maxLength={8}
              className="flex-1 px-4 py-2.5 border border-[var(--border-color)] rounded-2xl uppercase tracking-wider bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
            <button
              onClick={handleJoinWithCode}
              disabled={inviteCode.length !== 8 || isSubmitting}
              className="btn btn-primary px-5 press-scale disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-color-light)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-muted)]">or</span>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex gap-2 mb-6 animate-slide-up">
          <button
            onClick={() => setStep('search')}
            className={`flex-1 py-3 rounded-2xl font-medium transition-all press-scale-sm ${
              step === 'search'
                ? 'bg-gradient-button text-white shadow-card'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            Find Gully
          </button>
          <button
            onClick={() => setStep('create')}
            className={`flex-1 py-3 rounded-2xl font-medium transition-all press-scale-sm ${
              step === 'create'
                ? 'bg-gradient-button text-white shadow-card'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Search Step */}
        {step === 'search' && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, area, or pincode..."
                className="w-full pl-12 pr-4 py-3.5 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            {/* Search Results */}
            <div className="space-y-3">
              {neighborhoods?.map((neighborhood: any) => (
                <button
                  key={neighborhood.id}
                  onClick={() => {
                    setSelectedNeighborhood(neighborhood);
                    setStep('join');
                  }}
                  className={`w-full p-4 card-hover text-left transition-all press-scale-sm ${
                    selectedNeighborhood?.id === neighborhood.id
                      ? 'ring-2 ring-primary-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">{neighborhood.name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">
                        {neighborhood.city}{neighborhood.state ? `, ${neighborhood.state}` : ''} - {neighborhood.pincode}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {neighborhood.memberCount || 0} members
                        </span>
                        {neighborhood.isVerified && (
                          <span className="flex items-center gap-1 text-accent-500">
                            <Shield className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                  </div>
                </button>
              ))}

              {searchQuery.length >= 2 && neighborhoods?.length === 0 && (
                <div className="text-center py-8 animate-fade-in">
                  <p className="text-[var(--text-muted)] mb-4">No neighborhoods found</p>
                  <button
                    onClick={() => setStep('create')}
                    className="btn btn-primary inline-flex items-center press-scale"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your Gully
                  </button>
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-8 text-[var(--text-muted)] animate-fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 opacity-50" />
                  </div>
                  <p>Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join Step */}
        {step === 'join' && selectedNeighborhood && (
          <div className="card p-6 animate-fade-in">
            <button
              onClick={() => {
                setSelectedNeighborhood(null);
                setStep('search');
              }}
              className="flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 press-scale-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to search
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                {selectedNeighborhood.name}
              </h2>
              <p className="text-[var(--text-muted)]">
                {selectedNeighborhood.city}{selectedNeighborhood.state ? `, ${selectedNeighborhood.state}` : ''}
              </p>
            </div>

            <div className="space-y-1 mb-6 bg-[var(--bg-tertiary)] rounded-2xl p-4">
              <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-color-light)]">
                <span className="text-[var(--text-muted)]">Members</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedNeighborhood.memberCount || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-color-light)]">
                <span className="text-[var(--text-muted)]">Pincode</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedNeighborhood.pincode}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)]">Status</span>
                <span className="badge bg-primary-500/10 text-primary-500 text-xs font-medium">
                  {selectedNeighborhood.isVerified ? 'Verified' : 'Community'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleJoinNeighborhood}
                disabled={isSubmitting}
                className="w-full btn btn-primary py-3 press-scale disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Requesting...' : 'Request to Join'}
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] text-center mt-4">
              Your request will be reviewed by neighborhood admins.
              You'll be notified once approved.
            </p>
          </div>
        )}

        {/* Create Step */}
        {step === 'create' && (
          <div className="card p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">
              Create Your Gully
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Select your neighborhood location on the map
            </p>

            <div className="space-y-6">
              {/* Map Location Picker */}
              <MapLocationPicker onLocationSelect={handleLocationSelect} />

              {/* Neighborhood Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Neighborhood Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Sunshine Apartments, Green Valley Society"
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              {/* Auto-filled Location Details */}
              {locationSelected && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      className="w-full px-4 py-3 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={createForm.pincode}
                      onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                      maxLength={6}
                      className="w-full px-4 py-3 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Manual Entry Fallback */}
              {!locationSelected && (
                <div className="border-t border-[var(--border-color-light)] pt-4">
                  <p className="text-sm text-[var(--text-muted)] mb-4">
                    Or enter details manually if map is not available:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        value={createForm.city}
                        onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                        placeholder="Mumbai"
                        className="w-full px-4 py-3 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={createForm.pincode}
                        onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                        placeholder="400001"
                        maxLength={6}
                        className="w-full px-4 py-3 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={createForm.state}
                      onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-3 border border-[var(--border-color)] rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateNeighborhood}
                disabled={isSubmitting || !createForm.name}
                className="w-full btn btn-primary py-3 press-scale disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Neighborhood'}
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] text-center mt-4">
              As the creator, you'll be the admin of this neighborhood.
              You can invite neighbors and manage the community.
            </p>
          </div>
        )}

        {/* Skip for now */}
        <button
          onClick={() => router.push('/feed')}
          className="w-full text-center text-[var(--text-muted)] text-sm mt-6 hover:text-[var(--text-primary)] press-scale-sm transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
