import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/data";
import { FormattedText } from "@/components/ui/FormattedText";
import { ShieldCheck, Server, ExternalLink, Scale, BarChart3, Target, Ticket, Cookie, ClipboardList, Camera, Mail } from "lucide-react";
import PrivacyConsentButton from "./PrivacyConsentButton";
import { LegalDocLayout } from "@/components/ui/LegalDocLayout";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  const meta = content?.pages?.privacy?.meta;
  return {
    title: meta?.title || "Informativa sulla Privacy",
    description: meta?.description || "",
    alternates: {
      canonical: "/Privacy",
    },
  };
}

export default async function PrivacyPage() {
  const content = await getContent();
  const p = content?.pages?.privacy;
  const integrations = content?.integrations || {};

  const isGaActive = Boolean(integrations?.google_analytics?.enabled && integrations?.google_analytics?.measurement_id);
  const isMetaActive = Boolean(integrations?.meta_pixel?.enabled && integrations?.meta_pixel?.pixel_id);
  const isEventfrogActive = Boolean(
    integrations?.eventfrog?.enabled ||
    (content?.ticketing_pages && content.ticketing_pages.length > 0) ||
    content?.shows?.some((s: any) => Boolean(s.eventfrog_url || s.eventfrog_id)) ||
    (content?.landing_pages && content.landing_pages.some((lp: any) => lp.blocks?.some((b: any) => b.type === "biglietti" || b.eventfrog_url)))
  );
  const isTallyActive = Boolean(
    integrations?.tally?.enabled ||
    (content?.registration_pages && content.registration_pages.length > 0) ||
    (content?.landing_pages && content.landing_pages.some((lp: any) => lp.blocks?.some((b: any) => b.type === "registrazione" || b.tally_url)))
  );
  const isResendActive = Boolean(
    content?.emails?.templates?.some((t: any) => t.enabled !== false) ||
    content?.emails?.settings?.from_email
  );
  const isAnyTrackerActive = isGaActive || isMetaActive;

  const cookieRows = p?.cookie_opt_in?.rows || {};

  return (
    <LegalDocLayout
      badge={p?.badge}
      title={p?.title || "Informativa sulla Privacy"}
      description={p?.description}
      backHref="/"
      backLabel={p?.back_link || "Torna alla home"}
    >
      <div className="space-y-6">
          {/* Titolare del trattamento */}
          {p?.data_controller && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.data_controller.title}
                </h2>
              </div>
              <div className="space-y-2 text-foreground/80 font-medium">
                {p.data_controller.name && (
                  <p className="font-bold text-foreground text-lg">{p.data_controller.name}</p>
                )}
                {p.data_controller.address && <p>{p.data_controller.address}</p>}
                {p.data_controller.email && (
                  <p>
                    {p.data_controller.email_label && <span>{p.data_controller.email_label} </span>}
                    <a
                      href={`mailto:${p.data_controller.email}`}
                      className="text-primary hover:underline"
                    >
                      {p.data_controller.email}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Trattamento generale dei dati */}
          {p?.general_processing && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                {p.general_processing.title}
              </h2>
              <p className="text-foreground/80 leading-relaxed font-medium">
                <FormattedText text={p.general_processing.text} />
              </p>
            </div>
          )}

          {/* File di log del server */}
          {p?.server_logs && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <Server size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.server_logs.title}
                </h2>
              </div>
              <p className="text-foreground/80 leading-relaxed font-medium">
                <FormattedText text={p.server_logs.text} />
              </p>
            </div>
          )}

          {/* Cookie, Local Storage e Servizi Incorporati (Dinamico) */}
          {p?.cookie_opt_in && (
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
                {p.cookie_opt_in.intro_1 && <p><FormattedText text={p.cookie_opt_in.intro_1} /></p>}
                {p.cookie_opt_in.intro_2 && <p><FormattedText text={p.cookie_opt_in.intro_2} /></p>}

                {/* Tabella Cookie Attivi */}
                <div className="pt-2">
                  {p.cookie_opt_in.table_heading && (
                    <h3 className="text-sm font-bold text-foreground mb-3">
                      {p.cookie_opt_in.table_heading}
                    </h3>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-foreground/10 text-foreground/50 uppercase tracking-wider">
                          <th className="py-2.5 pr-4">{p.cookie_opt_in.columns?.name}</th>
                          <th className="py-2.5 pr-4">{p.cookie_opt_in.columns?.provider}</th>
                          <th className="py-2.5 pr-4">{p.cookie_opt_in.columns?.duration}</th>
                          <th className="py-2.5">{p.cookie_opt_in.columns?.purpose}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-foreground/5">
                        {cookieRows.own_consent && (
                          <tr>
                            <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                              {cookieRows.own_consent.name}
                            </td>
                            <td className="py-2.5 pr-4">{cookieRows.own_consent.provider}</td>
                            <td className="py-2.5 pr-4">{cookieRows.own_consent.duration}</td>
                            <td className="py-2.5 text-foreground/70">
                              {cookieRows.own_consent.purpose}
                            </td>
                          </tr>
                        )}
                        {isEventfrogActive && cookieRows.eventfrog && (
                          <tr>
                            <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                              {cookieRows.eventfrog.name}
                            </td>
                            <td className="py-2.5 pr-4">{cookieRows.eventfrog.provider}</td>
                            <td className="py-2.5 pr-4">{cookieRows.eventfrog.duration}</td>
                            <td className="py-2.5 text-foreground/70">
                              {cookieRows.eventfrog.purpose}
                            </td>
                          </tr>
                        )}
                        {isTallyActive && cookieRows.tally && (
                          <tr>
                            <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                              {cookieRows.tally.name}
                            </td>
                            <td className="py-2.5 pr-4">{cookieRows.tally.provider}</td>
                            <td className="py-2.5 pr-4">{cookieRows.tally.duration}</td>
                            <td className="py-2.5 text-foreground/70">
                              {cookieRows.tally.purpose}
                            </td>
                          </tr>
                        )}
                        {isGaActive && cookieRows.google_analytics && (
                          <tr>
                            <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                              {cookieRows.google_analytics.name}
                            </td>
                            <td className="py-2.5 pr-4">{cookieRows.google_analytics.provider}</td>
                            <td className="py-2.5 pr-4">{cookieRows.google_analytics.duration}</td>
                            <td className="py-2.5 text-foreground/70">
                              {cookieRows.google_analytics.purpose}
                            </td>
                          </tr>
                        )}
                        {isMetaActive && cookieRows.meta_pixel && (
                          <tr>
                            <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                              {cookieRows.meta_pixel.name}
                            </td>
                            <td className="py-2.5 pr-4">{cookieRows.meta_pixel.provider}</td>
                            <td className="py-2.5 pr-4">{cookieRows.meta_pixel.duration}</td>
                            <td className="py-2.5 text-foreground/70">
                              {cookieRows.meta_pixel.purpose}
                            </td>
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
          )}

          {/* Google Analytics 4 (Parametrico) */}
          {isGaActive && p?.google_analytics && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BarChart3 size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.google_analytics.title}
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                {p.google_analytics.paragraphs?.map((para: string, idx: number) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* Meta Pixel (Parametrico) */}
          {isMetaActive && p?.meta_pixel && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <Target size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.meta_pixel.title}
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                {p.meta_pixel.paragraphs?.map((para: string, idx: number) => (
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

          {/* Biglietteria Eventfrog (Parametrico o Incorporato) */}
          {isEventfrogActive && p?.eventfrog && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Ticket size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.eventfrog.title}
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                {p.eventfrog.paragraphs?.map((para: string, idx: number) => (
                  <p key={idx}><FormattedText text={para} /></p>
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

          {/* Moduli di Iscrizione e Prenotazione Tally (Parametrico o Incorporato) */}
          {isTallyActive && p?.tally && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.tally.title}
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                {p.tally.paragraphs?.map((para: string, idx: number) => (
                  <p key={idx}><FormattedText text={para} /></p>
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

          {/* Invio Notifiche ed Email Transazionali Resend (Parametrico) */}
          {isResendActive && p?.resend && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.resend.title}
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                {p.resend.paragraphs?.map((para: string, idx: number) => (
                  <p key={idx}><FormattedText text={para} /></p>
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
          {p?.recaptcha && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.recaptcha.title}
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                {p.recaptcha.paragraphs?.map((para: string, idx: number) => (
                  <p key={idx}><FormattedText text={para} /></p>
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
          )}

          {/* Risorse e Font */}
          {p?.typography_social && (
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
                {p.typography_social.fonts_title && (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground">
                      {p.typography_social.fonts_title}
                    </h3>
                    <p><FormattedText text={p.typography_social.fonts_text} /></p>
                  </div>
                )}

                {p.typography_social.social_title && (
                  <div className="space-y-1.5 pt-4 border-t border-foreground/5">
                    <h3 className="text-sm font-bold text-foreground">
                      {p.typography_social.social_title}
                    </h3>
                    <p><FormattedText text={p.typography_social.social_text} /></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fotografie e riprese audiovisive agli eventi */}
          {p?.photo_rights && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Camera size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.photo_rights.title}
                </h2>
              </div>
              <div className="space-y-3 text-foreground/80 leading-relaxed font-medium text-sm">
                {p.photo_rights.paragraphs?.map((para: string, idx: number) => (
                  <p key={idx}><FormattedText text={para} /></p>
                ))}
              </div>
            </div>
          )}

          {/* I tuoi diritti */}
          {p?.your_rights && (
            <div className="p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Scale size={20} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">
                  {p.your_rights.title}
                </h2>
              </div>
              <p className="text-foreground/80 leading-relaxed font-medium">
                <FormattedText text={p.your_rights.text} />
              </p>
            </div>
          )}
        </div>
    </LegalDocLayout>
  );
}
