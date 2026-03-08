import { AltorpUltra } from "@/components/AltorpUltra";
import { getCurrentEdition, getPublishedYears } from "@/lib/race/get-edition";

export default async function Home() {
  const [edition, publishedYears] = await Promise.all([
    getCurrentEdition(),
    getPublishedYears(),
  ]);
  if (!edition) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">No edition found</div>;
  }
  return <AltorpUltra edition={edition} publishedYears={publishedYears} />;
}
