import { Link } from "wouter";

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer-inner">
        <p className="landing-footer-copy">
          Signo Voice AI Platform
        </p>
        <div className="landing-footer-links">
          <a href="features">Features</a>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
