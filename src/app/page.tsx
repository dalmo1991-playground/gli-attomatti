import { getContent } from "@/lib/data";
import HomeClient from "./HomeClient";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const content = await getContent();
  return <HomeClient content={content} />;
}
