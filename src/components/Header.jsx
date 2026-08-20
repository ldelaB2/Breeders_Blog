import React, { useState } from "react";
import logo from "./../assets/logo.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pinned", label: "Pinned" },
  { href: "/drones", label: "Drones" },
  { href: "/gs", label: "Genomic Selection" },
  { href: "/qg", label: "Quantative Genetics" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex flex-col items-center px-6 py-4 bg-white relative">
      {/* Top section: logo + title/name centered, actions on right (all screen sizes) */}
      <div className="grid w-full grid-cols-3 items-center gap-2 pb-4">
        {/* Left: hamburger on mobile, spacer on larger screens */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {/* Simple hamburger / close icon swap */}
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Logo, title, and name - centered */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <img
            src={logo}
            alt="Site logo"
            className="h-10 w-auto sm:h-16 md:h-20"
          />
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm font-semibold text-gray-900 sm:text-lg md:text-xl">
              Breeders Blog
            </span>
            <span className="text-xs text-gray-500 sm:text-sm">
              Will de la Bretonne
            </span>
          </div>
        </div>

        {/* Action buttons - right aligned */}
        <div className="flex items-center justify-end gap-4 sm:gap-6">
          {/* Search button with hover tooltip */}
          <div className="relative group">
            <button
              type="button"
              className="rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-200 sm:p-2.5"
              aria-label="Search"
            >
              <svg
                className="h-6 w-6 sm:h-7 sm:w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Tooltip */}
            <span
              className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2
                 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white
                 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
            >
              Search
            </span>
          </div>

          {/* Sign In button */}
          <button
            type="button"
            className="rounded-md px-3 py-2 text-base text-black transition-colors hover:bg-gray-200 sm:px-5 sm:py-2.5 sm:text-lg"
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Divider line */}
      <div className="w-full border-t border-gray-200"></div>

      {/* Bottom section: nav links - horizontal on sm+, hidden on mobile */}
      <nav className="hidden sm:block py-4">
        <ul className="flex justify-center gap-6 text-gray-700 font-medium">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Divider line (only needed when the desktop nav row is shown) */}
      <div className="hidden sm:block w-full border-t border-gray-200"></div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden absolute left-0 top-full z-20 w-full bg-white shadow-md border-t border-gray-200">
          <ul className="flex flex-col divide-y divide-gray-100 text-gray-700 font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;
