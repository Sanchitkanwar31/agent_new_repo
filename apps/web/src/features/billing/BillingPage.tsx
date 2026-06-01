import { useEffect, useMemo, useState } from "react";
import { apiJson, EMAIL_PATTERN, loadRazorpay } from "./bill_comp/api";
import HeroPanel from "./bill_comp/components/HeroPanel";
import PaymentPanel from "./bill_comp/components/PaymentPanel";

import { LandingNavbar } from "@/features/landing/components/landing-navbar";
import "@/features/landing/styles/landing-page.css";

import "./bill_comp/BillingPage.css";
import type {
  BillingPlansMap,
  BillingStatus,
  PlansResponse,
  RazorpayOrderResponse,
} from "./bill_comp/types";
import { LandingFooter } from "../landing/components/landing-footer";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export default function BillingPage() {
  const [plans, setPlans] = useState<BillingPlansMap>({});
  const [selectedPlanCode, setSelectedPlanCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BillingStatus>({
    type: "loading",
    message: "Loading billing plans...",
  });

  const selectedPlan = useMemo(
    () => plans[selectedPlanCode],
    [plans, selectedPlanCode],
  );

  useEffect(() => {
    let cancelled = false;

    apiJson<PlansResponse>("/api/v1/billing/plans")
      .then((data) => {
        if (cancelled) return;

        const planMap = data.plans ?? {};
        const firstPlanCode = Object.keys(planMap)[0] ?? "";

        setPlans(planMap);
        setSelectedPlanCode(firstPlanCode);
        setStatus({
          type: firstPlanCode ? "idle" : "error",
          message: firstPlanCode
            ? "Ready to create a secure billing order."
            : "No billing plans configured.",
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus({ type: "error", message: getErrorMessage(error) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function startPayment() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus({ type: "error", message: "Enter a valid registered email" });
      return;
    }
    if (!selectedPlanCode || !plans[selectedPlanCode]) {
      setStatus({ type: "error", message: "Select a valid billing plan" });
      return;
    }

    setLoading(true);
    setStatus({ type: "loading", message: "Creating Razorpay order..." });

    try {
      const [order] = await Promise.all([
        apiJson<RazorpayOrderResponse>("/api/v1/billing/razorpay/orders", {
          method: "POST",
          body: JSON.stringify({ email: normalizedEmail, plan_code: selectedPlanCode }),
        }),
        loadRazorpay(),
      ]);

      setStatus({ type: "loading", message: "Opening secure Razorpay checkout..." });

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: order.name || "SignoTech",
        description: selectedPlan?.name,
        prefill: order.prefill,
        notes: order.notes,
        theme: { color: "#F5C518" },
        handler: () => {
          setLoading(false);
          setStatus({
            type: "success",
            message: "Payment received. Credits will be transferred at https://voiceai.signo.in.",
          });
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStatus({ type: "idle", message: "Payment cancelled. You can try again." });
          },
        },
      });

      checkout.open();
    } catch (error: unknown) {
      setLoading(false);
      setStatus({ type: "error", message: getErrorMessage(error) });
    }
  }

  return (
    <div className="landing-shell">
      <LandingNavbar />
      <main className="billing-section">
        <div className="billing-container">
          <HeroPanel />

          <PaymentPanel
            email={email}
            loading={loading}
            planEntries={Object.entries(plans)}
            selectedPlan={selectedPlan}
            selectedPlanCode={selectedPlanCode}
            status={status}
            onEmailChange={setEmail}
            onSelectPlan={setSelectedPlanCode}
            onStartPayment={startPayment}
          />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
