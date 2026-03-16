// ============================================================
//  SYNTHÉ — types/gallery.ts
//  Updated: 5 user roles + workshop types added
// ============================================================

// ─── Gallery filter types (used by GalleryFilters.tsx) ───────
export type SortOption   = "newest" | "popular" | "downloads" | "price-low" | "price-high";
export type PriceRange   = "all" | "free" | "paid";

export interface GalleryFiltersState {
  search:    string;
  category:  string;
  fileType:  string;
  priceRange: PriceRange;
  sortBy:    SortOption;
  tags:      string[];
}

// ─── User roles ──────────────────────────────────────────────
export type UserRole = "user" | "learner" | "developer" | "mentor" | "admin";

export interface UserProfile {
  uid:          string;
  displayName:  string;
  email:        string;
  photoURL:     string;
  role:         UserRole;
  roles?:       UserRole[];        // future: multi-role support
  isCertified?: boolean;
  bio?:         string;
  skills?:      string[];
  createdAt?:   any;
}

// ─── Model / asset ───────────────────────────────────────────
export type FileType = "glb" | "gltf" | "obj" | "fbx" | "zip" | "dwg" | "dxf" | "build";

export interface Model {
  id:               string;
  title:            string;
  description?:     string;
  modelUrl:         string;
  thumbnailUrl?:    string;
  fileType:         FileType;
  category?:        string;
  tags?:            string[];
  isPaid:           boolean;
  price?:           number;
  authorId:         string;
  authorName:       string;
  authorPhoto?:     string;
  uploadedAt?:      any;
  status:           "published" | "draft";
  storageProvider?: "r2" | "supabase";
  engagementScore?: number;
  views?:           number;
  likes?:           number;
  downloads?:       number;
  fileSize?:        number;
  // XR build specific
  version?:         string;
  platforms?:       string[];
  genre?:           string;
  minimumSpecs?:    { ram: string; storage: string; os: string };
  changelog?:       string;
  polygons?:        string;
  accessType?:      "buy" | "request";
}

export type GalleryModel = Model;

// ─── Workshop / live session ──────────────────────────────────
export type WorkshopStatus = "upcoming" | "live" | "ended";

export interface Workshop {
  id:               string;
  title:            string;
  description:      string;
  hostId:           string;
  hostName:         string;
  hostPhoto?:       string;
  date:             any;           // Firestore Timestamp
  duration:         number;        // minutes
  topic:            string;
  tags:             string[];      // e.g. ["AR", "Unity", "WebXR"]
  meetLink:         string;        // shown only post-registration
  maxSeats:         number;
  registeredUsers:  string[];      // array of user UIDs
  price:            number;        // 0 = free
  status:           WorkshopStatus;
  createdAt:        any;
}

// ─── Mentor / hire session ────────────────────────────────────
export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface MentorSession {
  id:          string;
  mentorId:    string;
  mentorName:  string;
  learnerId:   string;
  learnerName: string;
  topic:       string;
  message:     string;
  date?:       any;
  meetLink?:   string;
  price:       number;
  status:      SessionStatus;
  createdAt:   any;
}

// ─── Project request ─────────────────────────────────────────
export interface ProjectRequest {
  id:          string;
  title:       string;
  description: string;
  budget:      number;
  authorId:    string;
  authorName:  string;
  tags:        string[];
  status:      "open" | "in-progress" | "closed";
  createdAt:   any;
}
