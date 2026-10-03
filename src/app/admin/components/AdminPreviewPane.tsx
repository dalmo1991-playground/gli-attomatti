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
  const syncContentToIframe = (dataToSync: any) => {
    if (!dataToSync) return;

    // 1. Direct synchronous same-origin function execution
    try {
      const iframeWin = iframeRef.current?.contentWindow as any;
      if (iframeWin && typeof iframeWin.__ATTOMATTI_UPDATE_PREVIEW === "function") {
        iframeWin.__ATTOMATTI_UPDATE_PREVIEW(dataToSync);
      }
    } catch (e) {
      // Ignored if cross-origin
    }

    // 2. BroadcastChannel
    try {
      channelRef.current?.postMessage({
        type: "ATTOMATTI_PREVIEW_SYNC",
        content: dataToSync
      });
    } catch {}

    // 3. localStorage for cross-frame storage events
    try {
      localStorage.setItem("attomatti_preview_live_data", JSON.stringify(dataToSync));
    } catch {}

    // 4. postMessage
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "ATTOMATTI_PREVIEW_SYNC", content: dataToSync },
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
        syncContentToIframe(content);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [content]);

  const handleIframeLoad = () => {
    // Iframe DOM loaded, immediately push current state
    setTimeout(() => {
      syncContentToIframe(content);
    }, 50);
  };

  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  const previewSrc = `${activeUrl}${activeUrl.includes("?") ? "&" : "?"}preview=1`;

  return (
    <aside className="flex flex-col h-[calc(100vh-4.5rem)] sticky top-[4rem] bg-muted/20 border border-foreground/10 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Top Controls Toolbar */}
      <div className="px-4 py-2.5 bg-background/95 backdrop-blur-md border-b border-foreground/10 flex items-center justify-between gap-3 text-xs">
        {/* Left: Route Selector / Indicator */}
        {activeUrl.startsWith("/landing") && (content?.landings || []).length > 0 ? (
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
              title="Seleziona la landing page da visualizzare"
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
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-mono text-foreground/80 font-bold truncate">
              {activeUrl}
            </span>
          </div>
        )}

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
              key={key}
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
              key={key}
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
