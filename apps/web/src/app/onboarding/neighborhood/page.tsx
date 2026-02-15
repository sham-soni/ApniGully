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
  { ssr: false, loading: () => <div className="h-64 bg-neutral-100 rounded-xl animate-pulse" /> }
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

  const { data: neighborhoods } = useSWR(
    searchQuery.length >= 2 ? `/neighborhoods/search/name?q=${searchQuery}` : null,
    fetcher
  );

  // Redirect if user already has an active membership
  useEffect(() => {
    if (user?.memberships?.length > 0) {
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-lg mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome to ApniGully
          </h1>
          <p className="text-neutral-500">
            Join your neighborhood community to get started
          </p>
        </div>

        {/* Invite Code Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h3 className="font-medium text-neutral-900 mb-3">Have an invite code?</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-digit code"
              maxLength={8}
              className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg uppercase tracking-wider focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <button
              onClick={handleJoinWithCode}
              disabled={inviteCode.length !== 8 || isSubmitting}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-neutral-50 px-4 text-sm text-neutral-500">or</span>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setStep('search')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              step === 'search'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Find Gully
          </button>
          <button
            onClick={() => setStep('create')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              step === 'create'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Search Step */}
        {step === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, area, or pincode..."
                className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            {/* Search Results */}
            <div className="space-y-2">
              {neighborhoods?.map((neighborhood: any) => (
                <button
                  key={neighborhood.id}
                  onClick={() => {
                    setSelectedNeighborhood(neighborhood);
                    setStep('join');
                  }}
                  className={`w-full p-4 bg-white rounded-lg text-left hover:bg-neutral-50 transition-colors border ${
                    selectedNeighborhood?.id === neighborhood.id
                      ? 'border-primary-500'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-neutral-900">{neighborhood.name}</h3>
                      <p className="text-sm text-neutral-500">
                        {neighborhood.city}{neighborhood.state ? `, ${neighborhood.state}` : ''} - {neighborhood.pincode}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {neighborhood.memberCount || 0} members
                        </span>
                        {neighborhood.isVerified && (
                          <span className="flex items-center gap-1 text-primary-500">
                            <Shield className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400" />
                  </div>
                </button>
              ))}

              {searchQuery.length >= 2 && neighborhoods?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No neighborhoods found</p>
                  <button
                    onClick={() => setStep('create')}
                    className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your Gully
                  </button>
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-8 text-neutral-400">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join Step */}
        {step === 'join' && selectedNeighborhood && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <button
              onClick={() => {
                setSelectedNeighborhood(null);
                setStep('search');
              }}
              className="flex items-center text-neutral-500 hover:text-neutral-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to search
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-1">
                {selectedNeighborhood.name}
              </h2>
              <p className="text-neutral-500">
                {selectedNeighborhood.city}{selectedNeighborhood.state ? `, ${selectedNeighborhood.state}` : ''}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500">Members</span>
                <span className="font-medium">{selectedNeighborhood.memberCount || 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500">Pincode</span>
                <span className="font-medium">{selectedNeighborhood.pincode}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-neutral-500">Status</span>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                  {selectedNeighborhood.isVerified ? 'Verified' : 'Community'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleJoinNeighborhood}
                disabled={isSubmitting}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
              >
                {isSubmitting ? 'Requesting...' : 'Request to Join'}
              </button>
            </div>

            <p className="text-xs text-neutral-400 text-center mt-4">
              Your request will be reviewed by neighborhood admins.
              You'll be notified once approved.
            </p>
          </div>
        )}

        {/* Create Step */}
        {step === 'create' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-1">
              Create Your Gully
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Select your neighborhood location on the map
            </p>

            <div className="space-y-6">
              {/* Map Location Picker */}
              <MapLocationPicker onLocationSelect={handleLocationSelect} />

              {/* Neighborhood Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Neighborhood Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Sunshine Apartments, Green Valley Society"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Auto-filled Location Details */}
              {locationSelected && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={createForm.pincode}
                      onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                      maxLength={6}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Manual Entry Fallback */}
              {!locationSelected && (
                <div className="border-t border-neutral-200 pt-4">
                  <p className="text-sm text-neutral-500 mb-4">
                    Or enter details manually if map is not available:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={createForm.city}
                        onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                        placeholder="Mumbai"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={createForm.pincode}
                        onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                        placeholder="400001"
                        maxLength={6}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={createForm.state}
                      onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateNeighborhood}
                disabled={isSubmitting || !createForm.name}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Neighborhood'}
              </button>
            </div>

            <p className="text-xs text-neutral-400 text-center mt-4">
              As the creator, you'll be the admin of this neighborhood.
              You can invite neighbors and manage the community.
            </p>
          </div>
        )}

        {/* Skip for now */}
        <button
          onClick={() => router.push('/feed')}
          className="w-full text-center text-neutral-500 text-sm mt-6 hover:text-neutral-700"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
