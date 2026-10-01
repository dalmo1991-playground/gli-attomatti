"use client";

import React, { useState } from "react";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { AdminNavbar } from "./components/AdminNavbar";
import { AdminSidebar } from "./components/AdminSidebar";
import { Toast } from "./components/Toast";
import { DraftBanner } from "./components/DraftBanner";

// Tabs
import { SiteTab } from "./tabs/SiteTab";
import { NavigationTab } from "./tabs/NavigationTab";
import { HomeTab } from "./tabs/HomeTab";
import { ChiSiamoTab } from "./tabs/ChiSiamoTab";
import { AttoriTab } from "./tabs/AttoriTab";
import { SpettacoliTab } from "./tabs/SpettacoliTab";
import { IniziativeTab } from "./tabs/IniziativeTab";
import { PressTab } from "./tabs/PressTab";
import { ContactTab } from "./tabs/ContactTab";
import { LandingTab } from "./tabs/LandingTab";
import { GalleryTab } from "./tabs/GalleryTab";
import { JsonTab } from "./tabs/JsonTab";

function AdminContent() {
  const [activeTab, setActiveTab] = useState("spettacoli");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isLoading } = useAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <AdminNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 md:pl-72 min-h-[calc(100vh-4rem)] p-4 sm:p-8 md:p-12 overflow-x-hidden">
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
            <div className="max-w-5xl mx-auto pb-24">
              <DraftBanner />
              {activeTab === "site" && <SiteTab />}
              {activeTab === "navigation" && <NavigationTab />}
              {activeTab === "home" && <HomeTab />}
              {activeTab === "gallery" && <GalleryTab onNavigateTab={(tab) => setActiveTab(tab)} />}
              {activeTab === "chi_siamo" && <ChiSiamoTab />}
              {activeTab === "attori" && <AttoriTab />}
              {activeTab === "spettacoli" && <SpettacoliTab />}
              {activeTab === "iniziative" && <IniziativeTab />}
              {activeTab === "landing" && <LandingTab />}
              {activeTab === "parlano_di_noi" && <PressTab />}
              {activeTab === "contatti" && <ContactTab />}
              {activeTab === "json" && <JsonTab />}
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
