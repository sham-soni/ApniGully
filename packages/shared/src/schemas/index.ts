import { z } from 'zod';

// Phone number regex for Indian numbers
const phoneRegex = /^[6-9]\d{9}$/;

// Common Schemas
export const phoneSchema = z.string().regex(phoneRegex, 'Invalid Indian phone number');

export const pincodeSchema = z.string().regex(/^\d{6}$/, 'Invalid pincode');

// Auth Schemas
export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  language: z.enum(['en', 'hi', 'mr', 'ta']).default('en'),
});

// Neighborhood Schemas
export const createNeighborhoodSchema = z.object({
  name: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: pincodeSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(100).max(5000).default(500),
});

export const joinNeighborhoodSchema = z.object({
  neighborhoodId: z.string().uuid(),
  inviteCode: z.string().min(6).max(20).optional(),
  buildingId: z.string().uuid().optional(),
  unit: z.string().max(20).optional(),
});

// Building Schemas
export const createBuildingSchema = z.object({
  neighborhoodId: z.string().uuid(),
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(500),
  type: z.enum(['apartment', 'society', 'independent', 'commercial']),
  unitCount: z.number().int().min(1).optional(),
});

// Post Schemas
export const createPostSchema = z.object({
  type: z.enum([
    'announcement',
    'request',
    'recommendation',
    'rental',
    'helper_listing',
    'buy_sell',
    'safety_alert',
  ]),
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).max(5000),
  images: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string().max(50)).max(10).default([]),
  visibility: z.enum(['neighborhood', 'building', 'group']).default('neighborhood'),
  targetGroupIds: z.array(z.string().uuid()).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    approximateAddress: z.string().max(500).optional(),
  }).optional(),
  isUrgent: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

// Rental Listing Schemas
export const createRentalListingSchema = z.object({
  propertyType: z.enum(['apartment', 'house', 'room', 'pg', 'commercial']),
  bhk: z.string().max(10).optional(),
  rentAmount: z.number().int().min(0),
  depositAmount: z.number().int().min(0),
  furnishing: z.enum(['unfurnished', 'semi_furnished', 'fully_furnished']),
  availableFrom: z.string().datetime(),
  area: z.number().int().min(0).optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().optional(),
  amenities: z.array(z.string().max(50)).max(20).default([]),
  contactPreference: z.enum(['chat', 'call', 'both']).default('chat'),
  content: z.string().min(10).max(5000),
  images: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

// Helper Profile Schemas
export const createHelperProfileSchema = z.object({
  skills: z.array(z.enum([
    'maid', 'cook', 'driver', 'babysitter', 'gardener',
    'security', 'electrician', 'plumber', 'carpenter', 'painter', 'other',
  ])).min(1),
  experience: z.number().int().min(0).max(50),
  languages: z.array(z.enum(['en', 'hi', 'mr', 'ta'])).min(1),
  hourlyRate: z.number().int().min(0).optional(),
  monthlyRate: z.number().int().min(0).optional(),
  bio: z.string().max(1000).optional(),
  availability: z.object({
    monday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
    tuesday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
    wednesday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
    thursday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
    friday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
    saturday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
    sunday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
  }),
});

// Shop Schemas
export const createShopSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  address: z.string().min(5).max(500),
  phone: phoneSchema.optional(),
  hours: z.record(z.string(), z.object({
    open: z.string(),
    close: z.string(),
  }).nullable()).optional(),
  images: z.array(z.string().url()).max(10).default([]),
});

// Review Schemas
export const createReviewSchema = z.object({
  targetType: z.enum(['helper', 'shop', 'rental']),
  targetId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

// Endorsement Schemas
export const createEndorsementSchema = z.object({
  endorseeId: z.string().uuid(),
  type: z.enum(['trust', 'skill', 'reliability']),
  message: z.string().max(500).optional(),
});

// Message Schemas
export const sendMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'template']).default('text'),
  templateType: z.string().optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

export const createChatSchema = z.object({
  participantId: z.string().uuid(),
  type: z.enum(['direct', 'task']).default('direct'),
  initialMessage: z.string().min(1).max(5000).optional(),
});

// Task Schemas
export const createTaskSchema = z.object({
  providerId: z.string().uuid(),
  helperProfileId: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  agreedAmount: z.number().int().min(0).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['accepted', 'in_progress', 'completed', 'cancelled']),
});

// Report Schemas
export const createReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user', 'message']),
  targetId: z.string().uuid(),
  reason: z.enum([
    'spam',
    'harassment',
    'hate_speech',
    'misinformation',
    'scam',
    'inappropriate_content',
    'privacy_violation',
    'other',
  ]),
  description: z.string().max(1000).optional(),
});

// Comment Schemas
export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

// Reaction Schemas
export const createReactionSchema = z.object({
  postId: z.string().uuid(),
  type: z.enum(['like', 'helpful', 'thanks']),
});

// Search Schemas
export const searchSchema = z.object({
  query: z.string().min(2).max(200),
  type: z.enum(['all', 'posts', 'helpers', 'shops', 'rentals']).default('all'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

// Feed Filters Schema
export const feedFiltersSchema = z.object({
  type: z.array(z.enum([
    'announcement', 'request', 'recommendation', 'rental',
    'helper_listing', 'buy_sell', 'safety_alert',
  ])).optional(),
  tags: z.array(z.string()).optional(),
  buildingId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  isUrgent: z.boolean().optional(),
  sortBy: z.enum(['recent', 'nearby', 'trending']).default('recent'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

// Offer Schemas
export const createOfferSchema = z.object({
  shopId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().max(1000),
  discountPercent: z.number().int().min(1).max(100).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
});

// Digest Preference Schema
export const updateDigestPreferenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'never']),
  includeAlerts: z.boolean().default(true),
  includeRecommendations: z.boolean().default(true),
  includeRentals: z.boolean().default(true),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('09:00'),
});

// Moderation Action Schema
export const createModerationActionSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user']),
  targetId: z.string().uuid(),
  action: z.enum(['warn', 'remove', 'ban_temp', 'ban_perm', 'restore']),
  reason: z.string().min(10).max(500),
  duration: z.number().int().min(1).max(8760).optional(), // max 1 year in hours
});

// Micro Group Schemas
export const createMicroGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['building', 'floor', 'interest', 'custom']),
  isPrivate: z.boolean().default(false),
});

// Safety Alert Schema
export const createSafetyAlertSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(2000),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    approximateAddress: z.string().max(500).optional(),
  }).optional(),
});

// Safe Check-in Schema
export const safeCheckInSchema = z.object({
  alertId: z.string().uuid(),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
