// lib/checkAccess.ts
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase"; // your existing firebase config
import type { RazorpayPaymentResponse } from "@/types/gallery";

/** Returns true if user has active purchase for this model */
export async function checkModelAccess(
  userId: string,
  modelId: string
): Promise<boolean> {
  if (!userId || !modelId) return false;
  try {
    const ref = doc(db, "users", userId, "purchases", modelId);
    const snap = await getDoc(ref);
    return snap.exists() && snap.data()?.status === "active";
  } catch {
    return false;
  }
}

/** Returns all model IDs a user has purchased */
export async function getUserPurchases(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const ref = collection(db, "users", userId, "purchases");
    const snap = await getDocs(ref);
    return snap.docs.map((d) => d.id);
  } catch {
    return [];
  }
}

/** Called after successful Razorpay payment verification */
export async function recordPurchase(
  userId: string,
  modelId: string,
  paymentData: Partial<RazorpayPaymentResponse>
): Promise<void> {
  const ref = doc(db, "users", userId, "purchases", modelId);
  await setDoc(ref, {
    modelId,
    status: "active",
    paymentId: paymentData.razorpay_payment_id ?? "stub",
    orderId: paymentData.razorpay_order_id ?? "stub",
    purchasedAt: serverTimestamp(),
  });
}
