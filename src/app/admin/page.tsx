"use client";

import { useState, useEffect, createContext, useContext, useRef } from "react";
import contentData from "@/data/content.json";
import { 
  Save, Download, Plus, Trash2, Globe, Menu as MenuIcon, Home as HomeIcon, 
  Users, Newspaper, Theater, Mail, Settings, Image as ImageIcon, 
  Calendar, ExternalLink, ChevronDown, ChevronUp, Link as LinkIcon, Info, Upload, Code
} from "lucide-react";
import { cn } from "@/lib/utils";

const AdminContext = createContext({ adminSecret: "" });

export default function AdminConsole() {
  const [content, setContent] = useState(contentData);
  const [activeTab, setActiveTab] = useState("site");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchLiveContent() {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const liveData = await res.json();
          setContent(liveData);
        }
      } catch (err) {
        console.error("Failed to fetch live content, using local fallback", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLiveContent();
  }, []);

  const updateContent = (path: string, value: any) => {
    const newContent = JSON.parse(JSON.stringify(content));
    const keys = path.split('.');
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setContent(newContent);
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [publishStatus, setPublishStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handlePublish = async () => {
    if (!adminSecret) {
      alert("Per favore, inserisci la Password di Amministrazione.");
      return;
    }

    setIsPublishing(true);
    setPublishStatus(null);

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret
        },
        body: JSON.stringify(content)
      });

      if (res.ok) {
        setPublishStatus({ type: 'success', msg: 'Sito aggiornato con successo!' });
      } else {
        const err = await res.json();
        const detail = err.error || 'Invio fallito';
        setPublishStatus({ type: 'error', msg: `ERRORE: ${detail}` });
        console.error("Publish Error Details:", err);
      }
    } catch (e) {
      setPublishStatus({ type: 'error', msg: `Errore di connessione: ${(e as Error).message}` });
      console.error("Publish Connection Error:", e);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "site", label: "Sito & Meta", icon: Globe },
    { id: "navigation", label: "Menu", icon: MenuIcon },
    { id: "home", label: "Home Page", icon: HomeIcon },
    { id: "chi_siamo", label: "Chi Siamo", icon: Users },
    { id: "attori", label: "Cast & Staff", icon: Users },
    { id: "spettacoli", label: "Spettacoli", icon: Theater },
    { id: "parlano_di_noi", label: "Dicono di noi", icon: Newspaper },
    { id: "contatti", label: "Contatti", icon: Mail },
    { id: "json", label: "Sorgente JSON", icon: Code },
  ];

  return (
    <AdminContext.Provider value={{ adminSecret }}>
    <div className="min-h-screen bg-muted/30 flex font-sans selection:bg-primary/20 selection:text-primary">
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sincronizzazione Live...</div>
        </div>
      )}
      {/* Sidebar */}
      <aside className={cn(
        "bg-background border-r border-foreground/5 transition-all duration-300 fixed h-full z-50 shadow-2xl flex flex-col",
        isSidebarOpen ? "w-80" : "w-24"
      )}>
        {/* Top: Brand */}
        <div className="p-8 flex items-center justify-between shrink-0">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">A</div>
              <span className="font-black uppercase tracking-tighter text-2xl">Admin</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <MenuIcon size={20} />
          </button>
        </div>

        {/* Middle: Navigation (Scrollable) */}
        <nav className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          {tabs.map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all group",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-xl shadow-primary/20" 
                  : "text-foreground/50 hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon size={20} className={cn(activeTab === tab.id ? "scale-110" : "group-hover:scale-110 transition-transform")} />
              {isSidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom: Actions (Fixed at bottom of sidebar) */}
        <div className="p-6 space-y-4 border-t border-foreground/5 bg-background shrink-0">
          {isSidebarOpen && (
            <div className="p-4 bg-muted/20 rounded-3xl border border-foreground/5 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Password Admin</label>
              <input 
                type="password" 
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-foreground/5 rounded-xl p-2 text-sm focus:border-primary outline-none transition-all"
              />
              <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className={cn(
                  "w-full flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/10",
                  isPublishing ? "bg-muted text-foreground/40" : "bg-primary text-white hover:scale-[1.02]"
                )}
              >
                {isPublishing ? "Pubblicazione..." : "Pubblica sul Sito"}
              </button>

              <button 
                onClick={handleDownloadJson}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-muted/30 text-foreground/60 hover:bg-muted hover:text-foreground border border-foreground/5"
              >
                <Download size={14} />
                Scarica Backup JSON
              </button>

              {publishStatus && (
                <div className={cn(
                  "p-4 rounded-2xl text-xs font-bold text-center animate-in fade-in zoom-in duration-300 break-words",
                  publishStatus.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}>
                  {publishStatus.msg}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen",
        isSidebarOpen ? "ml-80" : "ml-24"
      )}>
        <div className="p-16 max-w-6xl mx-auto">
          <header className="mb-16 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Live Editor
              </div>
              <h1 className="text-6xl font-black uppercase tracking-tight mb-3">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-xl text-foreground/40 font-medium max-w-2xl">Gestisci ogni dettaglio della sezione {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}.</p>
            </div>
          </header>

          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {activeTab === "site" && <SiteSettings content={content} updateContent={updateContent} />}
            {activeTab === "navigation" && <NavigationSettings content={content} setContent={setContent} />}
            {activeTab === "home" && <HomeSettings content={content} updateContent={updateContent} />}
            {activeTab === "chi_siamo" && <ChiSiamoSettings content={content} updateContent={updateContent} />}
            {activeTab === "attori" && <AttoriSettings content={content} updateContent={updateContent} />}
            {activeTab === "spettacoli" && <SpettacoliSettings content={content} updateContent={updateContent} />}
            {activeTab === "parlano_di_noi" && <PressSettings content={content} updateContent={updateContent} />}
            {activeTab === "contatti" && <ContactSettings content={content} updateContent={updateContent} />}
            {activeTab === "json" && <JsonSettings content={content} setContent={setContent} />}
          </div>
          
          <div className="mt-24 pt-12 border-t border-foreground/5 text-center text-foreground/20 font-bold uppercase tracking-widest text-xs">
            Gli Attomatti Dashboard © {new Date().getFullYear()}
          </div>
        </div>
      </main>
    </div>
    </AdminContext.Provider>
  );
}

// --- REUSABLE COMPONENTS ---

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
  const { adminSecret } = useContext(AdminContext);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!adminSecret) {
      alert("Per favore, inserisci la Password di Amministrazione prima di caricare immagini.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-secret": adminSecret
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        const err = await res.json();
        alert(`ERRORE DI CARICAMENTO:\n${err.error || 'Errore sconosciuto'}`);
        console.error("Upload error details:", err);
      }
    } catch (err) {
      alert(`Errore di connessione durante il caricamento:\n${(err as Error).message}`);
      console.error("Upload connection error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3 w-full">
      <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground/30 flex items-center gap-2">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea 
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-5 rounded-3xl bg-background border border-foreground/5 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-lg min-h-[160px] resize-none"
        />
      ) : type === "image" ? (
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            value={value || ""} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 p-5 rounded-full bg-background border border-foreground/5 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-lg"
          />
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Carica Immagine"
            className="h-[68px] w-[68px] shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-all shadow-sm disabled:opacity-50"
          >
            {isUploading ? <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <Upload size={24} />}
          </button>
        </div>
      ) : (
        <input 
          type={type} 
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-5 rounded-full bg-background border border-foreground/5 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-lg"
        />
      )}
    </div>
  );
}

function SectionCard({ title, children, icon: Icon, description }: { title: string, children: React.ReactNode, icon?: any, description?: string }) {
  return (
    <div className="group relative p-12 bg-background rounded-[3.5rem] border border-foreground/5 shadow-sm hover:shadow-2xl hover:border-primary/10 transition-all duration-500 overflow-hidden">
      {Icon && <Icon className="absolute top-12 right-12 text-foreground/[0.03] group-hover:text-primary/5 transition-colors duration-500" size={120} />}
      <div className="relative z-10 space-y-10">
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tight mb-2">{title}</h3>
          {description && <p className="text-foreground/40 font-bold text-sm uppercase tracking-wider">{description}</p>}
        </div>
        <div className="space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function ArrayEditor({ label, items, onAdd, onRemove, onMove, renderItem }: { label: string, items: any[], onAdd: () => void, onRemove: (idx: number) => void, onMove: (idx: number, dir: -1 | 1) => void, renderItem: (item: any, idx: number) => React.ReactNode }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-foreground/5 pb-4">
        <h4 className="text-sm font-black uppercase tracking-widest text-foreground/40">{label}</h4>
        <button onClick={onAdd} className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/5 px-4 py-2 rounded-full transition-all">
          <Plus size={16} /> Aggiungi
        </button>
      </div>
      <div className="space-y-12">
        {items?.map((item: any, idx: number) => (
          <div key={idx} className="relative pl-12 border-l-2 border-foreground/5">
            {/* Control Sidebar for Item */}
            <div className="absolute -left-[1.35rem] top-0 flex flex-col gap-1 items-center">
              <button 
                onClick={() => onRemove(idx)} 
                className="w-7 h-7 bg-white border border-foreground/10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm mb-2"
                title="Elimina"
              >
                <Trash2 size={12} />
              </button>
              <button 
                disabled={idx === 0}
                onClick={() => onMove(idx, -1)} 
                className="w-7 h-7 bg-white border border-foreground/10 rounded-full flex items-center justify-center text-foreground/40 hover:text-primary disabled:opacity-0 transition-all shadow-sm"
                title="Muovi Su"
              >
                <ChevronUp size={16} />
              </button>
              <button 
                disabled={idx === items.length - 1}
                onClick={() => onMove(idx, 1)} 
                className="w-7 h-7 bg-white border border-foreground/10 rounded-full flex items-center justify-center text-foreground/40 hover:text-primary disabled:opacity-0 transition-all shadow-sm"
                title="Muovi Giù"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            {renderItem(item, idx)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageListEditor({ images, onChange }: { images: any[], onChange: (newImages: any[]) => void }) {
  const moveItem = (idx: number, dir: number) => {
    const newList = [...images];
    const targetIdx = idx + dir;
    [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
    onChange(newList);
  };

  return (
    <ArrayEditor 
      label="Galleria Immagini"
      items={images || []}
      onAdd={() => onChange([...(images || []), { url: "/images/show1.png", alt: "Nuova Immagine" }])}
      onRemove={(idx) => onChange(images.filter((_, i) => i !== idx))}
      onMove={moveItem}
      renderItem={(img, idx) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field type="image" label="URL Immagine" value={img.url} onChange={(v) => {
            const newList = [...images];
            newList[idx].url = v;
            onChange(newList);
          }} />
          <Field label="Testo Alternativo (SEO)" value={img.alt} onChange={(v) => {
            const newList = [...images];
            newList[idx].alt = v;
            onChange(newList);
          }} />
        </div>
      )}
    />
  );
}

function CtaEditor({ cta, label, onUpdate }: { cta: any, label: string, onUpdate: (newCta: any) => void }) {
  if (!cta) return null;
  return (
    <div className="p-8 bg-muted/10 rounded-[2.5rem] space-y-6">
      <h4 className="text-xs font-black uppercase tracking-widest opacity-40">{label}</h4>
      <Field label="Titolo CTA" value={cta.title} onChange={(v) => onUpdate({ ...cta, title: v })} />
      <Field label="Testo CTA" value={cta.text} onChange={(v) => onUpdate({ ...cta, text: v })} type="textarea" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Testo Bottone" value={cta.cta_label} onChange={(v) => onUpdate({ ...cta, cta_label: v })} />
        <Field label="Link Bottone" value={cta.cta_href} onChange={(v) => onUpdate({ ...cta, cta_href: v })} />
      </div>
    </div>
  );
}

// --- SECTIONS ---

function SiteSettings({ content, updateContent }: any) {
  return (
    <SectionCard title="Identità del Sito" icon={Settings} description="Informazioni globali e metadati">
      <Field label="Nome del Teatro" value={content.site.name} onChange={(v) => updateContent('site.name', v)} />
      <Field label="Descrizione SEO (Meta)" value={content.site.description} onChange={(v) => updateContent('site.description', v)} type="textarea" />
      <Field label="Lingua Principale" value={content.site.language} onChange={(v) => updateContent('site.language', v)} />
    </SectionCard>
  );
}

function NavigationSettings({ content, setContent }: any) {
  const updateLink = (idx: number, field: string, value: any) => {
    const newNav = [...content.navigation];
    newNav[idx][field] = value;
    setContent({ ...content, navigation: newNav });
  };

  const moveLink = (idx: number, dir: number) => {
    const newNav = [...content.navigation];
    const targetIdx = idx + dir;
    [newNav[idx], newNav[targetIdx]] = [newNav[targetIdx], newNav[idx]];
    setContent({ ...content, navigation: newNav });
  };

  const updateSublink = (linkIdx: number, subIdx: number, field: string, value: any) => {
    const newNav = [...content.navigation];
    newNav[linkIdx].sublinks[subIdx][field] = value;
    setContent({ ...content, navigation: newNav });
  };

  const moveSublink = (linkIdx: number, subIdx: number, dir: number) => {
    const newNav = [...content.navigation];
    const targetIdx = subIdx + dir;
    [newNav[linkIdx].sublinks[subIdx], newNav[linkIdx].sublinks[targetIdx]] = [newNav[linkIdx].sublinks[targetIdx], newNav[linkIdx].sublinks[subIdx]];
    setContent({ ...content, navigation: newNav });
  };

  return (
    <SectionCard title="Menu di Navigazione" icon={MenuIcon} description="Gestisci i link principali e i menu a tendina">
      <ArrayEditor 
        label="Link Principali"
        items={content.navigation}
        onAdd={() => setContent({ ...content, navigation: [...content.navigation, { label: "Nuovo Link", href: "/#" }] })}
        onRemove={(idx) => setContent({ ...content, navigation: content.navigation.filter((_: any, i: number) => i !== idx) })}
        onMove={moveLink}
        renderItem={(link, idx) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label={`Link ${idx + 1}: Etichetta`} value={link.label} onChange={(v) => updateLink(idx, 'label', v)} />
              <Field label={`Link ${idx + 1}: URL`} value={link.href} onChange={(v) => updateLink(idx, 'href', v)} />
            </div>
            <div className="pl-8 border-l border-primary/20 space-y-6">
              <ArrayEditor 
                label="Sottolink (Dropdown)"
                items={link.sublinks || []}
                onAdd={() => {
                  const newNav = [...content.navigation];
                  if (!newNav[idx].sublinks) newNav[idx].sublinks = [];
                  newNav[idx].sublinks.push({ label: "Nuovo Sottolink", href: "/#" });
                  setContent({ ...content, navigation: newNav });
                }}
                onRemove={(subIdx) => {
                  const newNav = [...content.navigation];
                  newNav[idx].sublinks = newNav[idx].sublinks.filter((_: any, i: number) => i !== subIdx);
                  setContent({ ...content, navigation: newNav });
                }}
                onMove={(subIdx, dir) => moveSublink(idx, subIdx, dir)}
                renderItem={(sub, sIdx) => (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Etichetta" value={sub.label} onChange={(v) => updateSublink(idx, sIdx, 'label', v)} />
                    <Field label="URL" value={sub.href} onChange={(v) => updateSublink(idx, sIdx, 'href', v)} />
                  </div>
                )}
              />
            </div>
          </div>
        )}
      />
    </SectionCard>
  );
}

function HomeSettings({ content, updateContent }: any) {
  const home = content.pages.home;
  
  return (
    <div className="space-y-12">
      <SectionCard title="Hero & Primo Piano" icon={HomeIcon}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Field label="Titolo Hero" value={home.hero.title} onChange={(v) => updateContent('pages.home.hero.title', v)} />
          <Field label="Sottotitolo Hero" value={home.hero.subtitle} onChange={(v) => updateContent('pages.home.hero.subtitle', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Testo Bottone Primario" value={home.hero.primary_cta_label} onChange={(v) => updateContent('pages.home.hero.primary_cta_label', v)} />
          <Field label="URL Bottone Primario" value={home.hero.primary_cta_href} onChange={(v) => updateContent('pages.home.hero.primary_cta_href', v)} />
          <Field label="Testo Bottone Secondario" value={home.hero.secondary_cta_label} onChange={(v) => updateContent('pages.home.hero.secondary_cta_label', v)} />
          <Field label="URL Bottone Secondario" value={home.hero.secondary_cta_href} onChange={(v) => updateContent('pages.home.hero.secondary_cta_href', v)} />
        </div>
      </SectionCard>

      <SectionCard title="Spettacoli in Home (Carousel)">
        <ArrayEditor 
          label="Card Spettacoli"
          items={home.upcoming_shows}
          onAdd={() => updateContent('pages.home.upcoming_shows', [...home.upcoming_shows, { active: true, title: "Nuovo Show", presenter: "", tagline: "", date: "", location: "", cta: "Biglietti", cta_href: "", secondary_cta: "", secondary_cta_href: "", image: "/images/show1.png" }])}
          onRemove={(idx) => updateContent('pages.home.upcoming_shows', home.upcoming_shows.filter((_: any, i: number) => i !== idx))}
          onMove={(idx, dir) => {
            const newList = [...home.upcoming_shows];
            const targetIdx = idx + dir;
            [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
            updateContent('pages.home.upcoming_shows', newList);
          }}
          renderItem={(show, idx) => (
            <div className="p-8 bg-muted/5 rounded-[2.5rem] border border-foreground/5 space-y-6">
              <div className="flex justify-between">
                <Field label="Titolo Spettacolo" value={show.title} onChange={(v) => {
                  const newList = [...home.upcoming_shows];
                  newList[idx].title = v;
                  updateContent('pages.home.upcoming_shows', newList);
                }} />
                <div className="pt-8">
                  <label className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] opacity-40">
                    Attivo <input type="checkbox" checked={show.active} onChange={(e) => {
                      const newList = [...home.upcoming_shows];
                      newList[idx].active = e.target.checked;
                      updateContent('pages.home.upcoming_shows', newList);
                    }} className="accent-primary" />
                  </label>
                </div>
              </div>
              <Field label="Presenter" value={show.presenter} onChange={(v) => {
                const newList = [...home.upcoming_shows];
                newList[idx].presenter = v;
                updateContent('pages.home.upcoming_shows', newList);
              }} />
              <Field label="Tagline" value={show.tagline} onChange={(v) => {
                const newList = [...home.upcoming_shows];
                newList[idx].tagline = v;
                updateContent('pages.home.upcoming_shows', newList);
              }} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data" value={show.date} onChange={(v) => {
                  const newList = [...home.upcoming_shows];
                  newList[idx].date = v;
                  updateContent('pages.home.upcoming_shows', newList);
                }} />
                <Field label="Location" value={show.location} onChange={(v) => {
                  const newList = [...home.upcoming_shows];
                  newList[idx].location = v;
                  updateContent('pages.home.upcoming_shows', newList);
                }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Testo Bottone (Ticket)" value={show.cta} onChange={(v) => {
                  const newList = [...home.upcoming_shows];
                  newList[idx].cta = v;
                  updateContent('pages.home.upcoming_shows', newList);
                }} />
                <Field label="URL Bottone (Ticket)" value={show.cta_href} onChange={(v) => {
                  const newList = [...home.upcoming_shows];
                  newList[idx].cta_href = v;
                  updateContent('pages.home.upcoming_shows', newList);
                }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Testo 2° Bottone (Opzionale)" value={show.secondary_cta} onChange={(v) => {
                  const newList = [...home.upcoming_shows];
                  newList[idx].secondary_cta = v;
                  updateContent('pages.home.upcoming_shows', newList);
                }} />
                <Field label="URL 2° Bottone (Opzionale)" value={show.secondary_cta_href} onChange={(v) => {
                  const newList = [...home.upcoming_shows];
                  newList[idx].secondary_cta_href = v;
                  updateContent('pages.home.upcoming_shows', newList);
                }} />
              </div>
              <Field type="image" label="Percorso Immagine" value={show.image} onChange={(v) => {
                const newList = [...home.upcoming_shows];
                newList[idx].image = v;
                updateContent('pages.home.upcoming_shows', newList);
              }} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Introduzione & Backstage">
        <Field label="Titolo Sezione" value={home.introduction.title} onChange={(v) => updateContent('pages.home.introduction.title', v)} />
        <Field label="Testo Introduzione" value={home.introduction.text} onChange={(v) => updateContent('pages.home.introduction.text', v)} type="textarea" />
        <ImageListEditor images={home.introduction.images} onChange={(newImgs) => updateContent('pages.home.introduction.images', newImgs)} />
      </SectionCard>
    </div>
  );
}

function ChiSiamoSettings({ content, updateContent }: any) {
  const chi = content.pages.chi_siamo;
  return (
    <div className="space-y-12">
      <SectionCard title="Pagina Chi Siamo">
        <Field label="Titolo Pagina" value={chi.title} onChange={(v) => updateContent('pages.chi_siamo.title', v)} />
        <Field label="Descrizione" value={chi.description} onChange={(v) => updateContent('pages.chi_siamo.description', v)} type="textarea" />
        
        <ArrayEditor 
          label="Sezioni Contenuto"
          items={chi.content_sections}
          onAdd={() => updateContent('pages.chi_siamo.content_sections', [...chi.content_sections, { title: "Nuova Sezione", text: "" }])}
          onRemove={(idx) => updateContent('pages.chi_siamo.content_sections', chi.content_sections.filter((_: any, i: number) => i !== idx))}
          onMove={(idx, dir) => {
            const newList = [...chi.content_sections];
            const targetIdx = idx + dir;
            [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
            updateContent('pages.chi_siamo.content_sections', newList);
          }}
          renderItem={(section, idx) => (
            <div className="space-y-6">
              <Field label="Titolo Sezione" value={section.title} onChange={(v) => {
                const newList = [...chi.content_sections];
                newList[idx].title = v;
                updateContent('pages.chi_siamo.content_sections', newList);
              }} />
              <Field label="Testo" value={section.text} onChange={(v) => {
                const newList = [...chi.content_sections];
                newList[idx].text = v;
                updateContent('pages.chi_siamo.content_sections', newList);
              }} type="textarea" />
              <ImageListEditor images={section.images} onChange={(newImgs) => {
                const newList = [...chi.content_sections];
                newList[idx].images = newImgs;
                updateContent('pages.chi_siamo.content_sections', newList);
              }} />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Link di Navigazione Interna" description="Le card 'Le Persone' e 'Dicono di Noi'">
        <ArrayEditor 
          label="Card di Navigazione"
          items={chi.navigation_links}
          onAdd={() => updateContent('pages.chi_siamo.navigation_links', [...chi.navigation_links, { label: "Nuovo Link", href: "/#" }])}
          onRemove={(idx) => updateContent('pages.chi_siamo.navigation_links', chi.navigation_links.filter((_: any, i: number) => i !== idx))}
          onMove={(idx, dir) => {
            const newList = [...chi.navigation_links];
            const targetIdx = idx + dir;
            [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
            updateContent('pages.chi_siamo.navigation_links', newList);
          }}
          renderItem={(link, idx) => (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Etichetta" value={link.label} onChange={(v) => {
                const newList = [...chi.navigation_links];
                newList[idx].label = v;
                updateContent('pages.chi_siamo.navigation_links', newList);
              }} />
              <Field label="URL" value={link.href} onChange={(v) => {
                const newList = [...chi.navigation_links];
                newList[idx].href = v;
                updateContent('pages.chi_siamo.navigation_links', newList);
              }} />
              <Field label="Icona (lucide name)" value={link.icon} onChange={(v) => {
                const newList = [...chi.navigation_links];
                newList[idx].icon = v;
                updateContent('pages.chi_siamo.navigation_links', newList);
              }} />
            </div>
          )}
        />
      </SectionCard>
    </div>
  );
}

function AttoriSettings({ content, updateContent }: any) {
  const attori = content.pages.attori;
  return (
    <div className="space-y-12">
      <SectionCard title="Staff & Cast">
        <Field label="Titolo Sezione" value={attori.title} onChange={(v) => updateContent('pages.attori.title', v)} />
        <ArrayEditor 
          label="Membri del Team"
          items={attori.list}
          onAdd={() => updateContent('pages.attori.list', [...attori.list, { name: "Nuovo Nome", role: "" }])}
          onRemove={(idx) => updateContent('pages.attori.list', attori.list.filter((_: any, i: number) => i !== idx))}
          onMove={(idx, dir) => {
            const newList = [...attori.list];
            const targetIdx = idx + dir;
            [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
            updateContent('pages.attori.list', newList);
          }}
          renderItem={(p, idx) => (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome" value={p.name} onChange={(v) => {
                const newList = [...attori.list];
                newList[idx].name = v;
                updateContent('pages.attori.list', newList);
              }} />
              <Field label="Ruolo" value={p.role} onChange={(v) => {
                const newList = [...attori.list];
                newList[idx].role = v;
                updateContent('pages.attori.list', newList);
              }} />
              <Field type="image" label="Immagine" value={p.image} onChange={(v) => {
                const newList = [...attori.list];
                newList[idx].image = v;
                updateContent('pages.attori.list', newList);
              }} />
              <Field label="Breve Bio" value={p.bio} onChange={(v) => {
                const newList = [...attori.list];
                newList[idx].bio = v;
                updateContent('pages.attori.list', newList);
              }} />
            </div>
          )}
        />
      </SectionCard>
      <CtaEditor 
        label="Call to Action: Unisciti a noi"
        cta={attori.join_us} 
        onUpdate={(newCta) => updateContent('pages.attori.join_us', newCta)} 
      />
    </div>
  );
}

function SpettacoliSettings({ content, updateContent }: any) {
  const spet = content.pages.spettacoli;
  return (
    <div className="space-y-12">
      <SectionCard title="Archivio Spettacoli">
        <Field label="Titolo Pagina" value={spet.title} onChange={(v) => updateContent('pages.spettacoli.title', v)} />
        <Field label="Descrizione" value={spet.description} onChange={(v) => updateContent('pages.spettacoli.description', v)} type="textarea" />
        
        <ArrayEditor 
          label="Produzioni"
          items={spet.archive_sections}
          onAdd={() => updateContent('pages.spettacoli.archive_sections', [...spet.archive_sections, { title: "Nuovo Spettacolo", slug: "nuovo-slug", year: new Date().getFullYear().toString(), short_description: "", text: "", dates: [], details: [], images: [] }])}
          onRemove={(idx) => updateContent('pages.spettacoli.archive_sections', spet.archive_sections.filter((_: any, i: number) => i !== idx))}
          onMove={(idx, dir) => {
            const newList = [...spet.archive_sections];
            const targetIdx = idx + dir;
            [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
            updateContent('pages.spettacoli.archive_sections', newList);
          }}
          renderItem={(s, idx) => (
            <div className="p-8 bg-muted/5 rounded-[2.5rem] border border-foreground/5 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Titolo" value={s.title} onChange={(v) => {
                  const newList = [...spet.archive_sections];
                  newList[idx].title = v;
                  updateContent('pages.spettacoli.archive_sections', newList);
                }} />
                <Field label="Slug (URL)" value={s.slug} onChange={(v) => {
                  const newList = [...spet.archive_sections];
                  newList[idx].slug = v;
                  updateContent('pages.spettacoli.archive_sections', newList);
                }} />
              </div>
              <Field label="Anno Produzione" value={s.year} onChange={(v) => {
                const newList = [...spet.archive_sections];
                newList[idx].year = v;
                updateContent('pages.spettacoli.archive_sections', newList);
              }} />
              <Field label="Breve Descrizione (Mostrata nell'elenco)" value={s.short_description} onChange={(v) => {
                const newList = [...spet.archive_sections];
                newList[idx].short_description = v;
                updateContent('pages.spettacoli.archive_sections', newList);
              }} type="textarea" />
              <Field label="Testo Descrittivo" value={s.text} onChange={(v) => {
                const newList = [...spet.archive_sections];
                newList[idx].text = v;
                updateContent('pages.spettacoli.archive_sections', newList);
              }} type="textarea" />
              
              <ImageListEditor images={s.images} onChange={(newImgs) => {
                const newList = [...spet.archive_sections];
                newList[idx].images = newImgs;
                updateContent('pages.spettacoli.archive_sections', newList);
              }} />

              <ArrayEditor 
                label="Date & Biglietti"
                items={s.dates || []}
                onAdd={() => {
                  const newList = [...spet.archive_sections];
                  newList[idx].dates.push({ date: "", location: "", ticket_label: "", ticket_href: "" });
                  updateContent('pages.spettacoli.archive_sections', newList);
                }}
                onRemove={(dIdx) => {
                  const newList = [...spet.archive_sections];
                  newList[idx].dates = newList[idx].dates.filter((_: any, i: number) => i !== dIdx);
                  updateContent('pages.spettacoli.archive_sections', newList);
                }}
                onMove={(dIdx, dir) => {
                  const newList = [...spet.archive_sections];
                  const targetIdx = dIdx + dir;
                  [newList[idx].dates[dIdx], newList[idx].dates[targetIdx]] = [newList[idx].dates[targetIdx], newList[idx].dates[dIdx]];
                  updateContent('pages.spettacoli.archive_sections', newList);
                }}
                renderItem={(d, dIdx) => (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Data & Ora" value={d.date} onChange={(v) => {
                      const newList = [...spet.archive_sections];
                      newList[idx].dates[dIdx].date = v;
                      updateContent('pages.spettacoli.archive_sections', newList);
                    }} />
                    <Field label="Luogo" value={d.location} onChange={(v) => {
                      const newList = [...spet.archive_sections];
                      newList[idx].dates[dIdx].location = v;
                      updateContent('pages.spettacoli.archive_sections', newList);
                    }} />
                    <Field label="Etichetta Bottone" value={d.ticket_label} onChange={(v) => {
                      const newList = [...spet.archive_sections];
                      newList[idx].dates[dIdx].ticket_label = v;
                      updateContent('pages.spettacoli.archive_sections', newList);
                    }} />
                    <Field label="URL Biglietti" value={d.ticket_href} onChange={(v) => {
                      const newList = [...spet.archive_sections];
                      newList[idx].dates[dIdx].ticket_href = v;
                      updateContent('pages.spettacoli.archive_sections', newList);
                    }} />
                  </div>
                )}
              />

              <ArrayEditor 
                label="Dettagli Tecnici (Regia, Cast, etc)"
                items={s.details || []}
                onAdd={() => {
                  const newList = [...spet.archive_sections];
                  newList[idx].details.push({ label: "Regia", value: "" });
                  updateContent('pages.spettacoli.archive_sections', newList);
                }}
                onRemove={(detIdx) => {
                  const newList = [...spet.archive_sections];
                  newList[idx].details = newList[idx].details.filter((_: any, i: number) => i !== detIdx);
                  updateContent('pages.spettacoli.archive_sections', newList);
                }}
                onMove={(detIdx, dir) => {
                  const newList = [...spet.archive_sections];
                  const targetIdx = detIdx + dir;
                  [newList[idx].details[detIdx], newList[idx].details[targetIdx]] = [newList[idx].details[targetIdx], newList[idx].details[detIdx]];
                  updateContent('pages.spettacoli.archive_sections', newList);
                }}
                renderItem={(det, detIdx) => (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Etichetta" value={det.label} onChange={(v) => {
                      const newList = [...spet.archive_sections];
                      newList[idx].details[detIdx].label = v;
                      updateContent('pages.spettacoli.archive_sections', newList);
                    }} />
                    <Field label="Valore" value={det.value} onChange={(v) => {
                      const newList = [...spet.archive_sections];
                      newList[idx].details[detIdx].value = v;
                      updateContent('pages.spettacoli.archive_sections', newList);
                    }} />
                  </div>
                )}
              />
            </div>
          )}
        />
      </SectionCard>
    </div>
  );
}

function PressSettings({ content, updateContent }: any) {
  const p = content.pages.parlano_di_noi;
  return (
    <div className="space-y-12">
      <SectionCard title="Dicono di Noi">
        <Field label="Titolo" value={p.title} onChange={(v) => updateContent('pages.parlano_di_noi.title', v)} />
        <Field label="Descrizione" value={p.description} onChange={(v) => updateContent('pages.parlano_di_noi.description', v)} type="textarea" />
        <ArrayEditor 
          label="Articoli & Recensioni"
          items={p.press}
          onAdd={() => updateContent('pages.parlano_di_noi.press', [...p.press, { source: "Nuova Fonte", quote: "Inserisci qui la citazione...", date: "2024", source_href: "", badge_label: "Recensione" }])}
          onRemove={(idx) => updateContent('pages.parlano_di_noi.press', p.press.filter((_: any, i: number) => i !== idx))}
          onMove={(idx, dir) => {
            const newList = [...p.press];
            const targetIdx = idx + dir;
            [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
            updateContent('pages.parlano_di_noi.press', newList);
          }}
          renderItem={(item, idx) => (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fonte" value={item.source} onChange={(v) => {
                  const newList = [...p.press];
                  newList[idx].source = v;
                  updateContent('pages.parlano_di_noi.press', newList);
                }} />
                <Field label="URL Articolo" value={item.source_href} onChange={(v) => {
                  const newList = [...p.press];
                  newList[idx].source_href = v;
                  updateContent('pages.parlano_di_noi.press', newList);
                }} />
              </div>
              <Field label="Citazione" value={item.quote} onChange={(v) => {
                const newList = [...p.press];
                newList[idx].quote = v;
                updateContent('pages.parlano_di_noi.press', newList);
              }} type="textarea" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Anno" value={item.date} onChange={(v) => {
                  const newList = [...p.press];
                  newList[idx].date = v;
                  updateContent('pages.parlano_di_noi.press', newList);
                }} />
                <Field label="Etichetta Badge" value={item.badge_label} onChange={(v) => {
                  const newList = [...p.press];
                  newList[idx].badge_label = v;
                  updateContent('pages.parlano_di_noi.press', newList);
                }} />
              </div>
            </div>
          )}
        />
      </SectionCard>
      <CtaEditor 
        label="Contatto Stampa"
        cta={p.press_contact} 
        onUpdate={(newCta) => updateContent('pages.parlano_di_noi.press_contact', newCta)} 
      />
    </div>
  );
}

function ContactSettings({ content, updateContent }: any) {
  const c = content.pages.contatti;
  return (
    <SectionCard title="Contatti & Social">
      <Field label="Titolo Pagina" value={c.title} onChange={(v) => updateContent('pages.contatti.title', v)} />
      <Field label="Descrizione" value={c.description} onChange={(v) => updateContent('pages.contatti.description', v)} type="textarea" />
      <Field label="Email di Contatto" value={c.email} onChange={(v) => updateContent('pages.contatti.email', v)} />
      <ArrayEditor 
        label="Profili Social"
        items={c.socials}
        onAdd={() => updateContent('pages.contatti.socials', [...c.socials, { platform: "New", href: "#", handle: "" }])}
        onRemove={(idx) => updateContent('pages.contatti.socials', c.socials.filter((_: any, i: number) => i !== idx))}
        onMove={(idx, dir) => {
          const newList = [...c.socials];
          const targetIdx = idx + dir;
          [newList[idx], newList[targetIdx]] = [newList[targetIdx], newList[idx]];
          updateContent('pages.contatti.socials', newList);
        }}
        renderItem={(s, idx) => (
          <div className="grid grid-cols-3 gap-4">
            <Field label="Piattaforma" value={s.platform} onChange={(v) => {
              const newList = [...c.socials];
              newList[idx].platform = v;
              updateContent('pages.contatti.socials', newList);
            }} />
            <Field label="Handle / Nome" value={s.handle} onChange={(v) => {
              const newList = [...c.socials];
              newList[idx].handle = v;
              updateContent('pages.contatti.socials', newList);
            }} />
            <Field label="URL" value={s.href} onChange={(v) => {
              const newList = [...c.socials];
              newList[idx].href = v;
              updateContent('pages.contatti.socials', newList);
            }} />
          </div>
        )}
      />
    </SectionCard>
  );
}

function JsonSettings({ content, setContent }: any) {
  const [jsonText, setJsonText] = useState(JSON.stringify(content, null, 2));
  const [error, setError] = useState<string | null>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(content, null, 2));
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setJsonText(newVal);
    try {
      const parsed = JSON.parse(newVal);
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
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "content.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const highlightJSON = (jsonString: string) => {
    const escaped = jsonString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-green-400';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-400 font-bold';
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400';
      } else if (/null/.test(match)) {
        cls = 'text-red-400';
      } else {
        cls = 'text-orange-400';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  return (
    <SectionCard title="Configurazione Raw" icon={Code} description="Modifica direttamente il JSON sorgente con validazione in tempo reale.">
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleDownload} 
          className="flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
        >
          <Download size={18} /> Scarica JSON
        </button>
      </div>
      
      {error && (
        <div className="p-5 bg-red-500/10 text-red-500 font-bold rounded-2xl mb-6 text-sm border border-red-500/20 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {error}
        </div>
      )}
      
      <div className="relative bg-gray-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-foreground/10 h-[700px] group">
        <pre 
          ref={preRef}
          className="absolute inset-0 p-8 m-0 font-mono text-[13px] leading-loose whitespace-pre overflow-hidden pointer-events-none"
          dangerouslySetInnerHTML={{ __html: highlightJSON(jsonText) }}
        />
        <textarea
          value={jsonText}
          onChange={handleChange}
          onScroll={handleScroll}
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-8 font-mono text-[13px] leading-loose bg-transparent text-transparent caret-white outline-none resize-none whitespace-pre z-10 custom-scrollbar"
        />
      </div>
    </SectionCard>
  );
}
