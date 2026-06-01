import { IconClose, IconMenu } from "../icons";

const NAV_LINKS = ["Features", "Agent", "Stats", "Dashboard"] as const;

interface BillingNavbarProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}

export default function BillingNavbar({
  menuOpen,
  onToggleMenu,
  onCloseMenu,
}: BillingNavbarProps) {
  return (
    <>
      <nav className="bp-navbar">
        <a href="#" className="bp-navbar-logo" aria-label="SignoTech billing">
          <div className="bp-logo-circle">
            <div className="bp-logo-circle-inner">
              <span>SIGN</span>
              <span>O</span>
            </div>
          </div>
        </a>

        <ul className="bp-navbar-links">
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <a href="#" className={link === "Dashboard" ? "active" : undefined}>
                {link}
              </a>
            </li>
          ))}
        </ul>

        <div className="bp-navbar-right">
          <a href="#" className="bp-nav-explore">Explore</a>
          <a href="#" className="bp-nav-dashboard-btn">Open Dashboard</a>
        </div>

        <button
          className="bp-nav-hamburger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          type="button"
          onClick={onToggleMenu}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>
      </nav>

      <div className={`bp-nav-drawer${menuOpen ? " open" : ""}`}>
        {NAV_LINKS.map((link) => (
          <a
            href="#"
            key={link}
            className={link === "Dashboard" ? "active" : undefined}
            onClick={onCloseMenu}
          >
            {link}
          </a>
        ))}
        <a href="#" onClick={onCloseMenu}>Explore</a>
        <button className="bp-nav-drawer-cta" type="button" onClick={onCloseMenu}>
          Open Dashboard
        </button>
      </div>
    </>
  );
}
