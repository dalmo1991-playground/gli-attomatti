import { getContent } from "@/lib/data";
import SpettacoloDettaglioClient from "./SpettacoloClient";

export default async function SpettacoloDettaglioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContent();
  return <SpettacoloDettaglioClient content={content} slug={slug} />;
}
