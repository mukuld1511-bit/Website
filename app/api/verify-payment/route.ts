import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment fields" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    // Razorpay signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const isValid   = expected === razorpay_signature;

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    return NextResponse.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message ?? "Verification failed" }, { status: 500 });
  }
}
