"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2 } from "lucide-react";

interface DeploymentDetectorProps {
  serverVersion: string;
}

export function DeploymentDetector({ serverVersion }: DeploymentDetectorProps) {
  const router = useRouter();
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastCheckedRef = useRef<number>(Date.now());
  const initialVersionRef = useRef<string>(serverVersion);

  const performUpdate = useCallback(() => {
    setIsUpdating(true);
    try {
      // Clear any stale preview data that might be stuck in localStorage
      localStorage.removeItem("attomatti_preview_live_data");
    } catch {}

    // Invalidate Next.js client router cache and refresh the current route
    router.refresh();

    // Give a brief moment for router.refresh to execute, then reload if still on old bundle
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }, [router]);

  const checkVersion = useCallback(async () => {
    // Throttle checks to once every 10 seconds minimum
    const now = Date.now();
    if (now - lastCheckedRef.current < 10000) return;
    lastCheckedRef.current = now;

    try {
      const res = await fetch("/api/version", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data?.version && initialVersionRef.current && data.version !== initialVersionRef.current) {
        // A new deployment or content version has been detected!
        setHasNewVersion(true);

        // If the tab was restored from bfcache or just brought into focus, refresh automatically
        router.refresh();
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    initialVersionRef.current = serverVersion;
  }, [serverVersion]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check when window regains focus (e.g. user returns from another app or tab)
    const handleFocus = () => {
      checkVersion();
    };

    // 2. Check when document becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };

    // 3. Check on bfcache restoration (mobile Safari / Chrome back-forward cache)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from memory cache - check immediately and refresh router
        router.refresh();
        checkVersion();
      }
    };

    // 4. Periodic polling when tab is active (every 60 seconds)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    }, 60000);

    // 5. Cross-tab sync via BroadcastChannel (if Admin published in another tab on same device)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("attomatti_preview_sync");
        channel.onmessage = (e) => {
          if (e.data?.type === "ATTOMATTI_PREVIEW_PUBLISHED") {
            try {
              localStorage.removeItem("attomatti_preview_live_data");
            } catch {}
            router.refresh();
            checkVersion();
          }
        };
      }
    } catch {}

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      if (channel) {
        channel.close();
      }
    };
  }, [checkVersion, router]);

  if (!hasNewVersion) return null;

  return (
    <aside
      aria-label="Notifica aggiornamento sito"
      className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-background/95 border border-primary/40 shadow-2xl backdrop-blur-xl text-foreground text-xs sm:text-sm font-semibold">
        <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
        <span>Nuovo contenuto disponibile</span>
        <button
          onClick={performUpdate}
          disabled={isUpdating}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer ml-1"
        >
          {isUpdating ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <CheckCircle2 size={12} />
          )}
          <span>Aggiorna ora</span>
        </button>
      </div>
    </aside>
  );
}
