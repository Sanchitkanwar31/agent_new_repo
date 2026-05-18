// import { Link } from "wouter";

// export function CtaSection() {
//   return (
//     <section className="landing-section landing-reveal">
//       <div className="landing-cta-panel">
//         <p className="landing-section-label">Ready To Launch</p>
//         <h2 className="landing-section-title landing-section-title-sm">
//           Move from design to operations in one dashboard
//         </h2>
//         <p className="landing-section-copy landing-section-copy-sm">
//           Start with your active sheet data, monitor campaign performance, and
//           keep your team aligned with real-time call outcomes.
//         </p>
//         <div className="landing-hero-actions">
//           <Link href="/dashboard" className="landing-btn landing-btn-primary">
//             Open Dashboard
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// }





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
          <Link href="https://agent.signo.in" className="landing-btn landing-btn-primary landing-btn-lg">
            Open Agent
          </Link>
        </div>
      </div>
    </section>
  );
}
