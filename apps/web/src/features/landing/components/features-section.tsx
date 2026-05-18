// import { FEATURES } from "@/features/landing/data/landing-content";

// export function FeaturesSection() {
//   return (
//     <section id="features" className="landing-section landing-reveal">
//       <p className="landing-section-label">Platform Features</p>
//       <h2 className="landing-section-title">
//         Everything you need
//         <br />
//         to build voice AI
//       </h2>
//       <p className="landing-section-copy">
//         A complete platform from prompt to production, designed for teams that
//         value speed, reliability, and clear analytics.
//       </p>

//       <div className="landing-features-grid">
//         {FEATURES.map((feature) => {
//           const Icon = feature.icon;
//           return (
//             <article key={feature.title} className="landing-feature-card">
//               <div className="landing-feature-icon-wrap">
//                 <Icon className="landing-feature-icon" />
//               </div>
//               <h3 className="landing-feature-title">{feature.title}</h3>
//               <p className="landing-feature-copy">{feature.description}</p>
//             </article>
//           );
//         })}
//       </div>
//     </section>
//   );
// }



import { FEATURES } from "@/features/landing/data/landing-content";

export function FeaturesSection() {
  return (
    <section id="features" className="landing-section">
      <div className="landing-section-label">Platform Features</div>
      <h2 className="landing-section-title">
        Everything you need
        <br />
        to build voice AI
      </h2>
      <p className="landing-section-copy">
        A complete platform from prompt to production, designed for teams that
        value speed, reliability, and clear analytics.
      </p>

      <div className="landing-features-grid">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="landing-feature-card">
              <div className="landing-feature-icon" aria-hidden>
                <Icon size={18} />
              </div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-copy">{feature.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
