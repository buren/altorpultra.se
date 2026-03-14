"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher({ scrolled }: { scrolled: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${isPending ? 'opacity-50' : ''}`}>
      <button
        onClick={() => switchLocale('sv')}
        className={`px-1 transition-colors ${
          locale === 'sv'
            ? scrolled ? 'text-gray-900 font-bold' : 'text-white font-bold'
            : scrolled ? 'text-gray-400 hover:text-gray-700' : 'text-white/50 hover:text-white'
        }`}
      >
        SV
      </button>
      <span className={scrolled ? 'text-gray-300' : 'text-white/30'}>|</span>
      <button
        onClick={() => switchLocale('en')}
        className={`px-1 transition-colors ${
          locale === 'en'
            ? scrolled ? 'text-gray-900 font-bold' : 'text-white font-bold'
            : scrolled ? 'text-gray-400 hover:text-gray-700' : 'text-white/50 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
