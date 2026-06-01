import {
  IconBilling,
  IconCompliance,
  IconDrivers,
  IconWebhook,
} from "./icons";
import type { FeatureItem } from "./types";

export const BAR_HEIGHTS = [28, 38, 22, 44, 36, 48, 32, 40, 26, 44, 34, 48, 30, 38, 28];
export const ACTIVE_BARS = [4, 5, 7, 8, 11, 12, 13];

export const FEATURES: FeatureItem[] = [
  { Icon: IconDrivers, text: "24/7 AI-powered calling automation" },
  { Icon: IconBilling, text: "Reduce manual operations and response delays" },
  { Icon: IconWebhook, text: "Built for scalable, high-volume communication" },
  { Icon: IconCompliance, text: "Enterprise-grade calling infrastructure with simple pricing" },
];

export const PLAN_PERKS = [
  "Minutes transfer available",
  "Low cost per minute",
];
