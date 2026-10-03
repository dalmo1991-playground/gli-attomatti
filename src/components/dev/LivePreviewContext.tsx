"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const LivePreviewContext = createContext<any>(null);

export function LivePreviewProvider({
  children,
  initialContent,
}: {
  children: React.ReactNode;
  initialContent: any;
}) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isFramed = window.self !== window.top;
    const isPreview =
      window.location.search.includes("preview=1") ||
      (typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("attomatti_preview_mode") === "1");
    if (!isFramed && !isPreview) return;

    // 1. Initial hydration from localStorage
    try {
      const liveDataRaw = localStorage.getItem("attomatti_preview_live_data");
      if (liveDataRaw) {
        const parsed = JSON.parse(liveDataRaw);
        if (parsed) setContent(parsed);
      } else {
        const stored = localStorage.getItem("attomatti_admin_draft");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.content) setContent(parsed.content);
        }
      }
    } catch (e) {
      console.warn("LivePreview hydration error:", e);
    }

    // 2. Direct function exposed on window for zero-latency same-origin updates
    (window as any).__ATTOMATTI_UPDATE_PREVIEW = (newContent: any) => {
      if (newContent) {
        setContent(newContent);
      }
    };

    // 3. BroadcastChannel sync (rock solid across frames and tabs)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("attomatti_preview_sync");
        channel.onmessage = (e) => {
          if (e.data?.type === "ATTOMATTI_PREVIEW_SYNC" && e.data.content) {
            setContent(e.data.content);
          }
        };
      }
    } catch (err) {
      console.warn("BroadcastChannel error", err);
    }

    // 4. Storage event sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "attomatti_preview_live_data" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setContent(parsed);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // 5. postMessage sync
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "ATTOMATTI_PREVIEW_SYNC" && e.data.content) {
        setContent(e.data.content);
      }
    };
    window.addEventListener("message", handleMessage);

    // Announce to parent that preview is active and ready
    try {
      window.parent?.postMessage({ type: "ATTOMATTI_PREVIEW_READY" }, "*");
    } catch {}

    return () => {
      delete (window as any).__ATTOMATTI_UPDATE_PREVIEW;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("message", handleMessage);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  return (
    <LivePreviewContext.Provider value={content}>
      {children}
    </LivePreviewContext.Provider>
  );
}

export function useLiveContent(fallbackContent: any) {
  const context = useContext(LivePreviewContext);
  return context || fallbackContent;
}
