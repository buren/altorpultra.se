import { StaticImageData } from "next/legacy/image";
import { RowsPhotoAlbum } from "react-photo-album";

export default function PhotoGallery({ images }: { images: StaticImageData[] }) {
  const photos = images.map(({ src, height, width, }) => ({ src, height, width, }));

  return <RowsPhotoAlbum photos={photos} />;
}
