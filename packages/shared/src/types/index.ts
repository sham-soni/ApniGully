// Core Types for ApniGully

// User Roles
export type UserRole =
  | 'resident'
  | 'verified_resident'
  | 'helper'
  | 'shop_owner'
  | 'admin'
  | 'moderator';

// Post Types
export type PostType =
  | 'announcement'
  | 'request'
  | 'recommendation'
  | 'rental'
  | 'helper_listing'
  | 'buy_sell'
  | 'safety_alert';

// Helper Skills
export type HelperSkill =
  | 'maid'
  | 'cook'
  | 'driver'
  | 'babysitter'
  | 'gardener'
  | 'security'
  | 'electrician'
  | 'plumber'
  | 'carpenter'
  | 'painter'
  | 'other';

// Listing Status
export type ListingStatus = 'available' | 'rented' | 'pending' | 'expired';

// Verification Status
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'not_submitted';

// Message Status
export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// Report Status
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

// Language
export type Language = 'en' | 'hi' | 'mr' | 'ta';

// Visibility
export type Visibility = 'neighborhood' | 'building' | 'group';

// Interfaces
export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  avatar?: string;
  language: Language;
  isVerified: boolean;
  trustScore: number;
  endorsementCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Neighborhood {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  inviteCode: string;
  isActive: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Building {
  id: string;
  neighborhoodId: string;
  name: string;
  address: string;
  type: 'apartment' | 'society' | 'independent' | 'commercial';
  unitCount?: number;
  createdAt: Date;
}

export interface MicroGroup {
  id: string;
  neighborhoodId: string;
  name: string;
  description?: string;
  type: 'building' | 'floor' | 'interest' | 'custom';
  isPrivate: boolean;
  memberCount: number;
  createdAt: Date;
}

export interface Membership {
  id: string;
  userId: string;
  neighborhoodId: string;
  buildingId?: string;
  role: UserRole;
  unit?: string; // flat number, house number
  isActive: boolean;
  verificationStatus: VerificationStatus;
  joinedAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  neighborhoodId: string;
  type: PostType;
  title?: string;
  content: string;
  images: string[];
  tags: string[];
  visibility: Visibility;
  targetGroupIds?: string[];
  location?: {
    latitude: number;
    longitude: number;
    approximateAddress?: string;
  };
  isUrgent: boolean;
  isPinned: boolean;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  isOffline?: boolean;
  syncStatus?: 'queued' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface RentalListing {
  id: string;
  postId: string;
  userId: string;
  neighborhoodId: string;
  propertyType: 'apartment' | 'house' | 'room' | 'pg' | 'commercial';
  bhk?: string;
  rentAmount: number;
  depositAmount: number;
  furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
  availableFrom: Date;
  area?: number; // in sq ft
  floor?: number;
  totalFloors?: number;
  amenities: string[];
  status: ListingStatus;
  contactPreference: 'chat' | 'call' | 'both';
  createdAt: Date;
  updatedAt: Date;
}

export interface HelperProfile {
  id: string;
  userId: string;
  neighborhoodId: string;
  skills: HelperSkill[];
  experience: number; // in years
  languages: Language[];
  hourlyRate?: number;
  monthlyRate?: number;
  availability: WeeklySchedule;
  backgroundCheckStatus: VerificationStatus;
  documentsVerified: boolean;
  referenceCount: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface Shop {
  id: string;
  userId: string;
  neighborhoodId: string;
  name: string;
  category: string;
  description?: string;
  address: string;
  phone?: string;
  hours: {
    [day: string]: { open: string; close: string } | null;
  };
  images: string[];
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  targetType: 'helper' | 'shop' | 'rental';
  targetId: string;
  taskId?: string; // linked task for verified reviews
  rating: number;
  content?: string;
  images?: string[];
  isVerified: boolean; // linked to completed task
  createdAt: Date;
}

export interface Endorsement {
  id: string;
  endorserId: string;
  endorseeId: string;
  type: 'trust' | 'skill' | 'reliability';
  message?: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  requesterId: string;
  providerId: string;
  helperProfileId?: string;
  shopId?: string;
  chatId: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  agreedAmount?: number;
  scheduledAt?: Date;
  completedAt?: Date;
  reviewPromptSent: boolean;
  createdAt: Date;
}

export interface Chat {
  id: string;
  participants: string[];
  type: 'direct' | 'task' | 'group';
  taskId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'template' | 'system';
  templateType?: string;
  images?: string[];
  status: MessageStatus;
  readBy: string[];
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'user' | 'message';
  targetId: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  moderatorId?: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ModerationAction {
  id: string;
  moderatorId: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  action: 'warn' | 'remove' | 'ban_temp' | 'ban_perm' | 'restore';
  reason: string;
  duration?: number; // in hours for temp bans
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface DigestPreference {
  id: string;
  userId: string;
  neighborhoodId: string;
  frequency: 'daily' | 'weekly' | 'never';
  includeAlerts: boolean;
  includeRecommendations: boolean;
  includeRentals: boolean;
  preferredTime: string; // HH:mm
  createdAt: Date;
  updatedAt: Date;
}

export interface Offer {
  id: string;
  shopId: string;
  title: string;
  description: string;
  discountPercent?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Feed Filter Types
export interface FeedFilters {
  type?: PostType[];
  tags?: string[];
  buildingId?: string;
  groupId?: string;
  isUrgent?: boolean;
  sortBy: 'recent' | 'nearby' | 'trending';
  page: number;
  limit: number;
}

// Parsed Rental Data (for auto-structured posts)
export interface ParsedRentalData {
  bhk?: string;
  rentAmount?: number;
  depositAmount?: number;
  furnishing?: string;
  locality?: string;
  area?: number;
  floor?: number;
}

// Trust Score Components
export interface TrustScoreBreakdown {
  baseScore: number;
  verificationBonus: number;
  endorsementBonus: number;
  activityBonus: number;
  reportPenalty: number;
  total: number;
}

// Message Templates
export interface MessageTemplate {
  id: string;
  key: string;
  text: {
    en: string;
    hi: string;
  };
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  { id: '1', key: 'is_available', text: { en: 'Is this still available?', hi: 'क्या यह अभी भी उपलब्ध है?' } },
  { id: '2', key: 'what_rate', text: { en: 'What is the rate?', hi: 'रेट क्या है?' } },
  { id: '3', key: 'share_photos', text: { en: 'Can you share more photos?', hi: 'क्या आप और फोटो भेज सकते हैं?' } },
  { id: '4', key: 'schedule_visit', text: { en: 'Can we schedule a visit?', hi: 'क्या हम विजिट शेड्यूल कर सकते हैं?' } },
  { id: '5', key: 'available_when', text: { en: 'When are you available?', hi: 'आप कब उपलब्ध हैं?' } },
];
