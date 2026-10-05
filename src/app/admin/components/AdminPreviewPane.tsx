"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Monitor,
  Smartphone,
  RotateCw,
  ExternalLink,
  X,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPreviewPaneProps {
  currentRoute: string;
  content: any;
  onClose: () => void;
  onNavigateRoute?: (route: string) => void;
}

export function AdminPreviewPane({
  currentRoute,
  content,
  onClose,
  onNavigateRoute
}: AdminPreviewPaneProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [key, setKey] = useState(0);
  const [activeUrl, setActiveUrl] = useState(currentRoute);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Initialize BroadcastChannel
  useEffect(() => {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channelRef.current = new BroadcastChannel("attomatti_preview_sync");
      }
    } catch {}

    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Sync internal route whenever admin activeTab changes
  useEffect(() => {
    setActiveUrl(currentRoute);
  }, [currentRoute]);

  // Push content updates through all 4 channels whenever draft content updates
  const syncContentToIframe = (dataToSync?: any) => {
    const data = dataToSync || contentRef.current;
    if (!data) return;

    // 1. Direct synchronous same-origin function execution
    try {
      const iframeWin = iframeRef.current?.contentWindow as any;
      if (iframeWin && typeof iframeWin.__ATTOMATTI_UPDATE_PREVIEW === "function") {
        iframeWin.__ATTOMATTI_UPDATE_PREVIEW(data);
      }
    } catch (e) {
      // Ignored if cross-origin
    }

    // 2. BroadcastChannel
    try {
      channelRef.current?.postMessage({
        type: "ATTOMATTI_PREVIEW_SYNC",
        content: data
      });
    } catch {}

    // 3. localStorage for cross-frame storage events
    try {
      localStorage.setItem("attomatti_preview_live_data", JSON.stringify(data));
    } catch {}

    // 4. postMessage
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "ATTOMATTI_PREVIEW_SYNC", content: data },
        "*"
      );
    } catch {}
  };

  useEffect(() => {
    syncContentToIframe(content);
  }, [content, key]);

  // Listen for handshake from iframe when it finishes mounting
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "ATTOMATTI_PREVIEW_READY") {
        syncContentToIframe(contentRef.current);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleIframeLoad = () => {
    // Iframe DOM loaded: push content progressively across React hydration window
    syncContentToIframe(contentRef.current);
    const delays = [50, 150, 400, 800, 1500];
    delays.forEach((delay) => {
      setTimeout(() => {
        syncContentToIframe(contentRef.current);
      }, delay);
    });
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "ATTOMATTI_PING" }, "*");
    } catch {}
  };

  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  const previewSrc = `${activeUrl}${activeUrl.includes("?") ? "&" : "?"}preview=1`;

  // Render contextual subpage selector depending on active section
  const renderRouteSelector = () => {
    if (activeUrl.startsWith("/landing") && (content?.landings || []).length > 0) {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <select
            value={activeUrl}
            onChange={(e) => {
              const nextUrl = e.target.value;
              setActiveUrl(nextUrl);
              onNavigateRoute?.(nextUrl);
            }}
            className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer max-w-[200px] truncate"
            title="Seleziona la landing page"
          >
            {content.landings.map((l: any, i: number) => {
              const targetUrl = `/landing/${l.slug || ""}`;
              return (
                <option key={l.slug || l.id || i} value={targetUrl} className="bg-background text-foreground">
                  {l.title ? `${l.title} (${l.slug || "senza slug"})` : l.slug || `Landing ${i + 1}`}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    if (activeUrl.startsWith("/Location") && (content?.locations || []).length > 0) {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <select
            value={activeUrl}
            onChange={(e) => {
              const nextUrl = e.target.value;
              setActiveUrl(nextUrl);
              onNavigateRoute?.(nextUrl);
            }}
            className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer max-w-[200px] truncate"
            title="Seleziona la location"
          >
            <option value="/Location" className="bg-background text-foreground">
              Tutte le Location (Hub)
            </option>
            {content.locations.map((loc: any, i: number) => {
              const targetUrl = `/Location/${loc.slug || ""}`;
              return (
                <option key={loc.slug || loc.id || i} value={targetUrl} className="bg-background text-foreground">
                  {loc.venue_name || loc.title || `Location ${i + 1}`}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    if (activeUrl.startsWith("/Spettacoli") && (content?.pages?.spettacoli?.archive_sections || []).length > 0) {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <select
            value={activeUrl}
            onChange={(e) => {
              const nextUrl = e.target.value;
              setActiveUrl(nextUrl);
              onNavigateRoute?.(nextUrl);
            }}
            className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer max-w-[200px] truncate"
            title="Seleziona pagina spettacoli"
          >
            <option value="/Spettacoli" className="bg-background text-foreground">
              Archivio Spettacoli
            </option>
            {content.pages.spettacoli.archive_sections.map((show: any, i: number) => {
              if (!show.slug) return null;
              const targetUrl = `/Spettacoli/${show.slug}`;
              return (
                <option key={show.slug || i} value={targetUrl} className="bg-background text-foreground">
                  {show.title || `Spettacolo ${i + 1}`}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    if (activeUrl.startsWith("/Iniziative") && (content?.pages?.iniziative?.archive_sections || []).length > 0) {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <select
            value={activeUrl}
            onChange={(e) => {
              const nextUrl = e.target.value;
              setActiveUrl(nextUrl);
              onNavigateRoute?.(nextUrl);
            }}
            className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer max-w-[200px] truncate"
            title="Seleziona iniziativa"
          >
            <option value="/Iniziative" className="bg-background text-foreground">
              Elenco Iniziative
            </option>
            {content.pages.iniziative.archive_sections.map((iniz: any, i: number) => {
              if (!iniz.slug) return null;
              const targetUrl = `/Iniziative/${iniz.slug}`;
              return (
                <option key={iniz.slug || i} value={targetUrl} className="bg-background text-foreground">
                  {iniz.title || `Iniziativa ${i + 1}`}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="font-mono text-foreground/80 font-bold truncate">
          {activeUrl}
        </span>
      </div>
    );
  };

  return (
    <aside className="flex flex-col h-[calc(100vh-4.5rem)] sticky top-[4rem] bg-muted/20 border border-foreground/10 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Top Controls Toolbar */}
      <div className="px-4 py-2.5 bg-background/95 backdrop-blur-md border-b border-foreground/10 flex items-center justify-between gap-3 text-xs">
        {/* Left: Route Selector / Indicator */}
        {renderRouteSelector()}

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center bg-foreground/5 p-1 rounded-xl border border-foreground/5 shrink-0">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-colors",
              device === "desktop"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground"
            )}
            title="Vista Desktop (100%)"
          >
            <Monitor size={14} />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-colors",
              device === "mobile"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground"
            )}
            title="Vista Smartphone (375px)"
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleReload}
            className="p-1.5 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
            title="Ricarica Anteprima"
          >
            <RotateCw size={14} />
          </button>
          <a
            href={previewSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
            title="Apri in nuova scheda"
          >
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Chiudi Anteprima"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-muted/40 p-3 sm:p-4 overflow-hidden flex items-center justify-center">
        {device === "mobile" ? (
          <div className="w-[375px] h-[700px] max-h-full rounded-[2.5rem] border-[6px] border-foreground/20 shadow-2xl overflow-hidden bg-background relative flex flex-col">
            {/* Phone Notch/Speaker Indicator */}
            <div className="w-full h-4 bg-background flex items-center justify-center shrink-0">
              <div className="w-16 h-1 rounded-full bg-foreground/20" />
            </div>
            <iframe
              key={`${activeUrl}-${key}`}
              ref={iframeRef}
              src={previewSrc}
              onLoad={handleIframeLoad}
              className="w-full flex-1 border-none bg-background"
              title="Anteprima Mobile"
            />
          </div>
        ) : (
          <div className="w-full h-full rounded-xl overflow-hidden border border-foreground/10 bg-background shadow-lg">
            <iframe
              key={`${activeUrl}-${key}`}
              ref={iframeRef}
              src={previewSrc}
              onLoad={handleIframeLoad}
              className="w-full h-full border-none bg-background"
              title="Anteprima Desktop"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
