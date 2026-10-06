import { getContent } from "@/lib/data";
import { LocationItem } from "@/lib/locationTypes";
import Link from "next/link";
import { MapPin, Navigation, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const page = content?.pages?.locations;
  const site = content?.site;

  return {
    title: page?.meta_title || page?.hub_title || site?.name || "",
    description: page?.meta_description || page?.hub_description || site?.description || "",
    robots: {
      index: false,
      follow: false,
    },
  };
}

import LocationsHubClient from "./LocationsHubClient";

export default async function LocationsHubPage() {
  const content = await getContent();
  return <LocationsHubClient content={content} />;
}
