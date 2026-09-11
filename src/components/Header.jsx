import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import logo from "./../assets/logo.png";
import { DYNAMIC_TOPICS, PERMANENT_TOPICS } from "../routes";

function Header({ topics = DYNAMIC_TOPICS }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    <header className="flex flex-col items-center px-6 py-4 bg-white relative">
      {/* Top section */}
      <div className="grid w-full grid-cols-3 items-center gap-2 pb-4">
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
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <a href={logo} target="_blank" rel="noopener noreferrer">
            <img
              src={logo}
              alt="Site logo"
              className="h-10 w-auto sm:h-16 md:h-20"
            />
          </a>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm font-semibold text-gray-900 sm:text-lg md:text-xl">
              Breeder's Blog
            </span>
            <span className="text-xs text-gray-500 sm:text-sm">
              Will de la Bretonne
            </span>
          </div>
        </div>

        {/* Auth + search */}
        <div className="flex items-center justify-end gap-4 sm:gap-6">
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
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
              Search
            </span>
          </div>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-base text-black transition-colors hover:bg-gray-200 sm:px-5 sm:py-2.5 sm:text-lg"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-base text-white bg-gray-900 transition-colors hover:bg-gray-700 sm:px-5 sm:py-2.5 sm:text-lg"
              >
                Sign Up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-gray-200" />

      {/* Desktop nav */}
      <nav className="hidden sm:block py-4">
        <ul className="flex items-center gap-6 font-medium text-gray-700">
          {PERMANENT_TOPICS.map((link) =>
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
                    {topics.map((topic) => (
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
                <Link
                  to={link.path}
                  className="hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="hidden sm:block w-full border-t border-gray-200" />

      {/* Mobile menu — topics expanded inline */}
      {menuOpen && (
        <div className="sm:hidden absolute left-0 top-full z-20 w-full bg-white shadow-md border-t border-gray-200">
          <ul className="flex flex-col divide-y divide-gray-100 text-gray-700 font-medium">
            {[
              ...PERMANENT_TOPICS.filter((l) => l.label !== "Topics"),
              ...topics,
            ].map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Header;
