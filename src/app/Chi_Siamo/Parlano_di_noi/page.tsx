import { getContent } from "@/lib/data";
import ParlanoDiNoiClient from "./ParlanoDiNoiClient";

export default async function ParlanoDiNoiPage() {
  const content = await getContent();
  return <ParlanoDiNoiClient content={content} />;
}
