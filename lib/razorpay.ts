declare global {
  interface Window {
    Razorpay: any;
  }
}

export async function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiateRazorpayPayment(options: any) {
  const scriptLoaded = await loadRazorpayScript();
  
  if (!scriptLoaded) {
    throw new Error("Failed to load Razorpay script");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: (response: any) => resolve(response),
    });
    rzp.open();
    rzp.on("close", () => reject(new Error("Payment cancelled")));
  });
}

export async function initiatePayment(options: any) {
  return initiateRazorpayPayment(options);
}