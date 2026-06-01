

import { Link } from "wouter";

export function CtaSection() {
  return (
    <section className="landing-cta-section">
      <div className="landing-cta-wrap">
        <div className="landing-section-label landing-center">Ready To Launch</div>
        <h2 className="landing-section-title landing-center">
          Move from design to operations
          <br />
          in one dashboard
        </h2>
        <p className="landing-section-copy landing-center">
          Start with your active sheet data, monitor campaign performance, and
          keep your team aligned with real-time call outcomes.
        </p>
        <div className="landing-cta-actions">
          <Link href="https://voiceai.signo.in" className="landing-btn landing-btn-primary landing-btn-lg">
            Open Agent
          </Link>
        </div>
      </div>
    </section>
  );
}
