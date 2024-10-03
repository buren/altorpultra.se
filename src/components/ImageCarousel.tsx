import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import Image from "next/image";

import first from '../public/route-gallery/1.jpg'
import second from '../public/route-gallery/2.jpg'
import third from '../public/route-gallery/3.webp'
import forth from '../public/route-gallery/4.webp'
import fifth from '../public/route-gallery/5.webp'

export default function ImageCarousel() {
  const images = [first, second, third, forth, fifth];

  return (
    <Carousel className="w-full max-w-xs" opts={({ loop: true })}>
      <CarouselContent>
        {images.map((imageSrc, index) => (
          <CarouselItem key={`carousel-${index}`}>
            <Image src={imageSrc} alt="Altorp" priority />
          </CarouselItem>  
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}