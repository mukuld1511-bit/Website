declare global {
  interface Window { Razorpay: any; }
}

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_SQmHdHYmCoWkBT";

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(false); return; }
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiateRazorpayPayment(options: {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  email: string;
  contact?: string;
  prefill?: { name?: string };
  onSuccess?: (data: any) => void;
  onFailure?: () => void;
}): Promise<any> {
  const loaded = await loadRazorpayScript();
  if (!loaded) throw new Error("Failed to load Razorpay");

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY,
      order_id: options.orderId,
      amount: options.amount,
      currency: options.currency || "INR",
      name: "Synthé",
      description: options.description,
      prefill: {
        name: options.prefill?.name || "",
        email: options.email || "",
        contact: options.contact || "",
      },
      theme: { color: "#7c3aed" },
      handler: (response: any) => {
        options.onSuccess?.(response);
        resolve(response);
      },
    });
    rzp.on("payment.failed", () => {
      options.onFailure?.();
      reject(new Error("Payment failed"));
    });
    rzp.open();
  });
}

export async function initiatePayment(options: any) {
  return initiateRazorpayPayment(options);
}