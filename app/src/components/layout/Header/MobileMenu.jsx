import { NavLink } from "react-router-dom";
import AuthButtons from "./AuthButtons";
import { TOPICS } from "@/config/topics";
import { cn } from "@/lib/utils/cn";

// The hamburger menu's panel: the nav links with every topic expanded
// inline (in place of the desktop dropdown), then Sign In / Sign Up.
function MobileMenu({ links, onClose }) {
  const items = [...links.filter((l) => l.nav !== "topics"), ...TOPICS];

  return (
    <div className="absolute left-0 top-full z-20 w-full border-t border-canvas-border bg-canvas shadow-md sm:hidden">
      <ul className="flex flex-col divide-y divide-gray-100 font-medium text-gray-700">
        {items.map((link) => (
          <li key={link.path}>
            <NavLink
              to={link.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "block px-6 py-3 transition-colors hover:bg-gray-50",
                  isActive ? "font-semibold text-accent" : "hover:text-gray-900",
                )
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <AuthButtons variant="mobile" onClick={onClose} />
    </div>
  );
}

export default MobileMenu;
