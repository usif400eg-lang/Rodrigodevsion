// ─── Firestore document types for Rodrigo eFootball Platform ───────────────

export type AdminRole = "OWNER" | "ADMIN" | "STAFF";

export type OrderStatus =
  | "NEW"
  | "CONTACTED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "UNPAID" | "PAYMENT_PENDING" | "PAID" | "REFUNDED";

export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "email"
  | "telegram"
  | "phone"
  | "select"
  | "radio"
  | "checkbox"
  | "yes_no"
  | "date";

export type PlayerStyle = "epic" | "showtime" | "legend" | "highlight";

// ─── admins/{uid} ──────────────────────────────────────────────────────────
export interface AdminDoc {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  createdAt: string;
  createdBy?: string;
  active: boolean;
}

// ─── services/{serviceId} ──────────────────────────────────────────────────
export interface ServiceDoc {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  currency: string;
  estimatedTime: string;
  badge?: string;
  type: "division_boost" | "player_guarantee";
  images: string[];
  formId?: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── players/{playerId} ────────────────────────────────────────────────────
export interface PlayerDoc {
  id: string;
  name: string;
  position: string;
  rating: number;
  club: string;
  style: PlayerStyle;
  stars: number;
  boosters: number[]; // length 9
  imageUrl?: string;
  // Per-player booster badge (shown below the skill icons row)
  boosterName?: string;    // e.g. "Legend Booster" / "Big Time"
  boosterIconUrl?: string; // custom icon image for this player's booster badge
  price?: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── questions/{questionId} ────────────────────────────────────────────────
export interface QuestionDoc {
  id: string;
  formId: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  min?: number;
  max?: number;
  options?: string[]; // for select/radio/checkbox
  sortOrder: number;
  active: boolean;
}

// ─── forms/{formId} ────────────────────────────────────────────────────────
export interface FormDoc {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── orders/{orderId} ──────────────────────────────────────────────────────
export interface OrderDoc {
  // Public fields (visible to customer on tracking)
  orderId: string; // RDG-xxxx
  serviceId: string;
  serviceName: string;
  price: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  proofUrls?: string[]; // admin-uploaded proof screenshots

  // Customer info (semi-public — shown on tracking)
  customerName: string;
  telegram: string;
  whatsapp?: string;
  answers: Record<string, string>; // form field answers

  // Admin-only fields (must never be shown to customer on frontend)
  internalNotes?: string;
  assignedAdmin?: string;
  sessionId?: string; // for anti-spam
  deletedAt?: string; // soft delete
}

// ─── orderMessages/{id} ────────────────────────────────────────────────────
export interface OrderMessageDoc {
  id: string;
  orderId: string;
  author: "customer" | "admin";
  authorName?: string;
  message: string;
  createdAt: string;
}

// ─── customers/{customerId} ────────────────────────────────────────────────
export interface CustomerDoc {
  id: string;
  telegram?: string;
  whatsapp?: string;
  name?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  blocked: boolean;
  createdAt: string;
}

// ─── blockedUsers/{id} ─────────────────────────────────────────────────────
export interface BlockedUserDoc {
  id: string;
  telegram?: string;
  whatsapp?: string;
  reason?: string;
  blockedBy: string;
  blockedAt: string;
}

// ─── faq/{faqId} ───────────────────────────────────────────────────────────
export interface FaqDoc {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

// ─── notifications/{id} ────────────────────────────────────────────────────
export interface NotificationDoc {
  id: string;
  title: string;
  body: string;
  type: "new_order" | "status_change" | "payment" | "system";
  orderId?: string;
  read: boolean;
  createdAt: string;
}

// ─── activityLogs/{logId} ──────────────────────────────────────────────────
export interface ActivityLogDoc {
  id: string;
  adminUid: string;
  adminName: string;
  action: string; // e.g. "status_change", "payment_marked", "note_added"
  entityType: "order" | "service" | "player" | "admin" | "settings" | "faq";
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

// ─── offers/{id} ───────────────────────────────────────────────────────────
export interface OfferDoc {
  id: string;
  title: string;
  badge?: string;
  discount: string; // e.g. "خصم 30%"
  price: string;
  oldPrice?: string;
  currency: string;
  duration?: string;
  desc: string;
  features: string[];
  highlight: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
}

// ─── coupons/{id} ──────────────────────────────────────────────────────────
export interface CouponDoc {
  id: string;
  code: string;
  discount: number; // percentage e.g. 15 for 15%
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── settings/site ─────────────────────────────────────────────────────────
export interface SiteSettingsDoc {
  siteName: string;
  tagline: string;
  heroHeadline: string;
  heroSub: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  showHero: boolean;
  showTrustStrip: boolean;
  showServices: boolean;
  showHowItWorks: boolean;
  showFaq: boolean;
  showCta: boolean;
  showUpgrades: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt: string;
}

// ─── settings/contact ──────────────────────────────────────────────────────
export interface ContactSettingsDoc {
  whatsappNumber: string; // e.g. "201012345678"
  telegramUsername: string; // e.g. "RodrigoServices" (no @, no token)
  telegramBotUsername?: string;
  supportHours: string;
  updatedAt: string;
}

// ─── settings/appearance ───────────────────────────────────────────────────
export interface AppearanceSettingsDoc {
  primaryColor: string; // must stay in purple family
  updatedAt: string;
}

// ─── settings/seo ──────────────────────────────────────────────────────────
export interface SeoSettingsDoc {
  title: string;
  description: string;
  keywords: string;
  updatedAt: string;
}

// ─── settings/orderCounter ─────────────────────────────────────────────────
export interface OrderCounterDoc {
  current: number; // starts at 1000, next order = 1001 → RDG-1001
}

// ─── dashboardStats/global ─────────────────────────────────────────────────
export interface DashboardStatsDoc {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  updatedAt: string;
}
