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

const getRouteForTab = (tab: string, content: any, activeLandingSlug?: string): string => {
  switch (tab) {
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
  const [activeTab, setActiveTab] = useState("spettacoli");
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
        onTogglePreview={() => setIsPreviewOpen((prev) => !prev)}
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
            "flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8 overflow-x-hidden transition-all duration-300",
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
            <div className={cn("mx-auto transition-all", isPreviewOpen || activeTab === "emails" ? "max-w-[1850px] w-full" : "max-w-5xl")}>
              <DraftBanner />

              <div className={cn("flex gap-8 items-start", isPreviewOpen ? "flex-col xl:flex-row" : "")}>
                {/* Editing Tab Pane */}
                <div className={cn("w-full transition-all pb-24", isPreviewOpen ? "xl:w-1/2 min-w-0" : activeTab === "emails" ? "w-full min-w-0" : "max-w-5xl mx-auto")}>
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
                  {activeTab === "json" && <JsonTab />}
                </div>

                {/* Live Preview Side-by-Side Pane (Desktop) */}
                {isPreviewOpen && (
                  <div className="hidden xl:block xl:w-1/2 min-w-0 sticky top-[5rem]">
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

              {/* Mobile/Tablet Preview Overlay */}
              {isPreviewOpen && (
                <div className="xl:hidden fixed inset-3 z-50 shadow-2xl">
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
