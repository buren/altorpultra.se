"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { getRacePhase, secondsUntil, formatDuration } from "@/lib/race/clock";
import { site, currentYear, event } from "@/lib/constants";

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

  useEffect(() => {
    fetch("/api/race/auth")
      .then((res) => {
        if (res.ok) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{site.name} Admin</h1>
            <p className="text-gray-400 text-sm">{currentYear}</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/race"
              target="_blank"
              className="bg-gray-700 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-600"
            >
              View Leaderboard
            </a>
            {(() => {
              const phase = getRacePhase(
                event.startDateTime,
                event.endDateTime,
                now
              );
              if (phase === "before") {
                const secs = secondsUntil(event.startDateTime, now);
                return (
                  <div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">
                      {formatDuration(secs)}
                    </div>
                    <div className="text-xs text-gray-400">
                      until race starts
                    </div>
                  </div>
                );
              }
              if (phase === "during") {
                const secs = secondsUntil(event.endDateTime, now);
                return (
                  <div>
                    <div className="text-2xl font-mono font-bold text-green-400">
                      {formatDuration(secs)}
                    </div>
                    <div className="text-xs text-gray-400">remaining</div>
                  </div>
                );
              }
              return (
                <span className="text-gray-400 font-semibold">
                  Race completed
                </span>
              );
            })()}
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 flex gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                pathname === link.href
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {children}
    </div>
  );
}
