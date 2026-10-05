import { getContent } from "@/lib/data";
import { LocationItem } from "@/lib/locationTypes";
import Link from "next/link";
import { MapPin, Navigation, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teatri & Location — Gli Attomatti",
  description: "Indicazioni pratiche e guide fotografiche per raggiungere i teatri e le sale dei nostri spettacoli a Zurigo.",
  robots: {
    index: false,
    follow: false,
  },
};

import LocationsHubClient from "./LocationsHubClient";

export default async function LocationsHubPage() {
  const content = await getContent();
  return <LocationsHubClient content={content} />;
}
