"use client";

import { useState, useEffect } from "react";
import { raceIdUrl } from "@/lib/constants";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#expect", label: "What to Expect" },
  { href: "#info", label: "Info" },
  { href: "#faq", label: "FAQ" },
  { href: "#gallery", label: "Gallery" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-md text-gray-900"
          : "bg-transparent text-white"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <a href="#" className="font-bold text-lg tracking-tight">
          Altorp Ultra
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:opacity-80 ${
                scrolled ? "text-gray-700 hover:text-gray-900" : "text-white/90 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href={raceIdUrl}
            className={`text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
              scrolled
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-white text-gray-900 hover:bg-white/90"
            }`}
          >
            Register
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${
              scrolled ? "bg-gray-900" : "bg-white"
            } ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${
              scrolled ? "bg-gray-900" : "bg-white"
            } ${mobileOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 transition-all duration-300 ${
              scrolled ? "bg-gray-900" : "bg-white"
            } ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden border-t ${scrolled ? "bg-white/95 backdrop-blur-sm border-gray-200" : "bg-black/80 backdrop-blur-sm border-white/10"}`}>
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-base font-medium ${
                  scrolled ? "text-gray-700" : "text-white/90"
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href={raceIdUrl}
              onClick={() => setMobileOpen(false)}
              className={`text-base font-semibold px-4 py-2 rounded-md text-center ${
                scrolled
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-900"
              }`}
            >
              Register
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
