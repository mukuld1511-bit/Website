// ============================================================
//  SYNTHÉ — types/gallery.ts
//  Updated: merged, no duplicates, meetLink + jitsiRoom added
// ============================================================

// ─── Gallery filter types ─────────────────────────────────────
export type SortOption  = "newest" | "popular" | "downloads" | "price-low" | "price-high";
export type PriceRange  = "all" | "free" | "paid";

export interface GalleryFiltersState {
  search:     string;
  category:   string;
  fileType:   string;
  priceRange: PriceRange;
  sortBy:     SortOption;
  tags:       string[];
}

// ─── User roles ───────────────────────────────────────────────
export type UserRole = "user" | "learner" | "developer" | "mentor" | "admin";

export interface UserProfile {
  uid:          string;
  displayName:  string;
  email:        string;
  photoURL:     string;
  role:         UserRole;
  roles?:       UserRole[];
  isCertified?: boolean;
  bio?:         string;
  skills?:      string[];
  hourlyRate?:  number;
  rating?:      number;
  totalSessions?: number;
  paymentDone?: boolean;
  isActive?:    boolean;
  createdAt?:   any;
}

// ─── Model / asset ────────────────────────────────────────────
export type FileType = "glb" | "gltf" | "obj" | "fbx" | "zip" | "dwg" | "dxf" | "build";
export type AccessType = "purchase" | "request" | "free" | "buy";
export type GalleryModel = Model;

export interface Model {
  id:               string;
  title:            string;
  description?:     string;
  modelUrl?:        string;
  fileUrl?:         string;        // alias — some pages use fileUrl
  thumbnailUrl?:    string;
  fileType:         FileType | string;
  category?:        string;
  tags?:            string[];
  isPaid?:          boolean;
  price?:           number;
  authorId?:        string;
  authorName?:      string;
  authorPhoto?:     string;
  uploadedBy?:      string;        // alias for authorId
  uploaderName?:    string;        // alias for authorName
  uploadedAt?:      any;
  status:           "published" | "draft" | "pending" | "approved" | "rejected";
  storageProvider?: "r2" | "supabase";
  engagementScore?: number;
  views?:           number;
  likes?:           number;
  downloads?:       number;
  purchasedBy?:     string[];
  fileSize?:        number;
  webxrReady?:      boolean;
  r2Key?:           string;
  accessType?:      AccessType;
  // XR build specific
  version?:         string;
  platforms?:       string[];
  genre?:           string;
  minimumSpecs?:    { ram: string; storage: string; os: string };
  changelog?:       string;
  polygons?:        string;
}

// ─── Workshop / live session ──────────────────────────────────
export type WorkshopStatus = "upcoming" | "live" | "ended";

export interface Workshop {
  id:               string;
  title:            string;
  description?:     string;
  hostId:           string;
  hostName:         string;
  hostPhoto?:       string;
  date:             any;           // Firestore Timestamp
  duration:         number;        // minutes
  topic?:           string;
  tags?:            string[];
  meetLink?:        string;        // shown only post-registration / when live
  jitsiRoom?:       string;
  maxSeats:         number;
  registeredUsers?: string[];
  price:            number;        // 0 = free
  status:           WorkshopStatus;
  createdAt?:       any;
}

// ─── Mentor / hire session ────────────────────────────────────
export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface MentorSession {
  id:             string;
  mentorId:       string;
  mentorName:     string;
  learnerId:      string;
  learnerName:    string;
  topic:          string;
  message?:       string;
  date?:          any;
  duration?:      number;
  price:          number;
  platformFee?:   number;
  mentorEarns?:   number;
  meetLink?:      string;
  status:         SessionStatus;
  paymentId?:     string;
  paymentStatus?: "paid" | "pending" | "refunded";
  createdAt:      any;
}

// ─── Freelance project ────────────────────────────────────────
export interface ProjectRequest {
  id:          string;
  title:       string;
  description: string;
  budget:      number;
  budgetType?: "fixed" | "negotiable";
  authorId:    string;
  authorName:  string;
  tags?:       string[];
  skills?:     string[];
  status:      "open" | "in-progress" | "closed";
  bids?:       Bid[];
  createdAt:   any;
}

export interface Bid {
  userId:    string;
  userName:  string;
  amount:    number;
  message:   string;
  status:    "pending" | "accepted" | "rejected";
  createdAt: any;
}

// ─── Role application ─────────────────────────────────────────
export interface RoleApplication {
  id:         string;
  userId:     string;
  userName:   string;
  role:       UserRole;
  portfolio?: string;
  message?:   string;
  status:     "pending" | "approved" | "rejected";
  createdAt:  any;
}

// ─── Payment types ────────────────────────────────────────────
export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?:  string;
  razorpay_signature?: string;
}