// import { Link } from "wouter";
// import { NAV_ITEMS } from "@/features/landing/data/landing-content";

// export function LandingNavbar() {
//   return (
//     <header className="landing-navbar">
//       <div className="landing-container landing-navbar-inner">
//           <Link href="/" className="landing-brand" aria-label="Signo home">
//     <img
//       src="https://pub-96fb95c48eea4024a880008b702dc542.r2.dev/Logo.png"
//       alt="Signo"
//       className="landing-brand-logo"
//       height={32}
//     />
//   </Link>

//         <nav className="landing-nav-links" aria-label="Primary">
//           {NAV_ITEMS.map((item) => (
//             <a key={item.href} href={item.href} className="landing-nav-link">
//               {item.label}
//             </a>
//           ))}
         
//           <Link href="/dashboard" className="landing-nav-link">
//             Dashboard
//           </Link>
//         </nav>

//         <div className="landing-nav-actions">
//           <a href="features" className="landing-btn landing-btn-ghost">
//             Explore
//           </a>
//           <Link href="/dashboard" className="landing-btn landing-btn-primary">
//             Open Dashboard
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }


import { Link } from "wouter";
import { NAV_ITEMS } from "@/features/landing/data/landing-content";

export function LandingNavbar() {
  return (
    <header className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-logo" aria-label="VoiceAI home">
          <img
            src="https://pub-96fb95c48eea4024a880008b702dc542.r2.dev/Logo.png"
            alt="VoiceAI"
            className="landing-logo-image"
            loading="lazy"
          />
        </Link>

        <nav className="landing-nav-links" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) =>
            item.href.startsWith("/") ? (
              <Link key={item.href} href={item.href} className="landing-nav-link">
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="landing-nav-link"
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="landing-nav-cta">
          <a href="#features" className="landing-btn landing-btn-ghost">
            Explore
          </a>
          <Link href="/dashboard" className="landing-btn landing-btn-primary">
            Open Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
