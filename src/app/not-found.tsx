import Link from "next/link";
import { Home, Theater } from "lucide-react";
import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { FormattedText } from "@/components/ui/FormattedText";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const ui = content?.ui?.not_found || {};
  return {
    title: ui.meta_title || "Pagina non trovata",
    description: ui.meta_description || "La pagina cercata non è stata trovata o è stata spostata.",
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function NotFound() {
  const content = await getContent();
  const ui = content?.ui?.not_found || {};

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
          <Theater size={14} />
          <span>{ui.badge || "Errore 404 • Fuori Scena"}</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {ui.code || "404"}
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {ui.heading || "Questa scena è ancora dietro le quinte"}
          </h2>
          <p className="text-foreground/70 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            <FormattedText text={ui.message || "Sembra che il copione abbia preso un’altra direzione o che la pagina cercata sia stata spostata nel foyer."} />
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home size={18} />
            <span>{ui.home_button || "Torna alla Home"}</span>
          </Link>
          <Link
            href="/Spettacoli"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold glass hover:bg-white/10 text-foreground transition-all border border-foreground/10 hover:-translate-y-0.5"
          >
            <Theater size={18} />
            <span>{ui.shows_button || "I Nostri Spettacoli"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
