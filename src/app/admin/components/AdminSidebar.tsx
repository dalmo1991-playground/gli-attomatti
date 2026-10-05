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
  Rocket,
  Images,
  Sliders,
  Ticket,
  ClipboardList,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navSections = [
  {
    category: "Configurazione & Media",
    items: [
      { id: "site", label: "Sito & Meta", icon: Globe },
      { id: "navigation", label: "Menu Navigazione", icon: MenuIcon },
      { id: "home", label: "Home Page", icon: HomeIcon },
      { id: "gallery", label: "Galleria Immagini", icon: Images },
      { id: "emails", label: "Email & Notifiche", icon: Send },
      { id: "integrations", label: "Marketing & Privacy", icon: Sliders }
    ]
  },
  {
    category: "Pagine e Contenuti",
    items: [
      { id: "chi_siamo", label: "Chi Siamo", icon: Users },
      { id: "attori", label: "Cast & Staff", icon: Users },
      { id: "spettacoli", label: "Spettacoli", icon: Theater },
      { id: "iniziative", label: "Iniziative & Corsi", icon: Compass },
      { id: "ticketing", label: "Biglietti & Casse", icon: Ticket },
      { id: "registrations", label: "Registrazioni & Moduli", icon: ClipboardList },
      { id: "locations", label: "Teatri & Location", icon: MapPin },
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
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
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
          "fixed top-16 bottom-0 left-0 z-40 bg-background border-r border-foreground/5 flex flex-col justify-between transition-all duration-300 overflow-y-auto custom-scrollbar",
          // Mobile open/close state
          isOpen ? "translate-x-0 w-72 p-4" : "-translate-x-full md:translate-x-0",
          // Desktop collapsed vs expanded state
          isCollapsed ? "md:w-16 md:p-2" : "md:w-72 md:p-4"
        )}
      >
        <div className="space-y-6">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              {!isCollapsed ? (
                <h5 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-2 truncate">
                  {sec.category}
                </h5>
              ) : (
                <div className="h-px bg-foreground/10 my-2 mx-1" />
              )}

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
                      title={item.label}
                      className={cn(
                        "w-full flex items-center rounded-2xl text-xs font-bold transition-all group relative",
                        isCollapsed
                          ? "justify-center p-2.5"
                          : "justify-between px-3.5 py-2.5",
                        isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-foreground/60 hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                        <Icon
                          size={18}
                          className={cn(
                            isActive
                              ? "text-white"
                              : "text-foreground/40 group-hover:text-primary transition-colors"
                          )}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && isActive && (
                        <ChevronRight size={14} className="text-white/60 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info & collapse toggle button */}
        <div className="pt-4 border-t border-foreground/5 space-y-2">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "hidden md:flex items-center rounded-xl text-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors w-full",
                isCollapsed
                  ? "justify-center p-2.5"
                  : "gap-2.5 px-3 py-2 text-xs font-semibold"
              )}
              title={isCollapsed ? "Espandi barra laterale" : "Comprimi barra laterale"}
            >
              {isCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <>
                  <PanelLeftClose size={18} />
                  <span className="truncate">Comprimi menu</span>
                </>
              )}
            </button>
          )}

          {!isCollapsed && (
            <div className="text-center text-[10px] text-foreground/30 font-medium">
              Gli Attomatti Dashboard © {new Date().getFullYear()}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
