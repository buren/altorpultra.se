"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Menu, X } from "lucide-react";
import { getRacePhase, secondsUntil, formatDuration } from "@/lib/race/clock";
import { site } from "@/lib/config";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [editionYear, setEditionYear] = useState<number | null>(null);
  const [editionStart, setEditionStart] = useState<string>("");
  const [editionEnd, setEditionEnd] = useState<string>("");

  useEffect(() => {
    fetch("/api/race/auth")
      .then((res) => {
        if (res.ok) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/race/editions")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data.currentYear) {
          const year = data.data.currentYear;
          setEditionYear(year);
          const ed = data.data.editions.find((e: { year: number }) => e.year === year);
          if (ed) {
            setEditionStart(ed.startDateTime);
            setEditionEnd(ed.endDateTime);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/race/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.ok) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError(data.error);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-1">{site.name}</h1>
            <p className="text-gray-500 mb-6">Race Admin</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full border rounded-md px-3 py-2 text-lg pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {authError && (
                <p className="text-red-600 text-sm">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full bg-gray-900 text-white rounded-md py-2 font-semibold hover:bg-gray-800"
              >
                Log in
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navLinks = [
    { href: "/race/admin", label: "Register Laps" },
    { href: "/race/admin/runners", label: "Runners" },
    { href: "/race/admin/editions", label: "Editions" },
  ];

  const raceTimer = (() => {
    if (!editionStart || !editionEnd) return null;
    const phase = getRacePhase(editionStart, editionEnd, now);
    if (phase === "before") {
      const secs = secondsUntil(editionStart, now);
      return (
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-yellow-400">
            {formatDuration(secs)}
          </div>
          <div className="text-xs text-gray-400">until race starts</div>
        </div>
      );
    }
    if (phase === "during") {
      const secs = secondsUntil(editionEnd, now);
      return (
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-green-400">
            {formatDuration(secs)}
          </div>
          <div className="text-xs text-gray-400">remaining</div>
        </div>
      );
    }
    return (
      <span className="text-gray-400 font-semibold">Race completed</span>
    );
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-4 py-3">
        <div className="container mx-auto">
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/race/admin">
                <h1 className="text-xl font-bold">{site.name} Admin</h1>
                <p className="text-gray-400 text-sm">{editionYear}</p>
              </Link>
              <nav className="flex gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={`/race/${editionYear}`}
                target="_blank"
                className="bg-gray-700 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-600"
              >
                View Leaderboard
              </a>
              {raceTimer}
            </div>
          </div>

          {/* Mobile header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between">
              <Link href="/race/admin">
                <h1 className="text-lg font-bold">{site.name} Admin</h1>
                <p className="text-gray-400 text-xs">{editionYear}</p>
              </Link>
              <div className="flex items-center gap-3">
                {raceTimer}
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  {menuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {menuOpen && (
              <nav className="mt-3 pt-3 border-t border-gray-700 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <a
                  href={`/race/${editionYear}`}
                  target="_blank"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  View Leaderboard
                </a>
              </nav>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
