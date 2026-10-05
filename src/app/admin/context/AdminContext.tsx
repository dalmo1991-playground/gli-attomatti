"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import contentData from "@/data/content.json";
import { PublishStatus, DiffEntry, RecoverableDraft } from "../types";

interface AdminContextType {
  content: any;
  setContent: (content: any) => void;
  updateContent: (path: string, value: any) => void;
  adminSecret: string;
  setAdminSecret: (secret: string) => void;
  isPublishing: boolean;
  publishStatus: PublishStatus | null;
  setPublishStatus: (status: PublishStatus | null) => void;
  handlePublish: () => Promise<void>;
  diffList: DiffEntry[];
  hasUnsavedChanges: boolean;
  discardChanges: () => void;
  isLoading: boolean;
  activeBranch: string;
  recoverableDraft: RecoverableDraft | null;
  restoreDraft: () => void;
  dismissDraft: () => void;
  lastDraftSavedAt: string | null;
}

const AdminContext = createContext<AdminContextType | null>(null);

function findDiffs(original: any, current: any, prefix = ""): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  if (original === current) return diffs;

  if (
    typeof original !== "object" || original === null ||
    typeof current !== "object" || current === null
  ) {
    diffs.push({ path: prefix, oldVal: original, newVal: current });
    return diffs;
  }

  const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(current)]));
  for (const key of allKeys) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (!(key in original)) {
      diffs.push({ path: newPrefix, oldVal: undefined, newVal: current[key] });
    } else if (!(key in current)) {
      diffs.push({ path: newPrefix, oldVal: original[key], newVal: undefined });
    } else if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
      if (typeof original[key] === "object" && original[key] !== null && typeof current[key] === "object" && current[key] !== null && !Array.isArray(original[key]) && !Array.isArray(current[key])) {
        diffs.push(...findDiffs(original[key], current[key], newPrefix));
      } else {
        diffs.push({ path: newPrefix, oldVal: original[key], newVal: current[key] });
      }
    }
  }
  return diffs;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [initialContent, setInitialContent] = useState<any>(contentData);
  const [content, setContent] = useState<any>(contentData);
  const [adminSecret, setAdminSecretState] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeBranch, setActiveBranch] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname.toLowerCase();
      if (h === "gliattomatti.ch" || h === "www.gliattomatti.ch" || h.endsWith(".gliattomatti.ch")) {
        return "main";
      }
    }
    return "dev";
  });
  const [recoverableDraft, setRecoverableDraft] = useState<RecoverableDraft | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);

  // Load saved secret from sessionStorage / localStorage
  useEffect(() => {
    try {
      const savedSecret = sessionStorage.getItem("attomatti_admin_secret") || localStorage.getItem("attomatti_admin_secret");
      if (savedSecret) {
        setAdminSecretState(savedSecret);
      }
    } catch (e) {
      console.warn("Storage access error:", e);
    }
  }, []);

  const setAdminSecret = (secret: string) => {
    setAdminSecretState(secret);
    try {
      if (secret) {
        sessionStorage.setItem("attomatti_admin_secret", secret);
        // Clean up from persistent localStorage to prevent long-term credential leakage
        localStorage.removeItem("attomatti_admin_secret");
      } else {
        sessionStorage.removeItem("attomatti_admin_secret");
        localStorage.removeItem("attomatti_admin_secret");
      }
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  };

  // Fetch live content from API on mount + check for recoverable draft in localStorage
  useEffect(() => {
    async function fetchLiveContent() {
      try {
        const res = await fetch("/api/content");
        const branchHeader = res.headers.get("x-git-branch");
        if (branchHeader) {
          setActiveBranch(branchHeader);
        }
        let liveData = contentData;
        if (res.ok) {
          liveData = await res.json();
          setInitialContent(JSON.parse(JSON.stringify(liveData)));
          setContent(JSON.parse(JSON.stringify(liveData)));
        }

        // Check if there is an unsaved draft stored in localStorage
        try {
          const storedDraftRaw = localStorage.getItem("attomatti_admin_draft");
          if (storedDraftRaw) {
            const draft = JSON.parse(storedDraftRaw);
            if (draft && draft.content) {
              const diffs = findDiffs(liveData, draft.content);
              if (diffs.length > 0) {
                setRecoverableDraft({
                  timestamp: draft.timestamp || Date.now(),
                  dateStr: new Date(draft.timestamp || Date.now()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  }),
                  diffCount: diffs.length,
                  content: draft.content
                });
              } else {
                localStorage.removeItem("attomatti_admin_draft");
              }
            }
          }
        } catch (storageErr) {
          console.warn("Draft restore check error:", storageErr);
        }
      } catch (err) {
        console.error("Failed to fetch live content, using local fallback", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLiveContent();
  }, []);

  const updateContent = useCallback((path: string, value: any) => {
    setContent((prevContent: any) => {
      const newContent = JSON.parse(JSON.stringify(prevContent));
      const keys = path.split(".");
      let current = newContent;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined || current[key] === null) {
          current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
        }
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;
      return newContent;
    });
  }, []);

  const diffList = useMemo(() => {
    return findDiffs(initialContent, content);
  }, [initialContent, content]);

  const hasUnsavedChanges = diffList.length > 0;

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        broadcastChannelRef.current = new BroadcastChannel("attomatti_preview_sync");
      }
    } catch {}

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  // Instantly broadcast content changes to all live preview consumers (tabs & iframes)
  useEffect(() => {
    if (isLoading || !content) return;
    try {
      localStorage.setItem("attomatti_preview_live_data", JSON.stringify(content));
    } catch {}
    try {
      broadcastChannelRef.current?.postMessage({ type: "ATTOMATTI_PREVIEW_SYNC", content });
    } catch {}
  }, [content, isLoading]);

  // Auto-save to localStorage whenever changes occur (debounced 1.5s)
  useEffect(() => {
    if (!isLoading && hasUnsavedChanges) {
      const timer = setTimeout(() => {
        try {
          const now = Date.now();
          localStorage.setItem(
            "attomatti_admin_draft",
            JSON.stringify({
              timestamp: now,
              content: content
            })
          );
          const timeStr = new Date(now).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
          setLastDraftSavedAt(timeStr);
        } catch (e) {
          console.warn("Auto-save draft error:", e);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [content, hasUnsavedChanges, isLoading]);

  // Guaranteed recurring auto-save interval every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        try {
          const now = Date.now();
          localStorage.setItem(
            "attomatti_admin_draft",
            JSON.stringify({
              timestamp: now,
              content: content
            })
          );
          const timeStr = new Date(now).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });
          setLastDraftSavedAt(timeStr);
        } catch (e) {
          console.warn("Periodic draft save error:", e);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [content, hasUnsavedChanges]);

  // Draft recovery actions
  const restoreDraft = useCallback(() => {
    if (recoverableDraft) {
      setContent(recoverableDraft.content);
      setLastDraftSavedAt(recoverableDraft.dateStr);
      setRecoverableDraft(null);
    }
  }, [recoverableDraft]);

  const dismissDraft = useCallback(() => {
    try {
      localStorage.removeItem("attomatti_admin_draft");
    } catch (e) {
      console.warn("Dismiss draft storage error:", e);
    }
    setRecoverableDraft(null);
  }, []);

  const discardChanges = useCallback(() => {
    if (window.confirm("Sei sicuro di voler annullare tutte le modifiche non pubblicate?")) {
      setContent(JSON.parse(JSON.stringify(initialContent)));
      setPublishStatus(null);
      setLastDraftSavedAt(null);
      try {
        localStorage.removeItem("attomatti_admin_draft");
      } catch (e) {
        console.warn("Clear draft storage error:", e);
      }
    }
  }, [initialContent]);

  const handlePublish = useCallback(async () => {
    if (!adminSecret) {
      alert("Per favore, inserisci la Password di Amministrazione in alto a destra per procedere.");
      return;
    }

    setIsPublishing(true);
    setPublishStatus(null);

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify(content)
      });

      if (res.ok) {
        const data = await res.json();
        setInitialContent(JSON.parse(JSON.stringify(content)));
        if (data.branch) {
          setActiveBranch(data.branch);
        }
        // Successfully published: clear the local draft
        try {
          localStorage.removeItem("attomatti_admin_draft");
          setLastDraftSavedAt(null);
          setRecoverableDraft(null);
        } catch (e) {
          console.warn("Clear draft on publish error:", e);
        }

        setPublishStatus({
          type: "success",
          msg: "Sito e CMS aggiornati con successo su GitHub!",
          branch: data.branch,
          commitUrl: data.commitUrl,
          shortSha: data.shortSha
        });
      } else {
        const err = await res.json();
        const detail = err.error || "Pubblicazione fallita";
        setPublishStatus({ type: "error", msg: `Errore: ${detail}` });
      }
    } catch (e) {
      setPublishStatus({ type: "error", msg: `Errore di rete: ${(e as Error).message}` });
    } finally {
      setIsPublishing(false);
    }
  }, [adminSecret, content]);

  // Keyboard shortcut: Cmd+S / Ctrl+S to Publish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handlePublish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePublish]);

  return (
    <AdminContext.Provider
      value={{
        content,
        setContent,
        updateContent,
        adminSecret,
        setAdminSecret,
        isPublishing,
        publishStatus,
        setPublishStatus,
        handlePublish,
        diffList,
        hasUnsavedChanges,
        discardChanges,
        isLoading,
        activeBranch,
        recoverableDraft,
        restoreDraft,
        dismissDraft,
        lastDraftSavedAt
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
