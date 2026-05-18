import { useState } from "react";
import { CircleCheck } from "lucide-react";
import {
  SERVICE_TABS,
  type ServiceTab,
  type ServiceTabId,
} from "@/features/landing/data/landing-content";

const DEFAULT_TAB_ID: ServiceTabId = SERVICE_TABS[0]?.id ?? "service-spotlight";

export function ServiceSpotlightSection() {
  const [activeTab, setActiveTab] = useState<ServiceTabId>(DEFAULT_TAB_ID);

  const panel: ServiceTab | undefined =
    SERVICE_TABS.find((tab) => tab.id === activeTab) ?? SERVICE_TABS[0];

  if (!panel) {
    return null;
  }

  return (
    <section className="landing-section">
      {/* <div className="landing-section-label">Service Spotlight</div>
      <h2 className="landing-section-title">
        Outsourced Ops,
        <br />
        Controlled Outcomes
      </h2> */}

      <div className="landing-tabs-wrap" role="tablist" aria-label="Service spotlight tabs">
        {SERVICE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab}
            className={`landing-tab ${tab.id === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <article className="landing-tab-panel" role="tabpanel">
        <h2>{panel.title}</h2>
        <p>{panel.description}</p>
        <ul className="landing-check-list">
          {panel.items.map((item) => (
            <li key={item.text}>
              {item.variant === "check" ? (
                <CircleCheck className="landing-check-svg" size={16} aria-hidden />
              ) : (
                <span className="landing-step-icon" aria-hidden>
                  {item.marker}
                </span>
              )}
              {item.text}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
