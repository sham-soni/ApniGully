import type { ParsedRentalData, TrustScoreBreakdown, Language } from '../types';

// Trust Score Calculation
export function calculateTrustScore(params: {
  isVerified: boolean;
  endorsementCount: number;
  positiveReviews: number;
  negativeReviews: number;
  reportCount: number;
  accountAgeDays: number;
}): TrustScoreBreakdown {
  const { isVerified, endorsementCount, positiveReviews, negativeReviews, reportCount, accountAgeDays } = params;

  // Base score
  const baseScore = 50;

  // Verification bonus (+20)
  const verificationBonus = isVerified ? 20 : 0;

  // Endorsement bonus (max +15, 3 points per endorsement)
  const endorsementBonus = Math.min(endorsementCount * 3, 15);

  // Activity bonus based on positive reviews and account age (max +10)
  const reviewRatio = positiveReviews / (positiveReviews + negativeReviews + 1);
  const activityBonus = Math.min(
    Math.floor(reviewRatio * 5) + Math.min(Math.floor(accountAgeDays / 30), 5),
    10
  );

  // Report penalty (-5 per unresolved report, max -15)
  const reportPenalty = Math.min(reportCount * 5, 15);

  const total = Math.max(
    0,
    Math.min(100, baseScore + verificationBonus + endorsementBonus + activityBonus - reportPenalty)
  );

  return {
    baseScore,
    verificationBonus,
    endorsementBonus,
    activityBonus,
    reportPenalty,
    total,
  };
}

// Auto-Structured Post Parsing (deterministic NLP)
export function parseRentalPost(text: string): ParsedRentalData {
  const result: ParsedRentalData = {};
  const lowerText = text.toLowerCase();

  // Parse BHK
  const bhkMatch = text.match(/(\d+)\s*(?:bhk|BHK|Bhk)/i);
  if (bhkMatch) {
    result.bhk = bhkMatch[1] + 'BHK';
  }

  // Parse rent amount (various formats)
  const rentPatterns = [
    /(?:rent|rental|at|for)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:k|K|lac|lakh|lacs)?/i,
    /(?:rs\.?|₹|inr)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:k|K|lac|lakh|lacs)?(?:\s*(?:\/\s*month|pm|per\s*month))?/i,
    /(\d+(?:,\d{3})*)\s*(?:k|K)\s*(?:rent|rental|pm|per\s*month)/i,
  ];

  for (const pattern of rentPatterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      // Handle 'k' suffix (thousands)
      if (lowerText.includes('k') && amount < 1000) {
        amount *= 1000;
      }
      // Handle 'lac' suffix
      if (/lac|lakh|lacs/i.test(text)) {
        amount *= 100000;
      }
      result.rentAmount = Math.round(amount);
      break;
    }
  }

  // Parse deposit
  const depositMatch = text.match(/(?:deposit|security)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:k|K|lac|lakh|lacs)?/i);
  if (depositMatch) {
    let amount = parseFloat(depositMatch[1].replace(/,/g, ''));
    if (/k/i.test(depositMatch[0]) && amount < 1000) {
      amount *= 1000;
    }
    if (/lac|lakh|lacs/i.test(depositMatch[0])) {
      amount *= 100000;
    }
    result.depositAmount = Math.round(amount);
  }

  // Parse furnishing
  if (/fully\s*furnished|ff\b/i.test(text)) {
    result.furnishing = 'fully_furnished';
  } else if (/semi\s*furnished|sf\b/i.test(text)) {
    result.furnishing = 'semi_furnished';
  } else if (/unfurnished|uf\b/i.test(text)) {
    result.furnishing = 'unfurnished';
  }

  // Parse area
  const areaMatch = text.match(/(\d+(?:,\d{3})*)\s*(?:sq\.?\s*ft|sqft|sft|square\s*feet)/i);
  if (areaMatch) {
    result.area = parseInt(areaMatch[1].replace(/,/g, ''), 10);
  }

  // Parse floor
  const floorMatch = text.match(/(?:floor|flr)\s*(\d+)/i);
  if (floorMatch) {
    result.floor = parseInt(floorMatch[1], 10);
  }

  // Parse locality (common Mumbai/Delhi/Bangalore areas)
  const localities = [
    'andheri', 'bandra', 'juhu', 'malad', 'kandivali', 'borivali', 'powai',
    'thane', 'navi mumbai', 'worli', 'dadar', 'kurla', 'ghatkopar',
    'koramangala', 'indiranagar', 'whitefield', 'hsr layout', 'jayanagar',
    'defence colony', 'hauz khas', 'saket', 'vasant kunj', 'dwarka', 'rohini',
    'gurgaon', 'noida', 'greater noida', 'faridabad', 'ghaziabad',
  ];

  for (const locality of localities) {
    if (lowerText.includes(locality)) {
      result.locality = locality.charAt(0).toUpperCase() + locality.slice(1);
      break;
    }
  }

  return result;
}

// Duplicate Detection (simple hash-based)
export function getPostFingerprint(content: string, type: string): string {
  // Normalize text
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

  // Simple hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `${type}:${hash}`;
}

// Rate Limiting Helpers
export function isRateLimited(
  actions: Date[],
  maxActions: number,
  windowMs: number
): boolean {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const actionsInWindow = actions.filter(a => a >= windowStart);
  return actionsInWindow.length >= maxActions;
}

// Distance Calculation (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Format Indian Phone Number
export function formatIndianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

// Mask Phone Number for Privacy
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`;
  }
  return '****';
}

// Generate Invite Code
export function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate OTP
export function generateOtp(length: number = 6): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

// Slug Generation
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

// Time Formatting
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    discover: 'Discover',
    post: 'Post',
    inbox: 'Inbox',
    profile: 'Profile',
    neighborhood: 'Neighborhood',
    helpers: 'Helpers',
    shops: 'Shops',
    rentals: 'Rentals',
    services: 'Services',
    announcements: 'Announcements',
    requests: 'Requests',
    recommendations: 'Recommendations',
    safety_alerts: 'Safety Alerts',
    buy_sell: 'Buy/Sell',
    verified: 'Verified',
    trusted_by: 'Trusted by',
    neighbors: 'neighbors',
    available: 'Available',
    not_available: 'Not Available',
    send_message: 'Send Message',
    report: 'Report',
    share: 'Share',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    loading: 'Loading...',
    no_results: 'No results found',
    offline_mode: 'Offline Mode',
    syncing: 'Syncing...',
    error: 'Something went wrong',
    retry: 'Retry',
  },
  hi: {
    home: 'होम',
    discover: 'खोजें',
    post: 'पोस्ट',
    inbox: 'इनबॉक्स',
    profile: 'प्रोफाइल',
    neighborhood: 'पड़ोस',
    helpers: 'हेल्पर्स',
    shops: 'दुकानें',
    rentals: 'किराये',
    services: 'सेवाएं',
    announcements: 'घोषणाएं',
    requests: 'अनुरोध',
    recommendations: 'सिफारिशें',
    safety_alerts: 'सुरक्षा अलर्ट',
    buy_sell: 'खरीदें/बेचें',
    verified: 'सत्यापित',
    trusted_by: 'विश्वास',
    neighbors: 'पड़ोसी',
    available: 'उपलब्ध',
    not_available: 'उपलब्ध नहीं',
    send_message: 'संदेश भेजें',
    report: 'रिपोर्ट',
    share: 'शेयर',
    save: 'सेव',
    cancel: 'रद्द',
    submit: 'जमा करें',
    loading: 'लोड हो रहा है...',
    no_results: 'कोई परिणाम नहीं',
    offline_mode: 'ऑफलाइन मोड',
    syncing: 'सिंक हो रहा है...',
    error: 'कुछ गलत हुआ',
    retry: 'पुन: प्रयास',
  },
  mr: {
    home: 'होम',
    discover: 'शोधा',
    post: 'पोस्ट',
    inbox: 'इनबॉक्स',
    profile: 'प्रोफाइल',
    neighborhood: 'शेजार',
    helpers: 'मदतनीस',
    shops: 'दुकाने',
    rentals: 'भाडे',
    services: 'सेवा',
    announcements: 'घोषणा',
    requests: 'विनंती',
    recommendations: 'शिफारसी',
    safety_alerts: 'सुरक्षा इशारे',
    buy_sell: 'खरेदी/विक्री',
    verified: 'सत्यापित',
    trusted_by: 'विश्वास',
    neighbors: 'शेजारी',
    available: 'उपलब्ध',
    not_available: 'उपलब्ध नाही',
    send_message: 'संदेश पाठवा',
    report: 'तक्रार',
    share: 'शेअर',
    save: 'जतन',
    cancel: 'रद्द',
    submit: 'सबमिट',
    loading: 'लोड होत आहे...',
    no_results: 'परिणाम नाहीत',
    offline_mode: 'ऑफलाइन मोड',
    syncing: 'सिंक होत आहे...',
    error: 'काहीतरी चूक झाली',
    retry: 'पुन्हा प्रयत्न',
  },
  ta: {
    home: 'முகப்பு',
    discover: 'கண்டுபிடி',
    post: 'இடுகை',
    inbox: 'இன்பாக்ஸ்',
    profile: 'சுயவிவரம்',
    neighborhood: 'அக்கம்',
    helpers: 'உதவியாளர்கள்',
    shops: 'கடைகள்',
    rentals: 'வாடகை',
    services: 'சேவைகள்',
    announcements: 'அறிவிப்புகள்',
    requests: 'கோரிக்கைகள்',
    recommendations: 'பரிந்துரைகள்',
    safety_alerts: 'பாதுகாப்பு',
    buy_sell: 'வாங்கு/விற்கு',
    verified: 'சரிபார்க்கப்பட்டது',
    trusted_by: 'நம்பிக்கை',
    neighbors: 'அண்டை',
    available: 'கிடைக்கும்',
    not_available: 'கிடைக்காது',
    send_message: 'செய்தி அனுப்பு',
    report: 'புகார்',
    share: 'பகிர்',
    save: 'சேமி',
    cancel: 'ரத்து',
    submit: 'சமர்ப்பி',
    loading: 'ஏற்றுகிறது...',
    no_results: 'முடிவுகள் இல்லை',
    offline_mode: 'ஆஃப்லைன் பயன்முறை',
    syncing: 'ஒத்திசைக்கிறது...',
    error: 'பிழை ஏற்பட்டது',
    retry: 'மீண்டும் முயற்சி',
  },
};

export function t(key: string, language: Language = 'en'): string {
  return translations[language]?.[key] || translations.en[key] || key;
}

// Constants
export const POST_TYPE_LABELS: Record<string, { en: string; hi: string }> = {
  announcement: { en: 'Announcement', hi: 'घोषणा' },
  request: { en: 'Need Help', hi: 'मदद चाहिए' },
  recommendation: { en: 'Recommendation', hi: 'सिफारिश' },
  rental: { en: 'Rental', hi: 'किराया' },
  helper_listing: { en: 'Helper', hi: 'हेल्पर' },
  buy_sell: { en: 'Buy/Sell', hi: 'खरीदें/बेचें' },
  safety_alert: { en: 'Safety Alert', hi: 'सुरक्षा अलर्ट' },
};

export const SKILL_LABELS: Record<string, { en: string; hi: string }> = {
  maid: { en: 'Maid', hi: 'बाई' },
  cook: { en: 'Cook', hi: 'कुक' },
  driver: { en: 'Driver', hi: 'ड्राइवर' },
  babysitter: { en: 'Babysitter', hi: 'बेबीसिटर' },
  gardener: { en: 'Gardener', hi: 'माली' },
  security: { en: 'Security', hi: 'सिक्योरिटी' },
  electrician: { en: 'Electrician', hi: 'इलेक्ट्रीशियन' },
  plumber: { en: 'Plumber', hi: 'प्लंबर' },
  carpenter: { en: 'Carpenter', hi: 'कारपेंटर' },
  painter: { en: 'Painter', hi: 'पेंटर' },
  other: { en: 'Other', hi: 'अन्य' },
};

// Rate Limit Configurations
export const RATE_LIMITS = {
  OTP_PER_PHONE: { max: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  POSTS_PER_USER: { max: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 per day
  MESSAGES_PER_CHAT: { max: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  REPORTS_PER_USER: { max: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 per day
  OFFERS_PER_SHOP: { max: 3, windowMs: 7 * 24 * 60 * 60 * 1000 }, // 3 per week
};
