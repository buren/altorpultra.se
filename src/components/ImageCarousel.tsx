import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import Image, { StaticImageData } from "next/image";

export default function ImageCarousel({ images }: { images: (string | StaticImageData)[] }) {
  return (
    <Carousel className="w-full max-w-xs" opts={({ loop: true })}>
      <CarouselContent>
        {images.map((imageSrc, index) => (
          <CarouselItem key={`carousel-${index}`}>
            <Image
              src={imageSrc}
              alt="Altorp"
              style={{
                maxWidth: "100%",
                height: "auto"
              }} />
          </CarouselItem>  
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}