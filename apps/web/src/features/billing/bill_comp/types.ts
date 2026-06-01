import type { FC } from "react";

export interface BillingPlan {
  name: string;
  amount: number;
  minutes: number;
  cost_per_min: number;
}

export type BillingPlansMap = Record<string, BillingPlan>;

export type StatusType = "loading" | "idle" | "error" | "success";

export interface BillingStatus {
  type: StatusType;
  message: string;
}

export interface PlansResponse {
  plans: BillingPlansMap;
}

export interface RazorpayOrderResponse {
  order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  name: string;
  prefill: { email: string };
  notes: Record<string, string>;
}

export interface FeatureItem {
  Icon: FC;
  text: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: () => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}
