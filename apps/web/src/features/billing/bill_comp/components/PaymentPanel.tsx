import { IconLock, IconMail, IconShield } from "../icons";
import type { BillingPlan, BillingStatus } from "../types";
import PlanSelector from "./PlanSelector";
import StatusMessage from "./StatusMessage";

interface PaymentPanelProps {
  email: string;
  loading: boolean;
  planEntries: [string, BillingPlan][];
  selectedPlan: BillingPlan | undefined;
  selectedPlanCode: string;
  status: BillingStatus;
  onEmailChange: (email: string) => void;
  onSelectPlan: (code: string) => void;
  onStartPayment: () => void;
}

export default function PaymentPanel({
  email,
  loading,
  planEntries,
  selectedPlan,
  selectedPlanCode,
  status,
  onEmailChange,
  onSelectPlan,
  onStartPayment,
}: PaymentPanelProps) {
  return (
    <section className="bp-form-panel">
      <div>
        <div className="bp-form-eyebrow">Billing Portal</div>
        <h2 className="bp-form-title">Choose your plan</h2>
        <p className="bp-form-sub">
          <div className="bp-form-sub bp-promo-banner">
          <span className="bp-promo-badge">🔥 Flash Offer</span>
          <span className="bp-promo-text">Get your first Plan for only <strong>₹199</strong></span>
        </div>
        </p>
        
      </div>

      <div className="bp-field">
        <label className="bp-field-label" htmlFor="bp-email">
          Registered organization email
        </label>
        <div className="bp-email-wrap">
          <span className="bp-email-icon" aria-hidden="true"><IconMail /></span>
          <input
            id="bp-email"
            className="bp-email-input"
            type="email"
            value={email}
            disabled={loading}
            placeholder="admin@company.com"
            autoComplete="email"
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </div>
      </div>

      <PlanSelector
        loading={loading}
        planEntries={planEntries}
        selectedPlanCode={selectedPlanCode}
        onSelectPlan={onSelectPlan}
      />

      <div className="bp-cta">
        <div className="bp-divider" />
        <StatusMessage status={status} />
        <button
          type="button"
          className="bp-pay-btn"
          disabled={loading || !selectedPlan}
          onClick={onStartPayment}
        >
          <span className="bp-btn-icon" aria-hidden="true"><IconLock /></span>
          {loading ? "Processing..." : "Pay securely with Razorpay"}
        </button>
        <div className="bp-secure-note">
          <IconShield />
          Webhook-based verification
          <span className="bp-secure-sep" />
          PCI-compliant
        </div>
      </div>
    </section>
  );
}
