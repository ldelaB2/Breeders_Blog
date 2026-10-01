import { Link, NavLink } from "react-router-dom";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { TOPICS } from "@/config/topics";
import { cn } from "@/lib/utils/cn";

// The sm+ nav row. `links` comes from navRoutes() in config/routes.jsx; the
// "topics" entry renders as a dropdown of every topic.
function DesktopNav({ links }) {
  return (
    <nav className="hidden py-4 sm:block">
      <ul className="flex items-center gap-6 font-medium text-gray-700">
        {links.map((link) =>
          link.nav === "topics" ? (
            <TopicsDropdown key={link.path} label={link.label} />
          ) : (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  isActive ? "font-semibold text-accent" : "transition-colors hover:text-gray-900"
                }
              >
                {link.label}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

function TopicsDropdown({ label }) {
  return (
    <Dropdown
      as="li"
      panelClassName="w-52"
      renderTrigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex items-center gap-1 transition-colors hover:text-gray-900"
        >
          {label}
          <Icon name="chevron" className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      )}
    >
      {(close) => (
        <ul>
          {TOPICS.map((topic) => (
            <li key={topic.path}>
              <Link
                to={topic.path}
                onClick={close}
                className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {topic.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Dropdown>
  );
}

export default DesktopNav;
