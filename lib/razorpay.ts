export interface RazorpayPaymentData {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface InitiatePaymentOptions {
  orderId: string;
  amount: number;          // in paise (multiply ₹ by 100)
  currency: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentData: RazorpayPaymentData) => void;
  onFailure: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function initiatePayment(options: InitiatePaymentOptions): void {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  if (!key) {
    console.warn("[Razorpay] NEXT_PUBLIC_RAZORPAY_KEY_ID not set. Payment skipped.");
    options.onFailure();
    return;
  }

  if (typeof window === "undefined" || !window.Razorpay) {
    // Dynamically load the Razorpay script if not present
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => openRazorpay(key, options);
    script.onerror = () => {
      console.error("[Razorpay] Failed to load checkout script.");
      options.onFailure();
    };
    document.body.appendChild(script);
    return;
  }

  openRazorpay(key, options);
}

function openRazorpay(key: string, options: InitiatePaymentOptions): void {
  const rzp = new window.Razorpay({
    key,
    amount:      options.amount,
    currency:    options.currency || "INR",
    name:        "SYNTHÉ",
    description: options.description || "Purchase",
    order_id:    options.orderId,
    image:       "/logo.png",
    prefill: {
      name:    options.prefill?.name    || "",
      email:   options.prefill?.email   || "",
      contact: options.prefill?.contact || "",
    },
    theme: {
      color: "#7c3aed",
    },
    handler: (response: RazorpayPaymentData) => {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        options.onFailure();
      },
    },
  });
  rzp.open();
}

// Named export alias for backward compatibility
export const initiateRazorpayPayment = initiatePayment;