import { clsx, type ClassValue } from 'clsx';

// Combine class names
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Component variant helper
export function createVariants<T extends Record<string, Record<string, string>>>(
  variants: T
): T {
  return variants;
}

// Size variants
export const sizeVariants = {
  xs: 'text-xs px-2 py-1',
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-5 py-2.5',
  xl: 'text-xl px-6 py-3',
};

// Status variants (for badges, alerts, etc.)
export const statusVariants = {
  default: 'bg-neutral-100 text-neutral-800',
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

// Post type colors
export const postTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  announcement: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  request: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  recommendation: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  rental: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  helper_listing: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  buy_sell: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  safety_alert: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

// Skill colors
export const skillColors: Record<string, { bg: string; text: string }> = {
  maid: { bg: 'bg-pink-100', text: 'text-pink-700' },
  cook: { bg: 'bg-orange-100', text: 'text-orange-700' },
  driver: { bg: 'bg-blue-100', text: 'text-blue-700' },
  babysitter: { bg: 'bg-purple-100', text: 'text-purple-700' },
  gardener: { bg: 'bg-green-100', text: 'text-green-700' },
  security: { bg: 'bg-gray-100', text: 'text-gray-700' },
  electrician: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  plumber: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  carpenter: { bg: 'bg-amber-100', text: 'text-amber-700' },
  painter: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

// Trust badge colors
export const trustLevelColors = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-400' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
  high: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500' },
  verified: { bg: 'bg-primary-100', text: 'text-primary-700', icon: 'text-primary-500' },
};

export function getTrustLevel(score: number): keyof typeof trustLevelColors {
  if (score >= 80) return 'verified';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// Format currency for Indian Rupees
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format compact number (1.2k, 10L, etc.)
export function formatCompactNumber(num: number): string {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + 'Cr';
  }
  if (num >= 100000) {
    return (num / 100000).toFixed(1) + 'L';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Generate avatar colors based on name
export function getAvatarColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: 'bg-red-500', text: 'text-white' },
    { bg: 'bg-orange-500', text: 'text-white' },
    { bg: 'bg-amber-500', text: 'text-white' },
    { bg: 'bg-yellow-500', text: 'text-black' },
    { bg: 'bg-lime-500', text: 'text-white' },
    { bg: 'bg-green-500', text: 'text-white' },
    { bg: 'bg-emerald-500', text: 'text-white' },
    { bg: 'bg-teal-500', text: 'text-white' },
    { bg: 'bg-cyan-500', text: 'text-white' },
    { bg: 'bg-sky-500', text: 'text-white' },
    { bg: 'bg-blue-500', text: 'text-white' },
    { bg: 'bg-indigo-500', text: 'text-white' },
    { bg: 'bg-violet-500', text: 'text-white' },
    { bg: 'bg-purple-500', text: 'text-white' },
    { bg: 'bg-fuchsia-500', text: 'text-white' },
    { bg: 'bg-pink-500', text: 'text-white' },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Accessibility helpers
export function getAriaLabel(element: string, action?: string): string {
  if (action) {
    return `${action} ${element}`;
  }
  return element;
}

// Focus trap utilities
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
  );
}
