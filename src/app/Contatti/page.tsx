import { getContent } from "@/lib/data";
import ContattiClient from "./ContattiClient";

export default async function ContattiPage() {
  const content = await getContent();
  return <ContattiClient content={content} />;
}
