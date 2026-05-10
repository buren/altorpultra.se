"use client";

import { useEffect, useState } from "react";

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/race/auth")
      .then((res) => {
        if (!cancelled && res.ok) setIsAdmin(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}
