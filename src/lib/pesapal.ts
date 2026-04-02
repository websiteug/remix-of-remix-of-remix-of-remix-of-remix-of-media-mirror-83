// Pesapal Payment Integration - Server-Side via Edge Functions
// All API calls are proxied through Lovable Cloud edge functions

// Plan duration mapping
export const planDurations: Record<string, number> = {
  "2 Days": 2,
  "1 Week": 7,
  "2 Weeks": 14,
  "1 Month": 30,
  "3 Months": 90,
  "6 Months": 180,
  "1 Year": 365,
  Lifetime: -1,
  "LuoFree Plan": 30,
  "Agent Plan": 5,
};

// Generate unique order ID
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `LUA-${timestamp}-${randomPart}`.toUpperCase();
}

// Store payment data in localStorage for callback processing
export function storePaymentData(data: {
  orderId: string;
  orderTrackingId: string;
  userId: string;
  planName: string;
  planDays: number;
  amount: number;
  phoneNumber: string;
}): void {
  localStorage.setItem("pesapal_pending_payment", JSON.stringify(data));
}

export function getPendingPaymentData(): {
  orderId: string;
  orderTrackingId: string;
  userId: string;
  planName: string;
  planDays: number;
  amount: number;
  phoneNumber: string;
} | null {
  const data = localStorage.getItem("pesapal_pending_payment");
  if (data) return JSON.parse(data);
  return null;
}

export function clearPendingPaymentData(): void {
  localStorage.removeItem("pesapal_pending_payment");
}

// Parse callback URL parameters
export function parseCallbackParams(searchParams: URLSearchParams): {
  orderTrackingId: string | null;
  orderMerchantReference: string | null;
  orderNotificationType: string | null;
} {
  return {
    orderTrackingId: searchParams.get("OrderTrackingId"),
    orderMerchantReference: searchParams.get("OrderMerchantReference"),
    orderNotificationType: searchParams.get("OrderNotificationType"),
  };
}

// Call edge function helper
async function callPesapalEdge(action: string, params?: Record<string, string>, body?: any): Promise<any> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const queryParams = new URLSearchParams({ action, ...params });

  const res = await fetch(`${supabaseUrl}/functions/v1/pesapal?${queryParams}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errData.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Initiate payment via edge function
export async function initiatePesapalPayment(params: {
  orderId: string;
  amount: number;
  description: string;
  callbackUrl: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
}): Promise<{ redirectUrl: string; orderTrackingId: string; merchantReference: string }> {
  const data = await callPesapalEdge("submit-order", {}, {
    orderId: params.orderId,
    amount: params.amount,
    description: params.description,
    callbackUrl: params.callbackUrl,
    email: params.email,
    phoneNumber: params.phoneNumber,
    firstName: params.firstName,
    lastName: params.lastName,
  });

  return {
    redirectUrl: data.redirect_url,
    orderTrackingId: data.order_tracking_id,
    merchantReference: data.merchant_reference,
  };
}

// Verify payment status via edge function
export async function verifyPaymentStatus(orderTrackingId: string): Promise<{
  success: boolean;
  status: string;
  statusCode: number;
  confirmationCode?: string;
  message?: string;
  paymentMethod?: string;
  amount?: number;
  merchantReference?: string;
  description?: string;
  paymentStatusCode?: string;
  errorCode?: string;
  errorMessage?: string;
}> {
  try {
    const data = await callPesapalEdge("transaction-status", { orderTrackingId });

    console.log("Pesapal verification response:", JSON.stringify(data));

    return {
      success: data.status_code === 1,
      status: data.payment_status_description || "UNKNOWN",
      statusCode: data.status_code,
      confirmationCode: data.confirmation_code,
      message: data.message || data.error?.message || data.description || "",
      paymentMethod: data.payment_method,
      amount: data.amount,
      merchantReference: data.merchant_reference,
      description: data.description || data.error?.message || "",
      paymentStatusCode: data.payment_status_code || "",
      errorCode: data.error?.code || "",
      errorMessage: data.error?.message || "",
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      success: false,
      status: "VERIFICATION_FAILED",
      statusCode: -1,
      message: "Could not verify payment status",
      description: "",
    };
  }
}
