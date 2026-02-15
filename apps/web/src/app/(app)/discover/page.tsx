'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { fetcher } from '@/lib/api';
import { SKILL_LABELS } from '@apnigully/shared';
import {
  Search,
  Home,
  Users,
  Store,
  Wrench,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  Check,
} from 'lucide-react';

const tabs = [
  { key: 'helpers', label: 'Helpers', icon: Users },
  { key: 'shops', label: 'Shops', icon: Store },
  { key: 'rentals', label: 'Rentals', icon: Home },
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('helpers');
  const [searchQuery, setSearchQuery] = useState('');

  const neighborhoodId = user?.memberships?.[0]?.neighborhoodId;

  const { data, isLoading } = useSWR(
    neighborhoodId ? `/${activeTab}/neighborhood/${neighborhoodId}` : null,
    fetcher
  ) as { data: { data: any[] } | undefined; isLoading: boolean };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search */}
      <div className="bg-white p-4 border-b border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search helpers, shops, rentals..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="flex">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {activeTab === 'helpers' && data?.data && (
          <div className="grid gap-4 md:grid-cols-2">
            {data.data.map((helper: any) => (
              <HelperCard key={helper.id} helper={helper} />
            ))}
          </div>
        )}

        {activeTab === 'shops' && data?.data && (
          <div className="grid gap-4 md:grid-cols-2">
            {data.data.map((shop: any) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}

        {activeTab === 'rentals' && data?.data && (
          <div className="grid gap-4">
            {data.data.map((rental: any) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        )}

        {data?.data?.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            No {activeTab} found in your neighborhood yet.
          </div>
        )}
      </div>
    </div>
  );
}

function HelperCard({ helper }: { helper: any }) {
  const skills = helper.skills.map((s: string) => SKILL_LABELS[s]?.en || s).join(', ');

  return (
    <Link
      href={`/helpers/${helper.id}`}
      className="card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
          {helper.user?.name?.charAt(0).toUpperCase() || 'H'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-neutral-900">{helper.user?.name}</h3>
            {helper.backgroundCheckStatus === 'verified' && (
              <span className="badge badge-success text-xs">
                <Check className="w-3 h-3 mr-0.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600 truncate">{skills}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              {helper.rating?.toFixed(1) || 'New'}
            </span>
            <span>{helper.experience}+ years</span>
            {helper.monthlyRate && (
              <span>₹{helper.monthlyRate.toLocaleString()}/mo</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-400" />
      </div>
    </Link>
  );
}

function ShopCard({ shop }: { shop: any }) {
  return (
    <Link
      href={`/shops/${shop.id}`}
      className="card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
          <Store className="w-6 h-6 text-neutral-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-neutral-900">{shop.name}</h3>
            {shop.isVerified && (
              <span className="badge badge-primary text-xs">Verified</span>
            )}
          </div>
          <p className="text-sm text-neutral-600">{shop.category}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              {shop.rating?.toFixed(1) || 'New'}
            </span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-4 h-4" />
              {shop.address}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-400" />
      </div>
    </Link>
  );
}

function RentalCard({ rental }: { rental: any }) {
  return (
    <Link
      href={`/rentals/${rental.id}`}
      className="card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-neutral-100 rounded-lg flex items-center justify-center">
          <Home className="w-8 h-8 text-neutral-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">
                {rental.bhk || rental.propertyType}
              </h3>
              <p className="text-lg font-bold text-primary-600 mt-1">
                ₹{rental.rentAmount?.toLocaleString()}/month
              </p>
            </div>
            <span className={`badge ${rental.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
              {rental.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
            <span>{rental.furnishing?.replace('_', ' ')}</span>
            {rental.area && <span>{rental.area} sq.ft</span>}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Available now
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
