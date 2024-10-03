import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import SectionTitle from "./SectionTitle";

export default function FAQ() {
  return (
    <div className="md:w-2/3 md:max-w-[600px]">
      <SectionTitle title="FAQ" />
      <Accordion type="multiple" defaultValue={["item-0", "item-1"]}>
        <AccordionItem value="item-0">
          <AccordionTrigger className="text-xl font-bold">Can I run only one or two laps?</AccordionTrigger>
          <AccordionContent className="text-lg">
            Yes! It is all about challenging yourself. You can walk or run for as long, or short, as you want.
          </AccordionContent>
        </AccordionItem>
       
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xl font-bold">Do I have to run?</AccordionTrigger>
          <AccordionContent className="text-lg">
            No, you can walk and rest as much as you like.
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xl font-bold">Will there be food?</AccordionTrigger>
          <AccordionContent className="text-lg">
            Yes, there will be food! For all runners snacks are included and you will be able to buy hot food (hotdogs and burgers) at a discounted price (at cost).
            Non-runners will be able to buy as much snacks and food as they like as well!
          </AccordionContent>
        </AccordionItem>
       
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-bold">How do I get there?</AccordionTrigger>
          <AccordionContent className="text-lg">
            It is really easy to get here using public transport, only 12 minutes by train for Tekniska Högskolan. You can of course take your car as well, there is parking within 200m from the starting line.
            You can find it <a href="https://maps.app.goo.gl/EEgT5kJ7bdHEE1Rz5">here on Google Maps</a>.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-xl font-bold">How do I pay?</AccordionTrigger>
          <AccordionContent className="text-lg">
            At this point we&apos;re not excepting payments. The event will cost 200 SEK for early birds (thats you!). Register your interest now to secure your early bird price.
            More information and how to pay will be communicated soon.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
