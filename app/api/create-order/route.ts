import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.rzp_test_SPbDlP1DSNZsUy!,
  key_secret: process.env.o4d2bo6n1EvFXK8YIavjrAio!,
});

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt:  `receipt_${Date.now()}`,
    });
    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}