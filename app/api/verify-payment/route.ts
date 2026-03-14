import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      modelId,
      userId,
      authorId,
      amount, // in paise
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    // Verify Razorpay signature
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    // All good — return success. Client-side recordPurchase handles Firestore writes.
    // Developer earnings: 70% of amount (in rupees)
    const amountRupees = Math.round((amount || 0) / 100);
    const developerEarning = Math.round(amountRupees * 0.7);

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      modelId,
      userId,
      authorId,
      amountRupees,
      developerEarning,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message ?? "Verification failed" }, { status: 500 });
  }
}
