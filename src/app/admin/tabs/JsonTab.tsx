"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Code,
  Download,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Search,
  Replace,
  Maximize2,
  Minimize2,
  Sparkles,
  RefreshCw,
  FileJson,
  Hash,
  HelpCircle,
  X,
  BookOpen
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";

// Dynamically import Monaco Editor to ensure 100% client-side execution in Next.js
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[650px] bg-slate-950/90 rounded-3xl flex flex-col items-center justify-center text-foreground/40 gap-3">
      <RefreshCw size={28} className="animate-spin text-primary" />
      <span className="text-xs font-mono tracking-wider uppercase">Caricamento Editor VS Code...</span>
    </div>
  )
});

interface QuickSection {
  id: string;
  label: string;
  icon: string;
  pattern: string;
}

const QUICK_SECTIONS: QuickSection[] = [
  { id: "site", label: "Sito & SEO", icon: "🌐", pattern: '"site":' },
  { id: "navigation", label: "Menu Navigazione", icon: "🧭", pattern: '"navigation":' },
  { id: "home", label: "Home Page", icon: "🏠", pattern: '"home":' },
  { id: "spettacoli", label: "Spettacoli", icon: "🎭", pattern: '"spettacoli":' },
  { id: "iniziative", label: "Iniziative & Cineforum", icon: "💡", pattern: '"iniziative":' },
  { id: "attori", label: "Attori & Cast", icon: "👥", pattern: '"attori":' },
  { id: "locations", label: "Locations", icon: "📍", pattern: '"locations":' },
  { id: "ui", label: "Interfaccia UI", icon: "🎨", pattern: '"ui":' }
];

interface JsonTabProps {
  onNavigateTab?: (tab: string) => void;
}

export function JsonTab({ onNavigateTab }: JsonTabProps = {}) {
  const { content, setContent } = useAdmin();
  const [jsonText, setJsonText] = useState(() => JSON.stringify(content, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [lineCount, setLineCount] = useState(0);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync from AdminContext content if modified externally (and different from current editor)
  useEffect(() => {
    try {
      const currentParsed = JSON.parse(jsonText);
      if (JSON.stringify(currentParsed) !== JSON.stringify(content)) {
        const formatted = JSON.stringify(content, null, 2);
        setJsonText(formatted);
        setLineCount(formatted.split("\n").length);
        setError(null);
      }
    } catch {
      // If current text has a temporary syntax error, do not overwrite while user is editing
    }
  }, [content]);

  useEffect(() => {
    setLineCount(jsonText.split("\n").length);
  }, [jsonText]);

  // Handle editor mount and define custom theatrical theme
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom VS Code dark theme for Gli Attomatti
    monaco.editor.defineTheme("attomatti-theatre-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "string.key.json", foreground: "818cf8", fontStyle: "bold" },
        { token: "string.value.json", foreground: "34d399" },
        { token: "number", foreground: "fbbf24" },
        { token: "keyword.json", foreground: "c084fc" },
        { token: "null.json", foreground: "fb7185" },
        { token: "delimiter", foreground: "64748b" }
      ],
      colors: {
        "editor.background": "#0b1120",
        "editor.foreground": "#f8fafc",
        "editor.lineHighlightBackground": "#1e293b33",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#fb7185",
        "editorGutter.background": "#0b1120",
        "editorCursor.foreground": "#fb7185",
        "editor.selectionBackground": "#fb718533",
        "editor.inactiveSelectionBackground": "#fb71851a",
        "editorFindWidget.background": "#0f172a",
        "editorFindWidget.border": "#fb718599",
        "editorWidget.background": "#0f172a",
        "editorWidget.border": "#334155"
      }
    });

    monaco.editor.setTheme("attomatti-theatre-dark");

    // Add Escape shortcut to exit fullscreen if active
    editor.addCommand(monaco.KeyCode.Escape, () => {
      setIsFullscreen((prev) => (prev ? false : prev));
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    setJsonText(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const parsed = JSON.parse(val);
        setContent(parsed);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Errore di sintassi JSON");
      }
    }, 400);
  };

  // Actions
  const triggerFind = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.getAction("actions.find")?.run();
    }
  }, []);

  const triggerReplace = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.getAction("editor.action.startFindReplaceAction")?.run();
    }
  }, []);

  const triggerFormat = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    } else {
      try {
        const parsed = JSON.parse(jsonText);
        const formatted = JSON.stringify(parsed, null, 2);
        setJsonText(formatted);
        setContent(parsed);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }
  }, [jsonText, setContent]);

  const triggerGoToLine = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.getAction("editor.action.gotoLine")?.run();
    }
  }, []);

  const jumpToSection = (pattern: string) => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const matches = model.findMatches(pattern, false, false, false, null, true);
    if (matches.length > 0) {
      const range = matches[0].range;
      editor.revealRangeInCenter(range, monacoRef.current.editor.ScrollType.Smooth);
      editor.setSelection(range);
      editor.focus();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonText);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `content-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const editorOptions = {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "var(--font-mono, 'JetBrains Mono', Menlo, Monaco, Consolas, monospace)",
    fontLigatures: true,
    minimap: {
      enabled: true,
      maxColumn: 90,
      renderCharacters: false,
      showSlider: "always" as const
    },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth" as const,
    cursorSmoothCaretAnimation: "on" as const,
    bracketPairColorization: {
      enabled: true
    },
    formatOnPaste: true,
    tabSize: 2,
    wordWrap: "off" as const,
    automaticLayout: true,
    lineNumbersMinChars: 4,
    folding: true,
    renderLineHighlight: "all" as const,
    find: {
      addExtraSpaceOnTop: true,
      autoFindInSelection: "never" as const,
      seedSearchStringFromSelection: "always" as const
    }
  };

  const editorContent = (
    <div className="flex flex-col h-full space-y-3">
      {/* Quick Section Jump Breadcrumb Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/40 shrink-0 mr-1 flex items-center gap-1">
          <Hash size={12} /> Salta a sezione:
        </span>
        {QUICK_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => jumpToSection(sec.pattern)}
            className="px-2.5 py-1 rounded-xl bg-muted/30 hover:bg-muted/60 text-foreground/80 hover:text-foreground text-[11px] font-semibold border border-foreground/5 transition-all shrink-0 flex items-center gap-1.5 hover:border-primary/40 active:scale-95"
          >
            <span>{sec.icon}</span>
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* Editor Main Container */}
      <div className="relative flex-1 bg-[#0b1120] rounded-3xl overflow-hidden shadow-2xl border border-foreground/10 flex flex-col min-h-[550px]">
        {/* Editor Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/80 border-b border-foreground/5 text-xs">
          {/* Left Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={triggerFind}
              title="Trova nel JSON (Ctrl+F / Cmd+F)"
              className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-primary/20 hover:text-primary text-foreground/80 font-bold transition-all flex items-center gap-1.5 border border-foreground/5"
            >
              <Search size={13} className="text-primary" />
              <span>Trova (Ctrl+F)</span>
            </button>
            <button
              type="button"
              onClick={triggerReplace}
              title="Sostituisci nel JSON (Ctrl+H / Cmd+H)"
              className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-secondary/20 hover:text-secondary text-foreground/80 font-bold transition-all flex items-center gap-1.5 border border-foreground/5"
            >
              <Replace size={13} className="text-secondary" />
              <span>Sostituisci</span>
            </button>
            <button
              type="button"
              onClick={triggerFormat}
              title="Formatta e indenta (Shift+Alt+F)"
              className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-accent/20 hover:text-accent text-foreground/80 font-bold transition-all flex items-center gap-1.5 border border-foreground/5"
            >
              <Sparkles size={13} className="text-accent" />
              <span>Formatta</span>
            </button>
            <button
              type="button"
              onClick={triggerGoToLine}
              title="Vai a riga (Ctrl+G / Cmd+G)"
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-xl bg-muted/30 hover:bg-muted/50 text-foreground/60 hover:text-foreground font-semibold transition-all items-center gap-1"
            >
              <Hash size={12} />
              <span>Vai a Riga</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              title="Scorciatoie da tastiera VS Code"
              className="p-1.5 rounded-xl bg-muted/30 hover:bg-muted/60 text-foreground/60 hover:text-foreground transition-all"
            >
              <HelpCircle size={15} />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/60 text-foreground/80 font-bold transition-all flex items-center gap-1.5 border border-foreground/5"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "Copiato" : "Copia"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Esci da Schermo Intero (Esc)" : "Schermo Intero"}
              className="px-3 py-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary font-bold transition-all flex items-center gap-1.5 border border-primary/20"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isFullscreen ? "Riduci" : "Schermo Intero"}</span>
            </button>
          </div>
        </div>

        {/* Live Syntax Alert if error */}
        {error && (
          <div className="px-5 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-1">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span className="truncate">Errore di sintassi JSON: {error}</span>
          </div>
        )}

        {/* Monaco Editor Surface */}
        <div className="flex-1 w-full min-h-[500px]">
          <Editor
            height="100%"
            defaultLanguage="json"
            language="json"
            value={jsonText}
            theme="attomatti-theatre-dark"
            options={editorOptions}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
          />
        </div>

        {/* VS Code Style Status Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950 border-t border-foreground/5 text-[11px] font-mono text-foreground/60 select-none">
          <div className="flex items-center gap-4">
            {error ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <AlertCircle size={12} />
                <span>JSON Non Valido</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 size={12} />
                <span>JSON Valido</span>
              </span>
            )}
            <span className="text-foreground/40 hidden sm:inline">•</span>
            <span className="hidden sm:inline">{lineCount.toLocaleString()} righe</span>
            <span className="text-foreground/40 hidden sm:inline">•</span>
            <span className="hidden sm:inline">{(new TextEncoder().encode(jsonText).length / 1024).toFixed(1)} KB</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Spazi: 2</span>
            <span className="text-foreground/40">•</span>
            <span>UTF-8</span>
            <span className="text-foreground/40">•</span>
            <span className="text-primary font-bold">JSON</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <AdminSection
        title="Editor JSON (VS Code Powered)"
        description="Editor completo potenziato da Monaco con ricerca avanzata (Ctrl+F), sostituzione, minimappa e navigazione rapida per sezioni."
        icon={Code}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerFormat}
              className="px-3 py-1.5 bg-muted/40 hover:bg-muted/60 text-foreground/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-foreground/10"
            >
              <Sparkles size={13} className="text-accent" />
              <span>Formatta</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Scarica Backup</span>
            </button>
          </div>
        }
      >
        {/* Guida Rapida Tip Banner */}
        <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-foreground/80">
            <BookOpen size={16} className="text-primary shrink-0" />
            <span>
              <strong>Hai dubbi sul JSON?</strong> Ricorda di non lasciare virgole sull&apos;ultimo elemento e usa <code className="bg-background px-1.5 py-0.5 rounded font-mono font-bold text-amber-300">null</code> per nascondere del tutto i blocchi.
            </span>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab("guida")}
              className="text-primary font-bold hover:underline shrink-0 flex items-center gap-1"
            >
              <span>Leggi la Guida al JSON →</span>
            </button>
          )}
        </div>

        {/* Normal In-Page View */}
        <div className="h-[750px]">{editorContent}</div>
      </AdminSection>

      {/* Fullscreen Overlay Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[120] bg-background/95 backdrop-blur-2xl p-4 sm:p-6 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-foreground/10 mb-3">
            <div className="flex items-center gap-2">
              <FileJson className="text-primary" size={20} />
              <h3 className="font-black text-sm uppercase tracking-wider text-foreground">
                Editor JSON a Schermo Intero
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground/80 text-xs font-bold transition-all flex items-center gap-1.5 border border-foreground/10"
            >
              <Minimize2 size={14} /> Esci da Schermo Intero (Esc)
            </button>
          </div>
          <div className="flex-1 min-h-0">{editorContent}</div>
        </div>
      )}

      {/* Shortcuts Helper Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-foreground/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-foreground">
                <HelpCircle size={18} className="text-primary" />
                <span>Scorciatoie da Tastiera</span>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-foreground/5">
                <span className="text-foreground/70">Trova / Cerca</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-primary">Ctrl + F</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-foreground/5">
                <span className="text-foreground/70">Trova e Sostituisci</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-secondary">Ctrl + H</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-foreground/5">
                <span className="text-foreground/70">Formatta Documento</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-accent">Shift + Alt + F</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-foreground/5">
                <span className="text-foreground/70">Vai a Riga</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-foreground">Ctrl + G</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-foreground/5">
                <span className="text-foreground/70">Tavolozza Comandi VS Code</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-foreground">F1</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-foreground/5">
                <span className="text-foreground/70">Chiudi Schermo Intero / Modale</span>
                <kbd className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-foreground">Esc</kbd>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-foreground/40 text-center">
              Tutte le scorciatoie e funzionalità native di VS Code sono supportate.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
