"use client";

import React, { useState } from "react";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { AdminNavbar } from "./components/AdminNavbar";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminPreviewPane } from "./components/AdminPreviewPane";
import { Toast } from "./components/Toast";
import { DraftBanner } from "./components/DraftBanner";
import { cn } from "@/lib/utils";

// Tabs
import { SiteTab } from "./tabs/SiteTab";
import { NavigationTab } from "./tabs/NavigationTab";
import { HomeTab } from "./tabs/HomeTab";
import { ChiSiamoTab } from "./tabs/ChiSiamoTab";
import { AttoriTab } from "./tabs/AttoriTab";
import { SpettacoliTab } from "./tabs/SpettacoliTab";
import { IniziativeTab } from "./tabs/IniziativeTab";
import { TicketingTab } from "./tabs/TicketingTab";
import { RegistrationsTab } from "./tabs/RegistrationsTab";
import { LocationsTab } from "./tabs/LocationsTab";
import { PressTab } from "./tabs/PressTab";
import { ContactTab } from "./tabs/ContactTab";
import { LandingTab } from "./tabs/LandingTab";
import { GalleryTab } from "./tabs/GalleryTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { EmailTab } from "./tabs/EmailTab";
import { JsonTab } from "./tabs/JsonTab";
import { GuidaTab } from "./tabs/GuidaTab";

const getRouteForTab = (tab: string, content: any, activeLandingSlug?: string): string => {
  switch (tab) {
    case "guida":
    case "home":
    case "site":
    case "navigation":
    case "gallery":
    case "emails":
    case "integrations":
      return "/";
    case "chi_siamo":
      return "/Chi_Siamo";
    case "attori":
      return "/Chi_Siamo/Attori";
    case "parlano_di_noi":
      return "/Chi_Siamo/Parlano_di_noi";
    case "spettacoli":
      return "/Spettacoli";
    case "iniziative":
      return "/Iniziative";
    case "ticketing":
      return "/Biglietti";
    case "registrations":
      return "/Registrazioni";
    case "locations": {
      const firstLoc = content?.locations?.[0]?.slug;
      return firstLoc ? `/Location/${firstLoc}` : "/Location";
    }
    case "contatti":
      return "/Contatti";
    case "landing": {
      if (activeLandingSlug) {
        return `/landing/${activeLandingSlug}`;
      }
      const firstLanding = content?.landings?.[0]?.slug;
      return firstLanding ? `/landing/${firstLanding}` : "/";
    }
    default:
      return "/";
  }
};

function AdminContent() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p) return p;
    }
    return "guida";
  });
  const [activeLandingSlug, setActiveLandingSlug] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { content, isLoading } = useAdmin();

  // Keep activeLandingSlug synced with first available landing if empty
  React.useEffect(() => {
    if (!activeLandingSlug && content?.landings?.[0]?.slug) {
      setActiveLandingSlug(content.landings[0].slug);
    }
  }, [content?.landings, activeLandingSlug]);

  // Load persisted collapse state on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("attomatti_admin_sidebar_collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("attomatti_admin_sidebar_collapsed", String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  const previewRoute = getRouteForTab(activeTab, content, activeLandingSlug);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <AdminNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isPreviewOpen={isPreviewOpen}
        onTogglePreview={() => {
          setIsPreviewOpen((prev) => {
            const next = !prev;
            if (next && !isSidebarCollapsed && typeof window !== "undefined" && window.innerWidth >= 1024) {
              setIsSidebarCollapsed(true);
            }
            return next;
          });
        }}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      <div className="flex">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        <main
          className={cn(
            "flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8 overflow-x-clip transition-all duration-300",
            isSidebarCollapsed ? "md:pl-16" : "md:pl-72"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="flex flex-col items-center gap-3 text-foreground/40">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs font-bold tracking-wider uppercase">
                  Caricamento contenuti...
                </span>
              </div>
            </div>
          ) : (
            <div className={cn("mx-auto transition-all", isPreviewOpen || activeTab === "emails" ? "max-w-[1920px] w-full" : "max-w-5xl")}>
              <DraftBanner />

              <div className={cn("flex gap-8 items-start", isPreviewOpen ? "flex-col lg:flex-row" : "")}>
                {/* Editing Tab Pane (50% when preview open) */}
                <div className={cn("w-full transition-all pb-24", isPreviewOpen ? "lg:w-1/2 min-w-0" : activeTab === "emails" ? "w-full min-w-0" : "max-w-5xl mx-auto")}>
                  {activeTab === "guida" && <GuidaTab onNavigateTab={(tab) => setActiveTab(tab)} />}
                  {activeTab === "site" && <SiteTab />}
                  {activeTab === "navigation" && <NavigationTab />}
                  {activeTab === "home" && <HomeTab />}
                  {activeTab === "gallery" && <GalleryTab onNavigateTab={(tab) => setActiveTab(tab)} />}
                  {activeTab === "emails" && <EmailTab />}
                  {activeTab === "integrations" && <IntegrationsTab />}
                  {activeTab === "chi_siamo" && <ChiSiamoTab />}
                  {activeTab === "attori" && <AttoriTab />}
                  {activeTab === "spettacoli" && <SpettacoliTab />}
                  {activeTab === "iniziative" && <IniziativeTab />}
                  {activeTab === "ticketing" && <TicketingTab />}
                  {activeTab === "registrations" && <RegistrationsTab />}
                  {activeTab === "locations" && <LocationsTab />}
                  {activeTab === "landing" && (
                    <LandingTab
                      selectedSlug={activeLandingSlug}
                      onSelectSlug={(slug) => setActiveLandingSlug(slug)}
                      onRequestPreview={(slug) => {
                        setActiveLandingSlug(slug);
                        setIsPreviewOpen(true);
                      }}
                    />
                  )}
                  {activeTab === "parlano_di_noi" && <PressTab />}
                  {activeTab === "contatti" && <ContactTab />}
                  {activeTab === "json" && <JsonTab onNavigateTab={(tab) => setActiveTab(tab)} />}
                </div>

                {/* Live Preview Side-by-Side Sticky Pane (50% on Desktop/Laptop) */}
                {isPreviewOpen && (
                  <div className="hidden lg:block lg:w-1/2 min-w-0 sticky top-[5rem] self-start z-30">
                    <AdminPreviewPane
                      currentRoute={previewRoute}
                      content={content}
                      onClose={() => setIsPreviewOpen(false)}
                      onNavigateRoute={(route) => {
                        if (route.startsWith("/landing/")) {
                          const slug = route.replace("/landing/", "").split("?")[0];
                          if (slug) setActiveLandingSlug(slug);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Mobile/Tablet Preview Overlay (Only on small screens < lg) */}
              {isPreviewOpen && (
                <div className="lg:hidden fixed inset-3 z-50 shadow-2xl">
                  <AdminPreviewPane
                    currentRoute={previewRoute}
                    content={content}
                    className="h-full"
                    onClose={() => setIsPreviewOpen(false)}
                    onNavigateRoute={(route) => {
                      if (route.startsWith("/landing/")) {
                        const slug = route.replace("/landing/", "").split("?")[0];
                        if (slug) setActiveLandingSlug(slug);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Toast />
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}
