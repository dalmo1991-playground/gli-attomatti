import { getContent } from "@/lib/data";
import AttoriClient from "./AttoriClient";

export default async function AttoriPage() {
  const content = await getContent();
  return <AttoriClient content={content} />;
}
