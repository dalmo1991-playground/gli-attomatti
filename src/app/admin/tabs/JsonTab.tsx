"use client";

import React, { useState, useEffect, useRef } from "react";
import { Code, Download, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";

export function JsonTab() {
  const { content, setContent } = useAdmin();
  const [jsonText, setJsonText] = useState(() => JSON.stringify(content, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(content, null, 2));
    setError(null);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setContent(parsed);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
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

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setContent(parsed);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const highlightJSON = (str: string) => {
    const escaped = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-emerald-400";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-indigo-400 font-bold";
          }
        } else if (/true|false/.test(match)) {
          cls = "text-purple-400";
        } else if (/null/.test(match)) {
          cls = "text-rose-400";
        } else {
          cls = "text-amber-400";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <AdminSection
        title="Sorgente JSON Raw"
        description="Visualizza e modifica direttamente l'albero dati JSON con validazione e formattazione istantanea."
        icon={Code}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-muted/40 hover:bg-muted/60 text-foreground/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-foreground/10"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Copiato" : "Copia"}
            </button>
            <button
              type="button"
              onClick={formatJson}
              className="px-3 py-1.5 bg-muted/40 hover:bg-muted/60 text-foreground/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-foreground/10"
            >
              <RefreshCw size={13} /> Formatta
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download size={13} /> Scarica Backup
            </button>
          </div>
        }
      >
        {error && (
          <div className="p-4 bg-rose-500/10 text-rose-400 font-bold rounded-2xl mb-4 text-xs border border-rose-500/20 flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>Errore di sintassi JSON: {error}</span>
          </div>
        )}

        <div className="relative bg-slate-950/80 rounded-3xl overflow-hidden shadow-2xl border border-foreground/10 h-[650px] group">
          <pre
            ref={preRef}
            className="absolute inset-0 p-6 m-0 font-mono text-xs leading-relaxed whitespace-pre overflow-hidden pointer-events-none"
            dangerouslySetInnerHTML={{ __html: highlightJSON(jsonText) }}
          />
          <textarea
            value={jsonText}
            onChange={handleChange}
            onScroll={handleScroll}
            spellCheck={false}
            className="absolute inset-0 w-full h-full p-6 font-mono text-xs leading-relaxed bg-transparent text-transparent caret-rose-400 outline-none resize-none whitespace-pre z-10 custom-scrollbar selection:bg-rose-500/20"
          />
        </div>
      </AdminSection>
    </div>
  );
}
