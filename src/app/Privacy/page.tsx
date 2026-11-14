import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/data";
import { FormattedText } from "@/components/ui/FormattedText";
import { ShieldCheck, Server, ExternalLink, Scale, BarChart3, Target, Ticket, Cookie, ClipboardList, Camera, Mail, Video, Database, FileCheck, Lock, Calendar } from "lucide-react";
import PrivacyConsentButton from "./PrivacyConsentButton";
import { LegalDocLayout } from "@/components/ui/LegalDocLayout";
import { getActiveIntegrationsState } from "@/lib/legalProviders";
import { PRIVACY_CONTENT } from "@/lib/legalContent";

export const metadata: Metadata = {
  title: PRIVACY_CONTENT.meta.title,
  description: PRIVACY_CONTENT.meta.description,
  alternates: {
    canonical: "/Privacy",
  },
};

interface LandingBlockShape {
  type?: string;
  tally_url?: string;
}

interface LandingPageShape {
  blocks?: LandingBlockShape[];
}

interface EmailTemplateShape {
  enabled?: boolean;
}

export default async function PrivacyPage() {
  const content = await getContent();
  const p = PRIVACY_CONTENT;
  const {
    isGaActive,
    isMetaActive,
    isYouTubeActive,
    isAnyTrackerActive,
  } = getActiveIntegrationsState(content);

  const isEventfrogActive = true;
  const isTallyActive = Boolean(
    content?.integrations?.tally?.enabled ||
      (content?.registration_pages && content.registration_pages.length > 0) ||
      (content?.landing_pages &&
        (content.landing_pages as LandingPageShape[]).some((lp) =>
          lp.blocks?.some((b) => b.type === "registrazione" || b.tally_url)
        ))
  );
  const isResendActive = Boolean(
    (content?.emails?.templates as EmailTemplateShape[] | undefined)?.some(
      (t) => t.enabled !== false
    ) || content?.emails?.settings?.from_email
  );

  const cookieRows = p.cookie_opt_in.rows;

  return (
    <LegalDocLayout
      badge={p.badge}
      title={p.title}
      description={p.description}
      lastUpdated={p.last_updated}
      backHref="/"
      backLabel={p.back_link}
    >
      <div className="space-y-6">
        {/* Titolare del trattamento */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.data_controller.title}
            </h2>
          </div>
          <div className="space-y-2 text-foreground/80 font-medium text-sm">
            <p className="font-bold text-foreground text-lg">{p.data_controller.name}</p>
            <p>{p.data_controller.address}</p>
            <p>
              <span>{p.data_controller.email_label} </span>
              <a
                href={`mailto:${p.data_controller.email}`}
                className="text-primary hover:underline"
              >
                {p.data_controller.email}
              </a>
            </p>
          </div>
        </div>

        {/* Trattamento generale dei dati */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Scale size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.general_processing.title}
            </h2>
          </div>
          <p className="text-foreground/80 leading-relaxed font-medium text-sm">
            <FormattedText text={p.general_processing.text} />
          </p>
        </div>

        {/* Periodi di conservazione dei dati */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <Database size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.retention.title}
            </h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
            {p.retention.paragraphs.map((para, idx) => (
              <p key={idx}>
                <FormattedText text={para} />
              </p>
            ))}
            {isGaActive && (
              <p>
                <FormattedText text={p.retention.ga_retention} />
              </p>
            )}
            {isMetaActive && (
              <p>
                <FormattedText text={p.retention.meta_retention} />
              </p>
            )}
          </div>
        </div>

        {/* Responsabili del trattamento (Data Processors) e DPA */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <FileCheck size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.data_processors.title}
            </h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
            {p.data_processors.paragraphs.map((para, idx) => (
              <p key={idx}>
                <FormattedText text={para} />
              </p>
            ))}
          </div>
        </div>

        {/* File di log del server */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <Server size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.server_logs.title}
            </h2>
          </div>
          <p className="text-foreground/80 leading-relaxed font-medium text-sm">
            <FormattedText text={p.server_logs.text} />
          </p>
        </div>

        {/* Area Riservata, Check-in e Archiviazione Vercel Blob */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.vercel_blob.title}
            </h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
            {p.vercel_blob.paragraphs.map((para, idx) => (
              <p key={idx}>
                <FormattedText text={para} />
              </p>
            ))}
          </div>
        </div>

        {/* Cookie, Local Storage e Servizi Incorporati (Dinamico) */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Cookie size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.cookie_opt_in.title}
            </h2>
          </div>

          <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
            <p>
              <FormattedText text={p.cookie_opt_in.intro_1} />
            </p>
            <p>
              <FormattedText text={p.cookie_opt_in.intro_2} />
            </p>

            {/* Tabella Cookie Attivi */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-foreground mb-3">
                {p.cookie_opt_in.table_heading}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-foreground/10 text-foreground/50 uppercase tracking-wider">
                      <th className="py-2.5 pr-4">{p.cookie_opt_in.columns.name}</th>
                      <th className="py-2.5 pr-4">{p.cookie_opt_in.columns.provider}</th>
                      <th className="py-2.5 pr-4">{p.cookie_opt_in.columns.duration}</th>
                      <th className="py-2.5">{p.cookie_opt_in.columns.purpose}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/5">
                    <tr>
                      <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                        {cookieRows.own_consent.name}
                      </td>
                      <td className="py-2.5 pr-4">{cookieRows.own_consent.provider}</td>
                      <td className="py-2.5 pr-4">{cookieRows.own_consent.duration}</td>
                      <td className="py-2.5 text-foreground/70">{cookieRows.own_consent.purpose}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                        {cookieRows.newsletter_popup.name}
                      </td>
                      <td className="py-2.5 pr-4">{cookieRows.newsletter_popup.provider}</td>
                      <td className="py-2.5 pr-4">{cookieRows.newsletter_popup.duration}</td>
                      <td className="py-2.5 text-foreground/70">{cookieRows.newsletter_popup.purpose}</td>
                    </tr>
                    {isEventfrogActive && (
                      <tr>
                        <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                          {cookieRows.eventfrog.name}
                        </td>
                        <td className="py-2.5 pr-4">{cookieRows.eventfrog.provider}</td>
                        <td className="py-2.5 pr-4">{cookieRows.eventfrog.duration}</td>
                        <td className="py-2.5 text-foreground/70">{cookieRows.eventfrog.purpose}</td>
                      </tr>
                    )}
                    {isTallyActive && (
                      <tr>
                        <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                          {cookieRows.tally.name}
                        </td>
                        <td className="py-2.5 pr-4">{cookieRows.tally.provider}</td>
                        <td className="py-2.5 pr-4">{cookieRows.tally.duration}</td>
                        <td className="py-2.5 text-foreground/70">{cookieRows.tally.purpose}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                        {cookieRows.recaptcha.name}
                      </td>
                      <td className="py-2.5 pr-4">{cookieRows.recaptcha.provider}</td>
                      <td className="py-2.5 pr-4">{cookieRows.recaptcha.duration}</td>
                      <td className="py-2.5 text-foreground/70">{cookieRows.recaptcha.purpose}</td>
                    </tr>
                    {isGaActive && (
                      <tr>
                        <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                          {cookieRows.google_analytics.name}
                        </td>
                        <td className="py-2.5 pr-4">{cookieRows.google_analytics.provider}</td>
                        <td className="py-2.5 pr-4">{cookieRows.google_analytics.duration}</td>
                        <td className="py-2.5 text-foreground/70">{cookieRows.google_analytics.purpose}</td>
                      </tr>
                    )}
                    {isMetaActive && (
                      <tr>
                        <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                          {cookieRows.meta_pixel.name}
                        </td>
                        <td className="py-2.5 pr-4">{cookieRows.meta_pixel.provider}</td>
                        <td className="py-2.5 pr-4">{cookieRows.meta_pixel.duration}</td>
                        <td className="py-2.5 text-foreground/70">{cookieRows.meta_pixel.purpose}</td>
                      </tr>
                    )}
                    {isYouTubeActive && (
                      <tr>
                        <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                          {cookieRows.youtube.name}
                        </td>
                        <td className="py-2.5 pr-4">{cookieRows.youtube.provider}</td>
                        <td className="py-2.5 pr-4">{cookieRows.youtube.duration}</td>
                        <td className="py-2.5 text-foreground/70">{cookieRows.youtube.purpose}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {isAnyTrackerActive && (
              <div className="pt-3">
                <PrivacyConsentButton label={content?.ui?.privacy_consent_button?.label} />
              </div>
            )}
          </div>
        </div>

        {/* Google Analytics 4 (Parametrico) */}
        {isGaActive && (
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BarChart3 size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {p.google_analytics.title}
              </h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              {p.google_analytics.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* Meta Pixel (Parametrico) */}
        {isMetaActive && (
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <Target size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {p.meta_pixel.title}
              </h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              {p.meta_pixel.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
              {p.meta_pixel.privacy_url && (
                <p>
                  <Link
                    href={p.meta_pixel.privacy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    {p.meta_pixel.privacy_url.replace("https://", "")} <ExternalLink size={12} />
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* YouTube Video Embed (Parametrico) */}
        {isYouTubeActive && (
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <Video size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {p.youtube.title}
              </h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              {p.youtube.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
              {p.youtube.privacy_url && (
                <p>
                  <Link
                    href={p.youtube.privacy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    {p.youtube.privacy_url.replace("https://", "")} <ExternalLink size={12} />
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Biglietteria Eventfrog */}
        {isEventfrogActive && (
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Ticket size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {p.eventfrog.title}
              </h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              {p.eventfrog.paragraphs.map((para, idx) => (
                <p key={idx}>
                  <FormattedText text={para} />
                </p>
              ))}
              {p.eventfrog.privacy_url && (
                <p>
                  <Link
                    href={p.eventfrog.privacy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    {p.eventfrog.privacy_url.replace("https://", "")} <ExternalLink size={12} />
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Moduli di Iscrizione e Prenotazione Tally */}
        {isTallyActive && (
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <ClipboardList size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {p.tally.title}
              </h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              {p.tally.paragraphs.map((para, idx) => (
                <p key={idx}>
                  <FormattedText text={para} />
                </p>
              ))}
              {p.tally.privacy_url && (
                <p>
                  <Link
                    href={p.tally.privacy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline inline-flex items-center gap-0.5"
                  >
                    {p.tally.privacy_url.replace("https://", "")} <ExternalLink size={12} />
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Invio Notifiche ed Email Transazionali Resend */}
        {isResendActive && (
          <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {p.resend.title}
              </h2>
            </div>
            <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
              {p.resend.paragraphs.map((para, idx) => (
                <p key={idx}>
                  <FormattedText text={para} />
                </p>
              ))}
              {p.resend.privacy_url && (
                <p>
                  <Link
                    href={p.resend.privacy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    {p.resend.privacy_url.replace("https://", "")} <ExternalLink size={12} />
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Protezione Anti-Bot Google reCAPTCHA */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.recaptcha.title}
            </h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
            {p.recaptcha.paragraphs.map((para, idx) => (
              <p key={idx}>
                <FormattedText text={para} />
              </p>
            ))}
            {p.recaptcha.privacy_url && (
              <p>
                <Link
                  href={p.recaptcha.privacy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline inline-flex items-center gap-0.5"
                >
                  {p.recaptcha.privacy_url.replace("https://", "")} <ExternalLink size={12} />
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Risorse e Font */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ExternalLink size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.typography_social.title}
            </h2>
          </div>

          <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">
                {p.typography_social.fonts_title}
              </h3>
              <p>
                <FormattedText text={p.typography_social.fonts_text} />
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-foreground/5">
              <h3 className="text-sm font-bold text-foreground">
                {p.typography_social.social_title}
              </h3>
              <p>
                <FormattedText text={p.typography_social.social_text} />
              </p>
            </div>
          </div>
        </div>

        {/* Fotografie e riprese audiovisive agli eventi */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Camera size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.photo_rights.title}
            </h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
            {p.photo_rights.paragraphs.map((para, idx) => (
              <p key={idx}>
                <FormattedText text={para} />
              </p>
            ))}
          </div>
        </div>

        {/* Integrazione Opzionale Google Calendar (Area Riservata Membri) */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              Integrazione Opzionale Google Calendar (Area Riservata)
            </h2>
          </div>
          <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
            <p>
              All&apos;interno dell&apos;area riservata del Calendario Assenze, i membri della compagnia hanno la facoltà opzionale di importare le proprie indisponibilità collegando temporaneamente il proprio account Google Calendar tramite OAuth 2.0 (Google Identity Services).
            </p>
            <p>
              <strong>Trattamento esclusivamente locale (client-side):</strong> l&apos;accesso ai dati del calendario avviene in sola lettura e unicamente all&apos;interno del browser dell&apos;utente. Nessun token di accesso, credenziale o dato personale relativo agli impegni privati dell&apos;utente viene memorizzato o trasmesso ai server dell&apos;Associazione. Al momento dell&apos;importazione dell&apos;assenza, i titoli degli eventi privati vengono rimossi e non vengono memorizzati nelle note condivise della compagnia.
            </p>
          </div>
        </div>

        {/* I tuoi diritti */}
        <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Scale size={20} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
              {p.your_rights.title}
            </h2>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed font-medium text-sm">
            {p.your_rights.paragraphs.map((para, idx) => (
              <p key={idx}>
                <FormattedText text={para} />
              </p>
            ))}
          </div>
        </div>
      </div>
    </LegalDocLayout>
  );
}
