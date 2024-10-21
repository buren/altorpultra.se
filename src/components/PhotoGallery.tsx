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

export default function PhotoGallery({ images }: { images: StaticImageData[] }) {
  const [index, setIndex] = useState(-1);

  const photos = images.map(({ src, width, height, }) => ({ src, width, height, }));
  return (
    <>
      <ColumnsPhotoAlbum
        photos={photos}
        spacing={5}
        onClick={({ index }) => setIndex(index)}
      />;

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
