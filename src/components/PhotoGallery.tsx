import { StaticImageData } from "next/image";
import { ColumnsPhotoAlbum } from "react-photo-album";
import "react-photo-album/columns.css";

export default function PhotoGallery({ images }: { images: StaticImageData[] }) {
  const photos = images.map(({ src, width, height, }) => ({ src, width, height, }));
  return <ColumnsPhotoAlbum photos={photos} spacing={5} />;
}
