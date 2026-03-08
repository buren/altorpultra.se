import { googleMaps } from "@/lib/config";

export default function GoogleMapsRoute() {
  return (
    <iframe src={googleMaps.routeEmbed} width="100%" height="480"></iframe>
  );
}
