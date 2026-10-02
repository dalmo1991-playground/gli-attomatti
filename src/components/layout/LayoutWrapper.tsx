"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/analytics/CookieBanner";
import { TrackingScripts } from "@/components/analytics/TrackingScripts";
import { DevThemeCustomizer } from "@/components/dev/DevThemeCustomizer";
import { DevAccessGate } from "@/components/dev/DevAccessGate";

interface LayoutWrapperProps {
  children: React.ReactNode;
  content: any;
  isDev?: boolean;
  initialHasAccess?: boolean;
}

export function LayoutWrapper({
  children,
  content,
  isDev = false,
  initialHasAccess = true,
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isLanding = pathname?.startsWith("/landing");

  const [consent, setConsent] = useState<{ analytics: boolean; marketing: boolean }>({
    analytics: false,
    marketing: false,
  });

  return (
    <DevAccessGate isDev={isDev} initialHasAccess={initialHasAccess}>
      {isAdmin ? (
        <main className="min-h-screen">{children}</main>
      ) : (
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
      )}
    </DevAccessGate>
  );
}
