import { getContent } from "@/lib/data";
import SpettacoliClient from "./SpettacoliClient";

export default async function SpettacoliPage() {
  const content = await getContent();
  return <SpettacoliClient content={content} />;
}
