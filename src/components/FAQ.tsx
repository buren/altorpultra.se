"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useTranslations } from "next-intl";
import SectionTitle from "./SectionTitle";

export default function FAQ({ priceSEK }: { priceSEK: number }) {
  const t = useTranslations('faq');

  const items = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    {
      q: t('q4'),
      a: t.rich('a4', {
        link: (chunks) => <a href="https://maps.app.goo.gl/EEgT5kJ7bdHEE1Rz5">{chunks}</a>,
      }),
    },
    { q: t('q5'), a: t('a5', { priceSEK }) },
  ];

  return (
    <div className="md:w-2/3 md:max-w-[600px]">
      <SectionTitle title={t('title')} />
      <Accordion type="multiple" defaultValue={["item-0", "item-1"]}>
        {items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-xl font-bold">{item.q}</AccordionTrigger>
            <AccordionContent className="text-lg">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
