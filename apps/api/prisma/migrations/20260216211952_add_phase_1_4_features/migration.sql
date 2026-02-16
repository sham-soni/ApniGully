-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('newcomer', 'resident', 'neighbor', 'pillar', 'guardian', 'legend');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('upi', 'wallet', 'card', 'netbanking');

-- CreateEnum
CREATE TYPE "SOSStatus" AS ENUM ('active', 'responded', 'resolved', 'false_alarm', 'cancelled');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('none', 'phone', 'video', 'aadhaar', 'full');

-- CreateEnum
CREATE TYPE "RWARole" AS ENUM ('president', 'secretary', 'treasurer', 'committee_member', 'resident');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'rejected');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "CirclePrivacy" AS ENUM ('public', 'private', 'invite_only');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('initiated', 'ringing', 'connected', 'ended', 'missed', 'declined', 'failed');

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('voice', 'video');

-- CreateEnum
CREATE TYPE "BackgroundCheckStatus" AS ENUM ('not_started', 'pending', 'in_progress', 'completed', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredLanguage" TEXT,
ADD COLUMN     "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'phone';

-- CreateTable
CREATE TABLE "UserEngagement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "postType" "PostType",
    "action" TEXT NOT NULL,
    "duration" INTEGER,
    "scrollDepth" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGamification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "UserLevel" NOT NULL DEFAULT 'newcomer',
    "karmaPoints" INTEGER NOT NULL DEFAULT 0,
    "totalKarmaEarned" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "postsCreated" INTEGER NOT NULL DEFAULT 0,
    "commentsGiven" INTEGER NOT NULL DEFAULT 0,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "eventsAttended" INTEGER NOT NULL DEFAULT 0,
    "pollsVoted" INTEGER NOT NULL DEFAULT 0,
    "referralsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGamification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "karmaReward" INTEGER NOT NULL DEFAULT 0,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarmaTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KarmaTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "karmaReward" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "payeeId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "taskId" TEXT,
    "subscriptionId" TEXT,
    "externalId" TEXT,
    "externalRef" TEXT,
    "metadata" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "SOSStatus" NOT NULL DEFAULT 'active',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "audioUrl" TEXT,
    "images" TEXT[],
    "responderCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SOSAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSResponder" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrivedAt" TIMESTAMP(3),

    CONSTRAINT "SOSResponder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSUpdate" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SOSUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveSOS" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceNote" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "waveform" TEXT,
    "transcript" TEXT,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "videoUrl" TEXT NOT NULL,
    "selfieUrl" TEXT,
    "aiScore" DOUBLE PRECISION,
    "reviewerId" TEXT,
    "reviewerNotes" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "VideoVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "shown" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "purpose" TEXT NOT NULL,
    "sharedWith" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" TEXT NOT NULL,
    "liveLocationId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RWA" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNo" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "establishedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RWA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RWAMember" (
    "id" TEXT NOT NULL,
    "rwaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RWARole" NOT NULL DEFAULT 'resident',
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RWAMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceDue" (
    "id" TEXT NOT NULL,
    "rwaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "paymentId" TEXT,
    "penalty" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceDue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "rwaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'medium',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintUpdate" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ComplaintStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "rwaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "agenda" TEXT,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "onlineLink" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "minutesUrl" TEXT,
    "recordingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingVote" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "votes" JSONB NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RWADocument" (
    "id" TEXT NOT NULL,
    "rwaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RWADocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RWAAnnouncement" (
    "id" TEXT NOT NULL,
    "rwaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "attachments" TEXT[],
    "publishedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RWAAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RWAAccount" (
    "id" TEXT NOT NULL,
    "rwaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "accountNo" TEXT,
    "ifsc" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RWAAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RWATransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "recordedBy" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RWATransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorPass" (
    "id" TEXT NOT NULL,
    "rwaId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "hostUnit" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT,
    "visitorVehicle" TEXT,
    "purpose" TEXT NOT NULL,
    "passCode" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "guardNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestCircle" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "coverImage" TEXT,
    "privacy" "CirclePrivacy" NOT NULL DEFAULT 'public',
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterestCircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleMember" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CirclePost" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CirclePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleEvent" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "onlineLink" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "maxAttendees" INTEGER,
    "attendeeCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "type" "CallType" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'initiated',
    "roomId" TEXT,
    "startedAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "endReason" TEXT,
    "quality" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualTour" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "roomName" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VirtualTour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourBooking" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "BackgroundCheckStatus" NOT NULL DEFAULT 'not_started',
    "requestId" TEXT,
    "result" JSONB,
    "score" INTEGER,
    "validUntil" TIMESTAMP(3),
    "documents" TEXT[],
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "helperProfileId" TEXT,
    "shopId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "timeSlot" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextOccurrence" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionOccurrence" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryView" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryReply" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryReaction" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryHighlight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "storyIds" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartHomeIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSynced" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartHomeIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "room" TEXT,
    "capabilities" JSONB NOT NULL,
    "currentState" JSONB,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartDeviceLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "value" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartDeviceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartAutomation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartScene" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "devices" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmartHomeAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmartHomeAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'internal',
    "confidence" DOUBLE PRECISION,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "contentType" TEXT,
    "contentId" TEXT,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "aliases" TEXT[],
    "icon" TEXT,
    "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
    "currentPrice" INTEGER,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "lastUpdated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceEntry" (
    "id" TEXT NOT NULL,
    "priceItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "shopName" TEXT,
    "shopId" TEXT,
    "notes" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "priceItemId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "targetPrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarpoolListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "endLocation" TEXT NOT NULL,
    "endLat" DOUBLE PRECISION,
    "endLng" DOUBLE PRECISION,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringDays" INTEGER[],
    "availableSeats" INTEGER NOT NULL DEFAULT 1,
    "pricePerSeat" INTEGER,
    "vehicleType" TEXT,
    "vehicleNumber" TEXT,
    "womenOnly" BOOLEAN NOT NULL DEFAULT false,
    "nonSmoking" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "luggageAllowed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarpoolListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarpoolMatch" (
    "id" TEXT NOT NULL,
    "offerListingId" TEXT NOT NULL,
    "requestListingId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "chatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarpoolMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarpoolRide" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "rideDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "actualDeparture" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "cancelReason" TEXT,
    "driverRating" INTEGER,
    "driverReview" TEXT,
    "passengerRating" INTEGER,
    "passengerReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarpoolRide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarpoolPassenger" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seatsBooked" INTEGER NOT NULL DEFAULT 1,
    "pickupLocation" TEXT,
    "dropLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "pickedUpAt" TIMESTAMP(3),
    "droppedOffAt" TIMESTAMP(3),
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarpoolPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserEngagement_userId_idx" ON "UserEngagement"("userId");

-- CreateIndex
CREATE INDEX "UserEngagement_postId_idx" ON "UserEngagement"("postId");

-- CreateIndex
CREATE INDEX "UserEngagement_action_idx" ON "UserEngagement"("action");

-- CreateIndex
CREATE INDEX "UserEngagement_createdAt_idx" ON "UserEngagement"("createdAt");

-- CreateIndex
CREATE INDEX "UserInterest_userId_idx" ON "UserInterest"("userId");

-- CreateIndex
CREATE INDEX "UserInterest_score_idx" ON "UserInterest"("score");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterest_userId_category_value_key" ON "UserInterest"("userId", "category", "value");

-- CreateIndex
CREATE UNIQUE INDEX "UserGamification_userId_key" ON "UserGamification"("userId");

-- CreateIndex
CREATE INDEX "UserGamification_karmaPoints_idx" ON "UserGamification"("karmaPoints");

-- CreateIndex
CREATE INDEX "UserGamification_level_idx" ON "UserGamification"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE INDEX "Badge_category_idx" ON "Badge"("category");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_earnedAt_idx" ON "UserBadge"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "KarmaTransaction_userId_idx" ON "KarmaTransaction"("userId");

-- CreateIndex
CREATE INDEX "KarmaTransaction_createdAt_idx" ON "KarmaTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "Challenge_isActive_idx" ON "Challenge"("isActive");

-- CreateIndex
CREATE INDEX "Challenge_endDate_idx" ON "Challenge"("endDate");

-- CreateIndex
CREATE INDEX "UserChallenge_userId_idx" ON "UserChallenge"("userId");

-- CreateIndex
CREATE INDEX "UserChallenge_challengeId_idx" ON "UserChallenge"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_key" ON "UserChallenge"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_payerId_idx" ON "Payment"("payerId");

-- CreateIndex
CREATE INDEX "Payment_payeeId_idx" ON "Payment"("payeeId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_externalId_idx" ON "Payment"("externalId");

-- CreateIndex
CREATE INDEX "SOSAlert_userId_idx" ON "SOSAlert"("userId");

-- CreateIndex
CREATE INDEX "SOSAlert_neighborhoodId_idx" ON "SOSAlert"("neighborhoodId");

-- CreateIndex
CREATE INDEX "SOSAlert_status_idx" ON "SOSAlert"("status");

-- CreateIndex
CREATE INDEX "SOSAlert_createdAt_idx" ON "SOSAlert"("createdAt");

-- CreateIndex
CREATE INDEX "SOSResponder_alertId_idx" ON "SOSResponder"("alertId");

-- CreateIndex
CREATE INDEX "SOSResponder_userId_idx" ON "SOSResponder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SOSResponder_alertId_userId_key" ON "SOSResponder"("alertId", "userId");

-- CreateIndex
CREATE INDEX "SOSUpdate_alertId_idx" ON "SOSUpdate"("alertId");

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceNote_messageId_key" ON "VoiceNote"("messageId");

-- CreateIndex
CREATE INDEX "VoiceNote_senderId_idx" ON "VoiceNote"("senderId");

-- CreateIndex
CREATE INDEX "VideoVerification_userId_idx" ON "VideoVerification"("userId");

-- CreateIndex
CREATE INDEX "VideoVerification_status_idx" ON "VideoVerification"("status");

-- CreateIndex
CREATE INDEX "RecommendationLog_userId_idx" ON "RecommendationLog"("userId");

-- CreateIndex
CREATE INDEX "RecommendationLog_type_idx" ON "RecommendationLog"("type");

-- CreateIndex
CREATE INDEX "RecommendationLog_createdAt_idx" ON "RecommendationLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiveLocation_sessionId_key" ON "LiveLocation"("sessionId");

-- CreateIndex
CREATE INDEX "LiveLocation_userId_idx" ON "LiveLocation"("userId");

-- CreateIndex
CREATE INDEX "LiveLocation_sessionId_idx" ON "LiveLocation"("sessionId");

-- CreateIndex
CREATE INDEX "LiveLocation_isActive_idx" ON "LiveLocation"("isActive");

-- CreateIndex
CREATE INDEX "LocationHistory_liveLocationId_idx" ON "LocationHistory"("liveLocationId");

-- CreateIndex
CREATE INDEX "LocationHistory_recordedAt_idx" ON "LocationHistory"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RWA_neighborhoodId_key" ON "RWA"("neighborhoodId");

-- CreateIndex
CREATE INDEX "RWA_neighborhoodId_idx" ON "RWA"("neighborhoodId");

-- CreateIndex
CREATE INDEX "RWAMember_rwaId_idx" ON "RWAMember"("rwaId");

-- CreateIndex
CREATE INDEX "RWAMember_userId_idx" ON "RWAMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RWAMember_rwaId_userId_key" ON "RWAMember"("rwaId", "userId");

-- CreateIndex
CREATE INDEX "MaintenanceDue_rwaId_idx" ON "MaintenanceDue"("rwaId");

-- CreateIndex
CREATE INDEX "MaintenanceDue_userId_idx" ON "MaintenanceDue"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceDue_status_idx" ON "MaintenanceDue"("status");

-- CreateIndex
CREATE INDEX "MaintenanceDue_dueDate_idx" ON "MaintenanceDue"("dueDate");

-- CreateIndex
CREATE INDEX "Complaint_rwaId_idx" ON "Complaint"("rwaId");

-- CreateIndex
CREATE INDEX "Complaint_userId_idx" ON "Complaint"("userId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "Complaint"("priority");

-- CreateIndex
CREATE INDEX "ComplaintUpdate_complaintId_idx" ON "ComplaintUpdate"("complaintId");

-- CreateIndex
CREATE INDEX "Meeting_rwaId_idx" ON "Meeting"("rwaId");

-- CreateIndex
CREATE INDEX "Meeting_scheduledAt_idx" ON "Meeting"("scheduledAt");

-- CreateIndex
CREATE INDEX "MeetingVote_meetingId_idx" ON "MeetingVote"("meetingId");

-- CreateIndex
CREATE INDEX "RWADocument_rwaId_idx" ON "RWADocument"("rwaId");

-- CreateIndex
CREATE INDEX "RWADocument_category_idx" ON "RWADocument"("category");

-- CreateIndex
CREATE INDEX "RWAAnnouncement_rwaId_idx" ON "RWAAnnouncement"("rwaId");

-- CreateIndex
CREATE INDEX "RWAAnnouncement_createdAt_idx" ON "RWAAnnouncement"("createdAt");

-- CreateIndex
CREATE INDEX "RWAAccount_rwaId_idx" ON "RWAAccount"("rwaId");

-- CreateIndex
CREATE INDEX "RWATransaction_accountId_idx" ON "RWATransaction"("accountId");

-- CreateIndex
CREATE INDEX "RWATransaction_transactionDate_idx" ON "RWATransaction"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorPass_passCode_key" ON "VisitorPass"("passCode");

-- CreateIndex
CREATE INDEX "VisitorPass_rwaId_idx" ON "VisitorPass"("rwaId");

-- CreateIndex
CREATE INDEX "VisitorPass_hostUserId_idx" ON "VisitorPass"("hostUserId");

-- CreateIndex
CREATE INDEX "VisitorPass_passCode_idx" ON "VisitorPass"("passCode");

-- CreateIndex
CREATE INDEX "VisitorPass_validUntil_idx" ON "VisitorPass"("validUntil");

-- CreateIndex
CREATE INDEX "InterestCircle_neighborhoodId_idx" ON "InterestCircle"("neighborhoodId");

-- CreateIndex
CREATE INDEX "InterestCircle_category_idx" ON "InterestCircle"("category");

-- CreateIndex
CREATE INDEX "InterestCircle_memberCount_idx" ON "InterestCircle"("memberCount");

-- CreateIndex
CREATE INDEX "CircleMember_circleId_idx" ON "CircleMember"("circleId");

-- CreateIndex
CREATE INDEX "CircleMember_userId_idx" ON "CircleMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleMember_circleId_userId_key" ON "CircleMember"("circleId", "userId");

-- CreateIndex
CREATE INDEX "CirclePost_circleId_idx" ON "CirclePost"("circleId");

-- CreateIndex
CREATE INDEX "CirclePost_userId_idx" ON "CirclePost"("userId");

-- CreateIndex
CREATE INDEX "CirclePost_createdAt_idx" ON "CirclePost"("createdAt");

-- CreateIndex
CREATE INDEX "CircleComment_postId_idx" ON "CircleComment"("postId");

-- CreateIndex
CREATE INDEX "CircleComment_parentId_idx" ON "CircleComment"("parentId");

-- CreateIndex
CREATE INDEX "CircleLike_postId_idx" ON "CircleLike"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleLike_postId_userId_key" ON "CircleLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "CircleEvent_circleId_idx" ON "CircleEvent"("circleId");

-- CreateIndex
CREATE INDEX "CircleEvent_startsAt_idx" ON "CircleEvent"("startsAt");

-- CreateIndex
CREATE INDEX "Call_callerId_idx" ON "Call"("callerId");

-- CreateIndex
CREATE INDEX "Call_receiverId_idx" ON "Call"("receiverId");

-- CreateIndex
CREATE INDEX "Call_status_idx" ON "Call"("status");

-- CreateIndex
CREATE INDEX "Call_createdAt_idx" ON "Call"("createdAt");

-- CreateIndex
CREATE INDEX "VirtualTour_rentalId_idx" ON "VirtualTour"("rentalId");

-- CreateIndex
CREATE INDEX "TourBooking_rentalId_idx" ON "TourBooking"("rentalId");

-- CreateIndex
CREATE INDEX "TourBooking_userId_idx" ON "TourBooking"("userId");

-- CreateIndex
CREATE INDEX "TourBooking_ownerId_idx" ON "TourBooking"("ownerId");

-- CreateIndex
CREATE INDEX "TourBooking_scheduledAt_idx" ON "TourBooking"("scheduledAt");

-- CreateIndex
CREATE INDEX "BackgroundCheck_userId_idx" ON "BackgroundCheck"("userId");

-- CreateIndex
CREATE INDEX "BackgroundCheck_status_idx" ON "BackgroundCheck"("status");

-- CreateIndex
CREATE INDEX "BackgroundCheck_type_idx" ON "BackgroundCheck"("type");

-- CreateIndex
CREATE INDEX "ServiceSubscription_userId_idx" ON "ServiceSubscription"("userId");

-- CreateIndex
CREATE INDEX "ServiceSubscription_providerId_idx" ON "ServiceSubscription"("providerId");

-- CreateIndex
CREATE INDEX "ServiceSubscription_status_idx" ON "ServiceSubscription"("status");

-- CreateIndex
CREATE INDEX "ServiceSubscription_nextOccurrence_idx" ON "ServiceSubscription"("nextOccurrence");

-- CreateIndex
CREATE INDEX "SubscriptionOccurrence_subscriptionId_idx" ON "SubscriptionOccurrence"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionOccurrence_scheduledAt_idx" ON "SubscriptionOccurrence"("scheduledAt");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "Story"("userId");

-- CreateIndex
CREATE INDEX "Story_neighborhoodId_idx" ON "Story"("neighborhoodId");

-- CreateIndex
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- CreateIndex
CREATE INDEX "StoryView_storyId_idx" ON "StoryView"("storyId");

-- CreateIndex
CREATE INDEX "StoryView_userId_idx" ON "StoryView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryView_storyId_userId_key" ON "StoryView"("storyId", "userId");

-- CreateIndex
CREATE INDEX "StoryReply_storyId_idx" ON "StoryReply"("storyId");

-- CreateIndex
CREATE INDEX "StoryReply_userId_idx" ON "StoryReply"("userId");

-- CreateIndex
CREATE INDEX "StoryReaction_storyId_idx" ON "StoryReaction"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryReaction_storyId_userId_key" ON "StoryReaction"("storyId", "userId");

-- CreateIndex
CREATE INDEX "StoryHighlight_userId_idx" ON "StoryHighlight"("userId");

-- CreateIndex
CREATE INDEX "SmartHomeIntegration_userId_idx" ON "SmartHomeIntegration"("userId");

-- CreateIndex
CREATE INDEX "SmartHomeIntegration_provider_idx" ON "SmartHomeIntegration"("provider");

-- CreateIndex
CREATE INDEX "SmartDevice_userId_idx" ON "SmartDevice"("userId");

-- CreateIndex
CREATE INDEX "SmartDevice_type_idx" ON "SmartDevice"("type");

-- CreateIndex
CREATE INDEX "SmartDevice_room_idx" ON "SmartDevice"("room");

-- CreateIndex
CREATE UNIQUE INDEX "SmartDevice_integrationId_externalId_key" ON "SmartDevice"("integrationId", "externalId");

-- CreateIndex
CREATE INDEX "SmartDeviceLog_deviceId_idx" ON "SmartDeviceLog"("deviceId");

-- CreateIndex
CREATE INDEX "SmartDeviceLog_createdAt_idx" ON "SmartDeviceLog"("createdAt");

-- CreateIndex
CREATE INDEX "SmartAutomation_userId_idx" ON "SmartAutomation"("userId");

-- CreateIndex
CREATE INDEX "SmartAutomation_isActive_idx" ON "SmartAutomation"("isActive");

-- CreateIndex
CREATE INDEX "SmartScene_userId_idx" ON "SmartScene"("userId");

-- CreateIndex
CREATE INDEX "SmartHomeAlert_userId_idx" ON "SmartHomeAlert"("userId");

-- CreateIndex
CREATE INDEX "SmartHomeAlert_createdAt_idx" ON "SmartHomeAlert"("createdAt");

-- CreateIndex
CREATE INDEX "Translation_sourceText_idx" ON "Translation"("sourceText");

-- CreateIndex
CREATE INDEX "Translation_targetLanguage_idx" ON "Translation"("targetLanguage");

-- CreateIndex
CREATE INDEX "TranslationRequest_userId_idx" ON "TranslationRequest"("userId");

-- CreateIndex
CREATE INDEX "TranslationRequest_translationId_idx" ON "TranslationRequest"("translationId");

-- CreateIndex
CREATE INDEX "PriceItem_neighborhoodId_idx" ON "PriceItem"("neighborhoodId");

-- CreateIndex
CREATE INDEX "PriceItem_category_idx" ON "PriceItem"("category");

-- CreateIndex
CREATE INDEX "PriceItem_name_idx" ON "PriceItem"("name");

-- CreateIndex
CREATE INDEX "PriceEntry_priceItemId_idx" ON "PriceEntry"("priceItemId");

-- CreateIndex
CREATE INDEX "PriceEntry_userId_idx" ON "PriceEntry"("userId");

-- CreateIndex
CREATE INDEX "PriceEntry_reportedAt_idx" ON "PriceEntry"("reportedAt");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_idx" ON "PriceAlert"("userId");

-- CreateIndex
CREATE INDEX "PriceAlert_priceItemId_idx" ON "PriceAlert"("priceItemId");

-- CreateIndex
CREATE INDEX "PriceAlert_isActive_idx" ON "PriceAlert"("isActive");

-- CreateIndex
CREATE INDEX "CarpoolListing_neighborhoodId_idx" ON "CarpoolListing"("neighborhoodId");

-- CreateIndex
CREATE INDEX "CarpoolListing_userId_idx" ON "CarpoolListing"("userId");

-- CreateIndex
CREATE INDEX "CarpoolListing_type_idx" ON "CarpoolListing"("type");

-- CreateIndex
CREATE INDEX "CarpoolListing_departureTime_idx" ON "CarpoolListing"("departureTime");

-- CreateIndex
CREATE INDEX "CarpoolListing_isActive_idx" ON "CarpoolListing"("isActive");

-- CreateIndex
CREATE INDEX "CarpoolMatch_offerListingId_idx" ON "CarpoolMatch"("offerListingId");

-- CreateIndex
CREATE INDEX "CarpoolMatch_requestListingId_idx" ON "CarpoolMatch"("requestListingId");

-- CreateIndex
CREATE INDEX "CarpoolMatch_status_idx" ON "CarpoolMatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CarpoolMatch_offerListingId_requestListingId_key" ON "CarpoolMatch"("offerListingId", "requestListingId");

-- CreateIndex
CREATE INDEX "CarpoolRide_listingId_idx" ON "CarpoolRide"("listingId");

-- CreateIndex
CREATE INDEX "CarpoolRide_driverId_idx" ON "CarpoolRide"("driverId");

-- CreateIndex
CREATE INDEX "CarpoolRide_rideDate_idx" ON "CarpoolRide"("rideDate");

-- CreateIndex
CREATE INDEX "CarpoolRide_status_idx" ON "CarpoolRide"("status");

-- CreateIndex
CREATE INDEX "CarpoolPassenger_rideId_idx" ON "CarpoolPassenger"("rideId");

-- CreateIndex
CREATE INDEX "CarpoolPassenger_userId_idx" ON "CarpoolPassenger"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CarpoolPassenger_rideId_userId_key" ON "CarpoolPassenger"("rideId", "userId");

-- AddForeignKey
ALTER TABLE "UserGamification" ADD CONSTRAINT "UserGamification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserGamification"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarmaTransaction" ADD CONSTRAINT "KarmaTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserGamification"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserGamification"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSResponder" ADD CONSTRAINT "SOSResponder_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "SOSAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOSUpdate" ADD CONSTRAINT "SOSUpdate_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "SOSAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_liveLocationId_fkey" FOREIGN KEY ("liveLocationId") REFERENCES "LiveLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RWAMember" ADD CONSTRAINT "RWAMember_rwaId_fkey" FOREIGN KEY ("rwaId") REFERENCES "RWA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceDue" ADD CONSTRAINT "MaintenanceDue_rwaId_fkey" FOREIGN KEY ("rwaId") REFERENCES "RWA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_rwaId_fkey" FOREIGN KEY ("rwaId") REFERENCES "RWA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintUpdate" ADD CONSTRAINT "ComplaintUpdate_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_rwaId_fkey" FOREIGN KEY ("rwaId") REFERENCES "RWA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingVote" ADD CONSTRAINT "MeetingVote_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RWADocument" ADD CONSTRAINT "RWADocument_rwaId_fkey" FOREIGN KEY ("rwaId") REFERENCES "RWA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RWAAnnouncement" ADD CONSTRAINT "RWAAnnouncement_rwaId_fkey" FOREIGN KEY ("rwaId") REFERENCES "RWA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RWAAccount" ADD CONSTRAINT "RWAAccount_rwaId_fkey" FOREIGN KEY ("rwaId") REFERENCES "RWA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RWATransaction" ADD CONSTRAINT "RWATransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "RWAAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorPass" ADD CONSTRAINT "VisitorPass_rwaId_fkey" FOREIGN KEY ("rwaId") REFERENCES "RWA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "InterestCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CirclePost" ADD CONSTRAINT "CirclePost_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "InterestCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleComment" ADD CONSTRAINT "CircleComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CirclePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleLike" ADD CONSTRAINT "CircleLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CirclePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleEvent" ADD CONSTRAINT "CircleEvent_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "InterestCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionOccurrence" ADD CONSTRAINT "SubscriptionOccurrence_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ServiceSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ServiceSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReply" ADD CONSTRAINT "StoryReply_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReaction" ADD CONSTRAINT "StoryReaction_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartDevice" ADD CONSTRAINT "SmartDevice_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "SmartHomeIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartDeviceLog" ADD CONSTRAINT "SmartDeviceLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "SmartDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationRequest" ADD CONSTRAINT "TranslationRequest_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceEntry" ADD CONSTRAINT "PriceEntry_priceItemId_fkey" FOREIGN KEY ("priceItemId") REFERENCES "PriceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_priceItemId_fkey" FOREIGN KEY ("priceItemId") REFERENCES "PriceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolListing" ADD CONSTRAINT "CarpoolListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolMatch" ADD CONSTRAINT "CarpoolMatch_offerListingId_fkey" FOREIGN KEY ("offerListingId") REFERENCES "CarpoolListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolMatch" ADD CONSTRAINT "CarpoolMatch_requestListingId_fkey" FOREIGN KEY ("requestListingId") REFERENCES "CarpoolListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolRide" ADD CONSTRAINT "CarpoolRide_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarpoolListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolRide" ADD CONSTRAINT "CarpoolRide_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolPassenger" ADD CONSTRAINT "CarpoolPassenger_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "CarpoolRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarpoolPassenger" ADD CONSTRAINT "CarpoolPassenger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
