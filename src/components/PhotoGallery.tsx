"use client"

import { StaticImageData } from "next/image";
import { ColumnsPhotoAlbum } from "react-photo-album";
import "react-photo-album/columns.css";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// import optional lightbox plugins
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";

import { useState } from "react";

export type GalleryImage = {
  image: StaticImageData;
  alt: string;
};

export default function PhotoGallery({ images }: { images: (StaticImageData | GalleryImage)[] }) {
  const [index, setIndex] = useState(-1);

  const photos = images.map((img) => {
    const data = "image" in img ? img.image : img;
    const alt = "alt" in img ? img.alt : "";
    return { src: data.src, width: data.width, height: data.height, alt };
  });
  return (
    <>
      <ColumnsPhotoAlbum
        photos={photos}
        spacing={5}
        onClick={({ index }) => setIndex(index)}
      />

      <Lightbox
        slides={photos}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slideshow={{ delay: 1000 }}
        // enable optional lightbox plugins
        plugins={[Fullscreen, Slideshow, Thumbnails, Zoom]}
      />
    </>
  )
}
