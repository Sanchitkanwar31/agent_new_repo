// import { Link } from "wouter";
// import { TEMPLATE_CHIPS } from "@/features/landing/data/landing-content";

// export function HeroSection() {
//   return (
//     <section className="landing-hero landing-reveal">
//       <div className="landing-hero-glow" />

//       <div className="landing-hero-tag">Voice AI Platform</div>
//       <h1 className="landing-heading md:text-3xl font-bold tracking-tight mb-6">
//         Build <em>Voice AI Agents</em>
//         <br />
//         That Actually Work
//       </h1>
//       <p className="landing-hero-copy">
//         Design, test, and deploy production-ready voice assistants with a
//         clean workflow that scales from first prototype to live operations.
//       </p>

//       <div className="landing-hero-actions">
//         <Link href="/dashboard" className="landing-btn landing-btn-primary">
//           Go To Dashboard
//         </Link>
//         <a href="#features" className="landing-btn landing-btn-outline">
//           View Features
//         </a>
//       </div>

//       <div className="landing-wave" aria-hidden>
//         {Array.from({ length: 9 }).map((_, index) => (
//           <span key={`wave-${index}`} className="landing-wave-bar" />
//         ))}
//       </div>

//       <div id="templates" className="landing-templates-row">
//         {TEMPLATE_CHIPS.map((chip) => (
//           <span key={chip} className="landing-template-chip">
//             {chip}
//           </span>
//         ))}
//       </div>
//     </section>
//   );
// }




import { Link } from "wouter";
import { HERO_TAGS } from "@/features/landing/data/landing-content";

export function HeroSection() {
  return (
    <section id="agent" className="landing-hero-wrap">
      <div className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-label">Voice AI Platform</div>
          <h1 className="landing-hero-title">
            Build <em>Voice AI</em> Agents That Actually Work
          </h1>
          <p className="landing-hero-sub">
            Design, test, and deploy production-ready voice assistants with a
            clean workflow that scales from first prototype to live operations.
          </p>

          <div className="landing-hero-actions">
            <Link href="/dashboard" className="landing-btn landing-btn-primary landing-btn-lg">
              Go To Dashboard
            </Link>
            <a href="#features" className="landing-btn landing-btn-outline landing-btn-lg">
              View Features
            </a>
          </div>

          <div className="landing-hero-tags">
            {HERO_TAGS.map((chip) => (
              <span key={chip} className="landing-tag">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden>
          {/* <div className="landing-hero-badge">Live</div> */}
          <div className="landing-hero-card">
            <div className="landing-hero-card-label">Active Voice Session</div>
            <div className="landing-hero-waveform">
              {Array.from({ length: 12 }).map((_, index) => (
                <span key={`wave-${index}`} />
              ))}
            </div>
            <div className="landing-hero-stat-row">
              <div className="landing-hero-stat">
                <div className="landing-hero-stat-num">99.95%</div>
                <div className="landing-hero-stat-label">Uptime</div>
              </div>
              <div className="landing-hero-stat">
                <div className="landing-hero-stat-num">20K+</div>
                <div className="landing-hero-stat-label">Monthly Calls</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
