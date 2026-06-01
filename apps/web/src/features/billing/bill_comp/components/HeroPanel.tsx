import { ACTIVE_BARS, BAR_HEIGHTS, FEATURES } from "../constants";

export default function HeroPanel() {
  return (
    <section className="bp-hero">
      <div className="bp-hero-inner">
        <div className="bp-hero-top">
          <div className="bp-eyebrow-pill">
            <span className="bp-eyebrow-dot" />
            <span className="bp-eyebrow-text">Enterprise Billing</span>
          </div>

          <h1 className="bp-hero-title">
            Built for modern<br />
            <span className="accent">AI Calling</span> and<br />
            Efficient teams
          </h1>

          <p className="bp-hero-subtitle">
            Automate logistics calls, streamline operations, and scale conversations without operational overhead.
          </p>

          <div className="bp-stat-widget">
            <div className="bp-stat-widget-label">Active Voice Sessions</div>
            <div className="bp-bars">
              {BAR_HEIGHTS.map((height, index) => (
                <div
                  key={index}
                  className={`bp-bar${ACTIVE_BARS.includes(index) ? " active" : ""}`}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
            <div className="bp-stat-row">
              <div className="bp-stat-cell">
                <div className="bp-stat-value">20K+</div>
                <div className="bp-stat-key">Monthly Calls</div>
              </div>
              <div className="bp-stat-cell">
                <div className="bp-stat-value">99.9%</div>
                <div className="bp-stat-key">Uptime</div>
              </div>
            </div>
          </div>

          <div className="bp-features">
            {FEATURES.map(({ Icon, text }) => (
              <div className="bp-feature" key={text}>
                <div className="bp-feature-icon"><Icon /></div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
