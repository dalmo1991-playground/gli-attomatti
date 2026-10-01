import { getContent } from "@/lib/data";
import IniziativaDettaglioClient from "./IniziativaClient";

export default async function IniziativaDettaglioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContent();
  return <IniziativaDettaglioClient content={content} slug={slug} />;
}
