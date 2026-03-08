export default function GoogleMapsRoute({ routeEmbed }: { routeEmbed: string }) {
  return (
    <iframe src={routeEmbed} width="100%" height="480"></iframe>
  );
}
