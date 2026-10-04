"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/analytics/CookieBanner";
import { TrackingScripts } from "@/components/analytics/TrackingScripts";
import { DevThemeCustomizer } from "@/components/dev/DevThemeCustomizer";
import { DevAccessGate } from "@/components/dev/DevAccessGate";
import { LivePreviewProvider, useLiveContent } from "@/components/dev/LivePreviewContext";
import { PreviewBanner } from "@/components/dev/PreviewBanner";
import { EmailActionModal } from "@/components/ui/EmailActionModal";

interface LayoutWrapperProps {
  children: React.ReactNode;
  content: any;
  isDev?: boolean;
  initialHasAccess?: boolean;
}

function LayoutInner({
  children,
  content,
  isLanding,
}: {
  children: React.ReactNode;
  content: any;
  isLanding: boolean;
}) {
  const liveContent = useLiveContent(content);
  const [consent, setConsent] = useState<{ analytics: boolean; marketing: boolean }>({
    analytics: false,
    marketing: false,
  });

  return (
    <>
      <PreviewBanner content={liveContent?.ui?.preview_banner} />

      <TrackingScripts
        integrations={liveContent?.integrations}
        consent={consent}
      />

      {isLanding ? (
        <main className="min-h-screen">{children}</main>
      ) : (
        <>
          <Navbar content={liveContent} />
          <main className="min-h-screen pt-20">
            {children}
          </main>
          <Footer content={liveContent} />
        </>
      )}

      <CookieBanner
        integrations={liveContent?.integrations}
        uiContent={liveContent?.ui?.cookie_banner}
        onConsentChange={setConsent}
      />

      <EmailActionModal />

      <DevThemeCustomizer />
    </>
  );
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

  return (
    <DevAccessGate isDev={isDev} initialHasAccess={initialHasAccess} devGateContent={content?.ui?.dev_gate}>
      {isAdmin ? (
        <main className="min-h-screen">{children}</main>
      ) : (
        <LivePreviewProvider initialContent={content}>
          <LayoutInner content={content} isLanding={isLanding}>
            {children}
          </LayoutInner>
        </LivePreviewProvider>
      )}
    </DevAccessGate>
  );
}
