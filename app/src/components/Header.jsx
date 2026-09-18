import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { DYNAMIC_TOPICS, PERMANENT_TOPICS } from "../routes";
import { useCurrentUser } from "../lib/useCurrentUser";
import { postPath } from "../lib/seo";
import SearchModal from "./SearchModal";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isAdmin } = useCurrentUser();
  const navigate = useNavigate();

  function handleSelectSearchResult(post) {
    setSearchOpen(false);
    navigate(postPath(post));
  }
  // Kept out of the shared PERMANENT_TOPICS export (routes.jsx) since
  // App.jsx also uses that array to auto-generate routes for everyone -
  // Admin visibility is header-only, the route itself is always registered
  // and gated by the page/API instead.
  const navLinks = isAdmin ? [...PERMANENT_TOPICS, { path: "/admin", label: "Admin" }] : PERMANENT_TOPICS;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <header className="flex flex-col items-center px-6 py-4 bg-canvas relative">
      {/* Top section */}
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 pb-4">
        {/* Left: hamburger on mobile */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
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

        {/* Logo + title */}
        <div className="flex min-w-0 items-center justify-center gap-2 sm:gap-3">
          <Link to="/" className="sm:hidden shrink-0" aria-label="Breeders Blog home">
            <img
              src="/logo.png"
              alt="Breeders Blog logo"
              className="h-10 w-10 rounded-full object-cover"
            />
          </Link>
          <a
            href="/logo.png"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 sm:inline-flex"
          >
            <img
              src="/logo.png"
              alt="Breeders Blog logo"
              className="sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full object-cover"
            />
          </a>
          <div className="flex min-w-0 flex-col items-center sm:items-start">
            <span className="truncate text-sm font-semibold text-gray-900 sm:text-lg md:text-xl">
              Breeders Blog
            </span>
            <span className="hidden truncate text-sm text-gray-500 sm:block">
              Will de la Bretonne
            </span>
          </div>
        </div>

        {/* Auth + search */}
        <div className="flex items-center justify-end gap-4 sm:gap-6">
          <div className="relative group">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
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
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
              Search
            </span>
          </div>

          <Show when="signed-out">
            <div className="hidden items-center gap-4 sm:flex sm:gap-6">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-md px-5 py-2.5 text-lg text-black transition-colors hover:bg-gray-200"
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-md bg-accent px-5 py-2.5 text-lg text-white transition-colors hover:bg-accent-dark"
                >
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-canvas-border" />

      {/* Desktop nav */}
      <nav className="hidden sm:block py-4">
        <ul className="flex items-center gap-6 font-medium text-gray-700">
          {navLinks.map((link) =>
            link.label === "Topics" ? (
              <li key={link.path} className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                >
                  Topics
                  <svg
                    className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {dropdownOpen && (
                  <ul className="absolute left-0 top-full z-20 mt-2 w-52 rounded-md border border-gray-200 bg-white shadow-lg py-1">
                    {DYNAMIC_TOPICS.map((topic) => (
                      <li key={topic.path}>
                        <Link
                          to={topic.path}
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          {topic.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    isActive
                      ? "font-semibold text-accent"
                      : "hover:text-gray-900 transition-colors"
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="hidden sm:block w-full border-t border-canvas-border" />

      {/* Mobile menu — topics expanded inline */}
      {menuOpen && (
        <div className="sm:hidden absolute left-0 top-full z-20 w-full bg-canvas shadow-md border-t border-canvas-border">
          <ul className="flex flex-col divide-y divide-gray-100 text-gray-700 font-medium">
            {[
              ...navLinks.filter((l) => l.label !== "Topics"),
              ...DYNAMIC_TOPICS,
            ].map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-6 py-3 transition-colors hover:bg-gray-50 ${
                      isActive ? "font-semibold text-accent" : "hover:text-gray-900"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Sign In / Sign Up live here on mobile instead of the crowded
              top bar — the top bar only shows the search icon (and the
              UserButton avatar when signed in). */}
          <Show when="signed-out">
            <div className="flex gap-3 border-t border-canvas-border px-6 py-4">
              <SignInButton mode="modal">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-center text-base text-black transition-colors hover:bg-gray-100"
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-md bg-accent px-4 py-2.5 text-center text-base text-white transition-colors hover:bg-accent-dark"
                >
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      )}
    </header>

    {searchOpen && (
      <SearchModal onClose={() => setSearchOpen(false)} onSelectPost={handleSelectSearchResult} />
    )}
    </>
  );
}

export default Header;
