// types/gallery.ts

export type FileType = "glb" | "gltf" | "obj" | "fbx" | "dwg" | "dxf";
export type AccessType = "free" | "purchase" | "request";
export type ModelStatus = "published" | "draft" | "review";
export type PriceRange = "All" | "Free" | "Paid";
export type SortOption = "Latest" | "Most Viewed" | "Most Liked" | "Price: Low" | "Price: High";
export type Category = "All" | "Architecture" | "Mechanical" | "Character" | "Environment" | "Product" | "AutoCAD" | "Other";

export interface GalleryModel {
  id: string;
  title: string;
  description: string;
  category: Category | string;
  tags: string[];
  polygons: string | null;
  fileType: FileType;
  modelUrl: string;
  thumbnailUrl: string;
  isPaid: boolean;
  price: number;
  accessType: AccessType;
  license: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  views: number;
  likes: number;
  downloads: number;
  status: ModelStatus;
  uploadedAt: any; // Firestore Timestamp
}

export interface Purchase {
  modelId: string;
  status: "active" | "refunded";
  paymentId: string;
  orderId: string;
  purchasedAt: any;
}

export interface AccessRequest {
  modelId: string;
  modelTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  useCase: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: any;
}

export interface GalleryFiltersState {
  search: string;
  category: string;
  fileType: string;
  priceRange: PriceRange;
  sort: SortOption;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string;
  createdAt: any;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface InitiatePaymentOptions {
  orderId: string;
  amount: number;
  currency?: string;
  modelName: string;
  userName?: string;
  userEmail?: string;
  onSuccess?: (response: RazorpayPaymentResponse) => void;
  onFailure?: (message: string) => void;
}
