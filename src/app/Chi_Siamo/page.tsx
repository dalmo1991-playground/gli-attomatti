import { getContent } from "@/lib/data";
import ChiSiamoClient from "./ChiSiamoClient";

export default async function ChiSiamoPage() {
  const content = await getContent();
  return <ChiSiamoClient content={content} />;
}
