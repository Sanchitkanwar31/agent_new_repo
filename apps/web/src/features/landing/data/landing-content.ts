// import {
//   AudioWaveform,
//   BarChart3,
//   Bot,
//   Cable,
//   MessagesSquare,
//   Sparkles,
//   type LucideIcon,
// } from "lucide-react";

// export type LandingFeature = {
//   title: string;
//   description: string;
//   icon: LucideIcon;
// };

// export const NAV_ITEMS = [
//   { label: "Features", href: "#features" },
//   { label: "Agent", href: "https://agent.signo.in" },
//   { label: "Stats", href: "#stats" },
// ];

// export const TEMPLATE_CHIPS = [
//   "Customer Support",
//   "Appointment Booking",
//   "Sales Assistant",
//   "Order Tracking",
//   "Receptionist",
// ];

// export const FEATURES: LandingFeature[] = [
  
//   {
//     title: "Natural Voice Engine",
//     description:
//       "Pick from expressive voices and tune tone, pacing, and interruption behavior.",
//     icon: AudioWaveform,
//   },
//   {
//     title: "Live Conversation Testing",
//     description:
//       "Simulate calls in a chat-like sandbox before you publish your assistant.",
//     icon: MessagesSquare,
//   },
//   {
//     title: "Performance Analytics",
//     description:
//       "Track pickup rate, sentiment, and intent outcomes from one unified dashboard.",
//     icon: BarChart3,
//   },
//   {
//     title: "Integrations Ready",
//     description:
//       "Connect telephony, CRMs, and calendars without rebuilding your core flows.",
//     icon: Cable,
//   },

// ];

// export const PLATFORM_STATS = [
//   { value: "99.95%", label: "Platform Availability" },
//   { value: "20K+", label: "Monthly Call Minutes" },
//   // { value: "180+", label: "Teams Running Agents" },
//   { value: "24/7", label: "Live Support Coverage" },
// ];




import {
  AudioLines,
  BarChart3,
  Cable,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type LandingFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type ServiceTabItem = {
  marker: string;
  variant?: "check" | "number";
  text: string;
};

export type ServiceTabId = "service-spotlight" | "how-it-works" | "best-fit";

export type ServiceTab = {
  id: ServiceTabId;
  label: string;
  title: string;
  description: string;
  items: ServiceTabItem[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "Agent", href: "https://voiceai.signo.in" },
  { label: "Pricing", href: "/billing" },
  { label: "Dashboard", href: "/dashboard" },
];

export const HERO_TAGS = [
  "Customer Support",
  "Appointment Booking",
  "Sales Assistant",
  "Order Tracking",
  "Receptionist",
];

export const SERVICE_TABS: ServiceTab[] = [
  {
    id: "service-spotlight",
    label: "Service Spotlight",
    title: "We handle ops. You handle growth.",
    description:
      "Production ready voice AI for sales and operations built to power efficient, high-impact campaigns.",
    items: [
      {
        marker: "check",
        variant: "check",
        text: "Deploy human-like calling agents that autonomously manage calls",
      },
      {
        marker: "check",
        variant: "check",
        text: "Run high volume AI-based call campaigns from one dashboard",
      },
      {
        marker: "check",
        variant: "check",
        text: "Real-time transcripts, sentiment insights, and outcome tracking on every call",
      },
    ],
  },
  {
    id: "how-it-works",
    label: "How It Works",
    title: "Simple three-step process",
    description:
      "Partner with us to uncover opportunities, craft tailored voice agents, and drive high impact campaigns.",
    items: [
      { marker: "1", variant: "number", text: "Identify calling bottlenecks and leverage our agent builder to get started" },
      {
        marker: "2",
        variant: "number",
        text: "Configure voice, scripts, tone, and objection handling",
      },
      {
        marker: "3",
        variant: "number",
        text: "Launch campaigns and track live performance from a unified dashboard",
      },
    ],
  },
  {
    id: "best-fit",
    label: "Best Fit",
    title: "Built for scaling logistics teams",
    description:
      "Ideal for operations managers who need reliable coverage without building an in-house ops team from scratch.",
    items: [
      { marker: "check", variant: "check", text: "High-volume recruitment teams" },
      {
        marker: "check",
        variant: "check",
        text: "Customer success & retention teams",
      },
      {
        marker: "check",
        variant: "check",
        text: "Operations handling repetitive calls",
      },
      {
        marker: "check",
        variant: "check",
        text: "Teams requiring multi-language call support",
      },
    ],
  },
];

export const FEATURES: LandingFeature[] = [
  {
    title: "Natural Voice Engine",
    description:
      "Pick from expressive voices and tune tone, pacing, and interruption behavior.",
    icon: AudioLines,
  },
  {
    title: "Live Conversation Testing",
    description:
      "Simulate calls in a chat-like sandbox before you publish your assistant.",
    icon: MessageSquareText,
  },
  {
    title: "Performance Analytics",
    description:
      "Track pickup rate, sentiment, and intent outcomes from one unified dashboard.",
    icon: BarChart3,
  },
  {
    title: "Integrations Ready",
    description:
      "Connect telephony, CRMs, and calendars without rebuilding your core flows.",
    icon: Cable,
  },
];

export const PLATFORM_STATS = [
  { value: "99.95", unit: "%", label: "Platform Availability" },
  { value: "10K", unit: "+", label: "Monthly Call Minutes" },
  { value: "24", unit: "/7", label: "Live Support Coverage" },
];
