"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useSearchParams } from "next/navigation";

const baseRegisterUrl = "https://i.washere.io/join/CAJI1EYS?utm_source=altorpultra.se";
const utmNames = ['utm_source', 'utm_content', 'utm_medium', 'utm_term', 'utm_campaign'];

export default function RegisterButton() {
  const [registerUrl, setRegisterUrl] = useState(baseRegisterUrl);
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const url = new URL(baseRegisterUrl);

    utmNames.forEach((utmName) => {
      const value = params.get(utmName);
      if (value) {
        url.searchParams.set(utmName, value);
      }
    });

    setRegisterUrl(url.toString());
  }, [searchParams]);

  return (
    <a href={registerUrl}>
      <Button size="lg" className="text-lg px-8 py-6">
        Register Now
      </Button>
    </a>
  );
}
