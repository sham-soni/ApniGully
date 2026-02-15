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
  { key: 'helpers', label: 'Helpers', icon: Users, color: 'bg-primary-100 text-primary-600' },
  { key: 'shops', label: 'Shops', icon: Store, color: 'bg-secondary-100 text-secondary-600' },
  { key: 'rentals', label: 'Rentals', icon: Home, color: 'bg-purple-100 text-purple-600' },
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('helpers');
  const [searchQuery, setSearchQuery] = useState('');

  const neighborhoodId = user?.memberships?.[0]?.neighborhoodId;

  const { data, isLoading } = useSWR<any>(
    neighborhoodId ? `/${activeTab}/neighborhood/${neighborhoodId}` : null,
    fetcher
  );

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search helpers, shops, rentals..."
            className="input pl-11"
          />
        </div>
      </div>

      {/* Tabs with gradient indicator */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          {tabs.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 press-scale-sm ${
                activeTab === key
                  ? 'text-white shadow-md'
                  : `bg-[var(--bg-card)] text-[var(--text-muted)] shadow-card`
              }`}
              style={activeTab === key ? { background: 'var(--gradient-button)' } : undefined}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        {isLoading && (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32 rounded-lg" />
                    <div className="skeleton h-3 w-48 rounded-lg" />
                    <div className="skeleton h-3 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'helpers' && data?.data && (
          <div className="grid gap-3 md:grid-cols-2">
            {data.data.map((helper: any, i: number) => (
              <HelperCard key={helper.id} helper={helper} index={i} />
            ))}
          </div>
        )}

        {activeTab === 'shops' && data?.data && (
          <div className="grid gap-3 md:grid-cols-2">
            {data.data.map((shop: any, i: number) => (
              <ShopCard key={shop.id} shop={shop} index={i} />
            ))}
          </div>
        )}

        {activeTab === 'rentals' && data?.data && (
          <div className="grid gap-3">
            {data.data.map((rental: any, i: number) => (
              <RentalCard key={rental.id} rental={rental} index={i} />
            ))}
          </div>
        )}

        {data?.data?.length === 0 && (
          <div className="card p-12 text-center shadow-card">
            <p className="text-[var(--text-muted)] font-medium">
              No {activeTab} found in your neighborhood yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function HelperCard({ helper, index }: { helper: any; index: number }) {
  const skills = helper.skills.map((s: string) => SKILL_LABELS[s]?.en || s).join(', ');

  return (
    <Link
      href={`/helpers/${helper.id}`}
      className="card p-4 shadow-card card-hover animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
             style={{ background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))', color: 'var(--color-primary-700)' }}>
          {helper.user?.name?.charAt(0).toUpperCase() || 'H'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm">{helper.user?.name}</h3>
            {helper.backgroundCheckStatus === 'verified' && (
              <span className="badge badge-success text-[10px] px-2 py-0.5">
                <Check className="w-3 h-3 mr-0.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{skills}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-[var(--text-primary)]">{helper.rating?.toFixed(1) || 'New'}</span>
            </span>
            <span>{helper.experience}+ yrs</span>
            {helper.monthlyRate && (
              <span className="font-semibold text-primary-500">₹{helper.monthlyRate.toLocaleString()}/mo</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
      </div>
    </Link>
  );
}

function ShopCard({ shop, index }: { shop: any; index: number }) {
  return (
    <Link
      href={`/shops/${shop.id}`}
      className="card p-4 shadow-card card-hover animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-secondary-100">
          <Store className="w-6 h-6 text-secondary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm">{shop.name}</h3>
            {shop.isVerified && (
              <span className="badge badge-primary text-[10px] px-2 py-0.5">Verified</span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{shop.category}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-[var(--text-primary)]">{shop.rating?.toFixed(1) || 'New'}</span>
            </span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5" />
              {shop.address}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
      </div>
    </Link>
  );
}

function RentalCard({ rental, index }: { rental: any; index: number }) {
  return (
    <Link
      href={`/rentals/${rental.id}`}
      className="card p-4 shadow-card card-hover animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
    >
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 bg-purple-50">
          <Home className="w-8 h-8 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm">
                {rental.bhk || rental.propertyType}
              </h3>
              <p className="text-lg font-bold text-primary-500 mt-1">
                ₹{rental.rentAmount?.toLocaleString()}<span className="text-xs font-medium text-[var(--text-muted)]">/month</span>
              </p>
            </div>
            <span className={`badge ${rental.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
              {rental.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <span>{rental.furnishing?.replace('_', ' ')}</span>
            {rental.area && <span>{rental.area} sq.ft</span>}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Available now
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
