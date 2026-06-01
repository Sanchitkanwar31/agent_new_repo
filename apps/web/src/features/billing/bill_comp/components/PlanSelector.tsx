import { formatAmount } from "../formatters";
import { IconCheck } from "../icons";
import type { BillingPlan } from "../types";

interface PlanSelectorProps {
  loading: boolean;
  planEntries: [string, BillingPlan][];
  selectedPlanCode: string;
  onSelectPlan: (code: string) => void;
}

export default function PlanSelector({
  loading,
  planEntries,
  selectedPlanCode,
  onSelectPlan,
}: PlanSelectorProps) {
  return (
    <div>
      <div className="bp-plans-label">Select a plan</div>
      <div className="bp-plans" role="radiogroup" aria-label="Billing plans">
        {planEntries.map(([code, plan], index) => (
          <div className="bp-plan-wrap" key={code}>
            {index === 0 && (
              <span className="bp-plan-top-badge">Most Popular</span>
            )}
            <button
              type="button"
              className={`bp-plan-card${code === selectedPlanCode ? " selected" : ""}`}
              disabled={loading}
              role="radio"
              aria-checked={code === selectedPlanCode}
              onClick={() => onSelectPlan(code)}
              style={index === 0 ? { marginTop: "6px" } : undefined}
            >
              <div className="bp-radio">
                <div className="bp-radio-dot" />
              </div>
              <div className="bp-plan-info">
                <div className="bp-plan-name">
                  {plan.name}
                  {index === 0 && (
                    <span className="bp-plan-rec">Recommended</span>
                  )}
                </div>
                <div className="bp-plan-meta">{plan.minutes} min included</div>
                <div className="bp-plan-perks">
                  {/* <span className="bp-plan-perk">
                    <span className="bp-perk-check">
                      <IconCheck />
                    </span>
                    {plan.minutes} min included
                  </span> */}

                  <span className="bp-plan-perk">
                    <span className="bp-perk-check">
                      <IconCheck />
                    </span>
                    ₹{plan.cost_per_min}/min cost
                  </span>

                  <span className="bp-plan-perk">
                    <span className="bp-perk-check">
                      <IconCheck />
                    </span>
                    {plan.minutes} minutes transfer
                  </span>
                </div>
              </div>
              <div className="bp-plan-price">
                <div className="bp-plan-amount">
                  {formatAmount(plan.amount)}
                </div>
                {/* <div className="bp-plan-period">per-month</div> */}
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
