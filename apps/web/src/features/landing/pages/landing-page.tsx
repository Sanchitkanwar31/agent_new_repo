// import { CtaSection } from "@/features/landing/components/cta-section";
// import { FeaturesSection } from "@/features/landing/components/features-section";
// import { HeroSection } from "@/features/landing/components/hero-section";
// import { LandingFooter } from "@/features/landing/components/landing-footer";
// import { LandingNavbar } from "@/features/landing/components/landing-navbar";
// import { StatsSection } from "@/features/landing/components/stats-section";
// import "@/features/landing/styles/landing-page.css";

// export default function LandingPage() {
//   return (
//     <div className="landing-shell">
//       <LandingNavbar />
//       <main>
//         <HeroSection />
//         <FeaturesSection />
//         <StatsSection />
//         <CtaSection />
//       </main>
//       <LandingFooter />
//     </div>
//   );
// }



import { CtaSection } from "@/features/landing/components/cta-section";
import { FeaturesSection } from "@/features/landing/components/features-section";
import { HeroSection } from "@/features/landing/components/hero-section";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingNavbar } from "@/features/landing/components/landing-navbar";
import { ServiceSpotlightSection } from "@/features/landing/components/service-spotlight-section";
import { StatsSection } from "@/features/landing/components/stats-section";
import "@/features/landing/styles/landing-page.css";

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <LandingNavbar />
      <main>
        <HeroSection />
        <div className="landing-divider" />
        <ServiceSpotlightSection />
        <div className="landing-divider" />
        <FeaturesSection />
        <StatsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
