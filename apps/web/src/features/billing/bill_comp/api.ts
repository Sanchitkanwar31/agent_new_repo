const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeApiError(message: string | undefined, status: number): string {
  if (status === 404 && /organization/i.test(message ?? "")) {
    return "No organization linked with this email. Create an account at https://voiceai.signo.in";
  }
  if (/invalid email/i.test(message ?? "")) {
    return "Enter a valid registered email";
  }
  if (/invalid billing plan/i.test(message ?? "")) {
    return "Select a valid billing plan";
  }
  return message || "Something went wrong. Please try again.";
}

interface ApiErrorBody {
  detail?: string;
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const data = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    throw new Error(normalizeApiError(data.detail, response.status));
  }
  return data as T;
}

export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.head.appendChild(script);
  });
}
