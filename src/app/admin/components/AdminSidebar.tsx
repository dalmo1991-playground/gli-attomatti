"use client";

import React from "react";
import {
  Globe,
  Menu as MenuIcon,
  Home as HomeIcon,
  Users,
  Theater,
  Compass,
  Newspaper,
  Mail,
  Code,
  ChevronRight,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const navSections = [
  {
    category: "Configurazione",
    items: [
      { id: "site", label: "Sito & Meta", icon: Globe },
      { id: "navigation", label: "Menu Navigazione", icon: MenuIcon },
      { id: "home", label: "Home Page", icon: HomeIcon }
    ]
  },
  {
    category: "Pagine e Contenuti",
    items: [
      { id: "chi_siamo", label: "Chi Siamo", icon: Users },
      { id: "attori", label: "Cast & Staff", icon: Users },
      { id: "spettacoli", label: "Spettacoli", icon: Theater },
      { id: "iniziative", label: "Iniziative & Corsi", icon: Compass },
      { id: "landing", label: "Landing Pages", icon: Rocket },
      { id: "parlano_di_noi", label: "Dicono di Noi", icon: Newspaper },
      { id: "contatti", label: "Contatti & Social", icon: Mail }
    ]
  },
  {
    category: "Strumenti Sviluppatore",
    items: [{ id: "json", label: "Sorgente JSON", icon: Code }]
  }
];

export function AdminSidebar({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseMobile
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-40 w-72 bg-background border-r border-foreground/5 p-4 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 overflow-y-auto custom-scrollbar",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="space-y-6">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <h5 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-2">
                {sec.category}
              </h5>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onCloseMobile();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all group",
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-foreground/60 hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={cn(
                            isActive
                              ? "text-white"
                              : "text-foreground/40 group-hover:text-primary transition-colors"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight size={14} className="text-white/60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-6 border-t border-foreground/5 text-center text-[10px] text-foreground/30 font-medium">
          Gli Attomatti Dashboard © {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
