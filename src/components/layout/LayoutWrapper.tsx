"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/analytics/CookieBanner";
import { TrackingScripts } from "@/components/analytics/TrackingScripts";
import { DevThemeCustomizer } from "@/components/dev/DevThemeCustomizer";

export function LayoutWrapper({ children, content }: { children: React.ReactNode, content: any }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isLanding = pathname?.startsWith("/landing");

  const [consent, setConsent] = useState<{ analytics: boolean; marketing: boolean }>({
    analytics: false,
    marketing: false,
  });

  if (isAdmin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <TrackingScripts
        integrations={content?.integrations}
        consent={consent}
      />

      {isLanding ? (
        <main className="min-h-screen">{children}</main>
      ) : (
        <>
          <Navbar content={content} />
          <main className="min-h-screen pt-20">
            {children}
          </main>
          <Footer content={content} />
        </>
      )}

      <CookieBanner
        integrations={content?.integrations}
        onConsentChange={setConsent}
      />

      <DevThemeCustomizer />
    </>
  );
}
