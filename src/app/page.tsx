import { getContent } from "@/lib/data";
import HomeClient from "./HomeClient";

export default async function Home() {
  const content = await getContent();
  return <HomeClient content={content} />;
}
