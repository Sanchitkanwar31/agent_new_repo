// import { PLATFORM_STATS } from "@/features/landing/data/landing-content";

// export function StatsSection() {
//   return (
//     <section id="stats" className="landing-section landing-section-compact landing-reveal">
//       <div className="landing-stats-grid">
//         {PLATFORM_STATS.map((item) => (
//           <article key={item.label} className="landing-stat-card">
//             <p className="landing-stat-value">{item.value}</p>
//             <p className="landing-stat-label">{item.label}</p>
//           </article>
//         ))}
//       </div>
//     </section>
//   );
// }



import { PLATFORM_STATS } from "@/features/landing/data/landing-content";

export function StatsSection() {
  return (
    <section id="stats" className="landing-stats-wrap">
      <div className="landing-stats-band">
        {PLATFORM_STATS.map((item) => (
          <article key={item.label} className="landing-stat-item">
            <p className="landing-stat-num">
              {item.value}
              <span className="landing-stat-unit">{item.unit}</span>
            </p>
            <p className="landing-stat-label">{item.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
