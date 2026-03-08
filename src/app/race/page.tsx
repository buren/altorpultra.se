"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RacePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/race/editions")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data.currentYear) {
          router.replace(`/race/${data.data.currentYear}`);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No edition found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  );
}
