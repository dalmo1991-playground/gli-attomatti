import React from "react";
import { Metadata } from "next";
import { isAreaRiservataAuthenticated } from "@/app/actions/areaRiservataAuth";
import AreaRiservataGate from "@/components/area-riservata/AreaRiservataGate";

export const metadata: Metadata = {
  title: "Area Riservata — Gli Attomatti",
  description: "Area riservata di compagnia per la consultazione e gestione di assenze, appuntamenti e risorse interne.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AreaRiservataLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await isAreaRiservataAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background text-foreground pb-12 pt-4 sm:pt-8">
        <AreaRiservataGate />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-16 pt-2 sm:pt-6">
      {children}
    </main>
  );
}

