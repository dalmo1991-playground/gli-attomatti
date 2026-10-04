"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, CheckCircle2, AlertCircle, X, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface EmailModalOptions {
  templateId?: string;
  subcaseId?: string;
  title?: string;
  subtitle?: string;
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  eventUrl?: string;
  variables?: Record<string, string>;
}

declare global {
  interface Window {
    openEmailModal?: (options: EmailModalOptions) => void;
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function EmailActionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<EmailModalOptions>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Multi-tier Honeypot traps
  const [honeypotWebsite, setHoneypotWebsite] = useState("");
  const [honeypotCompany, setHoneypotCompany] = useState("");
  const [honeypotHoney, setHoneypotHoney] = useState("");
  const [openedAt, setOpenedAt] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();

  // Load Google reCAPTCHA v3 script on-demand ONLY when the modal is opened
  useEffect(() => {
    if (!isOpen || !recaptchaSiteKey) return;
    if (document.getElementById("recaptcha-v3-script")) return;

    const script = document.createElement("script");
    script.id = "recaptcha-v3-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
    script.async = true;
    document.head.appendChild(script);
  }, [isOpen, recaptchaSiteKey]);

  // Open modal handler
  const handleOpen = (opts: EmailModalOptions) => {
    setOptions(opts);
    setName("");
    setEmail("");
    setHoneypotWebsite("");
    setHoneypotCompany("");
    setHoneypotHoney("");
    setOpenedAt(Date.now());
    setIsSuccess(false);
    setErrorMessage(null);
    setIsOpen(true);
  };

  // Expose global open helper & listen to custom events and anchor clicks
  useEffect(() => {
    window.openEmailModal = handleOpen;

    const onCustomEvent = (e: any) => {
      if (e.detail) handleOpen(e.detail);
    };
    window.addEventListener("open-email-modal", onCustomEvent);

    // Global click listener for href="#email:template-id:subcase-id" or "#email:template-id"
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a, button");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      const dataTemplate = target.getAttribute("data-email-template") || "";

      if (href.startsWith("#email:") || dataTemplate) {
        e.preventDefault();
        const raw = (dataTemplate || href.replace("#email:", "")).trim();
        // Syntax strictly supported: #email:templateId:subcaseId
        const parts = raw.split(":");
        const templateId = parts[0]?.trim() || undefined;
        const subcaseId = parts[1]?.trim() || undefined;

        const title = target.getAttribute("data-email-title") || "";
        const eventTitle = target.getAttribute("data-email-event") || "";

        handleOpen({
          templateId,
          subcaseId,
          title: title || undefined,
          eventTitle: eventTitle || undefined
        });
      }
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      window.removeEventListener("open-email-modal", onCustomEvent);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Multi-tier Honeypot check: If any decoy field is filled, silently pretend success to confuse bots
    if (honeypotWebsite || honeypotCompany || honeypotHoney) {
      console.warn("[Honeypot Client Trap] Silently dropping automated submission.");
      setIsSuccess(true);
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorMessage("Inserisci un indirizzo email valido.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Obtain reCAPTCHA token if configured
      let recaptchaToken: string | undefined = undefined;
      if (recaptchaSiteKey) {
        try {
          if (!window.grecaptcha) {
            // Wait up to 600ms for grecaptcha script to load
            await new Promise<void>((resolve) => {
              const start = Date.now();
              const timer = setInterval(() => {
                if (window.grecaptcha || Date.now() - start > 600) {
                  clearInterval(timer);
                  resolve();
                }
              }, 50);
            });
          }
          if (window.grecaptcha) {
            await new Promise<void>((resolve) => window.grecaptcha?.ready(resolve));
            recaptchaToken = await window.grecaptcha.execute(recaptchaSiteKey, { action: "email_modal_submit" });
          }
        } catch (captchaErr) {
          console.warn("[reCAPTCHA execution error]", captchaErr);
        }
      }

      // 3. Call Send API with template & subcase
      const params = new URLSearchParams();
      if (options.templateId) params.set("template", options.templateId);
      if (options.subcaseId) params.set("subcase", options.subcaseId);
      const queryString = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`/api/email/send${queryString}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.trim(),
          name: name.trim() || undefined,
          subcase: options.subcaseId,
          recaptchaToken,
          website_url_check: honeypotWebsite || undefined,
          business_company_name: honeypotCompany || undefined,
          bot_field_honey: honeypotHoney || undefined,
          openedAt: openedAt || Date.now() - 3000,
          submittedAt: Date.now(),
          variables: {
            ...(name.trim() ? { name: name.trim(), nome: name.trim() } : {}),
            ...(options.eventTitle ? { event_title: options.eventTitle } : {}),
            ...(options.eventDate ? { event_date: options.eventDate } : {}),
            ...(options.eventLocation ? { event_location: options.eventLocation } : {}),
            ...(options.eventUrl ? { event_url: options.eventUrl } : {}),
            ...(options.variables || {})
          }
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Impossibile inviare l'email. Riprova tra poco.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Errore di connessione. Controlla la rete e riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-muted/40 border border-foreground/15 p-6 md:p-8 shadow-2xl glass z-10 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {!isSuccess ? (
            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest">
                  <Mail size={12} /> Notifica Rapida
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                  {options.title || "Ricevi i Dettagli via Email"}
                </h3>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {options.subtitle ||
                    (options.eventTitle
                      ? `Inserisci il tuo indirizzo email per ricevere tutti i dettagli e il promemoria per "${options.eventTitle}".`
                      : "Inserisci la tua email per ricevere subito le informazioni richieste.")}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Multi-tier Invisible Honeypot Traps */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                    opacity: 0,
                    pointerEvents: "none"
                  }}
                >
                  <label htmlFor="website_url_check">Lascia vuoto questo campo</label>
                  <input
                    id="website_url_check"
                    type="text"
                    name="website_url_check"
                    value={honeypotWebsite}
                    onChange={(e) => setHoneypotWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  <label htmlFor="business_company_name">Azienda</label>
                  <input
                    id="business_company_name"
                    type="text"
                    name="business_company_name"
                    value={honeypotCompany}
                    onChange={(e) => setHoneypotCompany(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  <input
                    type="text"
                    name="bot_field_honey"
                    value={honeypotHoney}
                    onChange={(e) => setHoneypotHoney(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    Il Tuo Nome <span className="text-[10px] text-foreground/40 font-normal lowercase">(facoltativo)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-foreground/10 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    Indirizzo Email <span className="text-primary font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="latuaemail@example.com"
                    className="w-full px-4 py-3 rounded-2xl bg-background/50 border border-foreground/10 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-primary text-background font-black text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Invio in corso...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Invia Email</span>
                      </>
                    )}
                  </button>
                </div>

                {/* reCAPTCHA & Privacy Notice */}
                <div className="pt-2 text-center text-[10px] text-foreground/45 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Protetto da Google reCAPTCHA • Conforme nLPD & GDPR</span>
                </div>
              </form>
            </div>
          ) : (
            /* Success State */
            <div className="relative z-10 py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-2xl font-black uppercase tracking-tight text-foreground">
                  Email Inviata!
                </h4>
                <p className="text-xs text-foreground/70 max-w-sm mx-auto leading-relaxed">
                  Abbiamo inviato il messaggio a <strong className="text-foreground">{email}</strong>. Controlla la tua casella di posta (e la cartella promozioni/spam).
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Chiudi Finestra
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
