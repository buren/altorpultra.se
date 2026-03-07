import { googleMaps } from "@/lib/constants";

export default function GoogleMapsRoute() {
  return (
    <iframe src={googleMaps.routeEmbed} width="100%" height="480"></iframe>
  );
}
