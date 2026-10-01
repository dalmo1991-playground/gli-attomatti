import { getContent } from "@/lib/data";
import IniziativeClient from "./IniziativeClient";

export default async function IniziativePage() {
  const content = await getContent();
  return <IniziativeClient content={content} />;
}
