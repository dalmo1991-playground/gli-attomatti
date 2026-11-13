"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  ClipboardCheck,
  Download,
  ExternalLink,
  Info,
  Loader2,
  Plus,
  Shield,
  Square,
  Users
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { AccordionCard } from "../components/ui/AccordionCard";
import {
  TallyApiFormSummary,
  TallyApiQuestion,
  TallyFormConfig,
  TallyFormFieldConfig,
  TallyParticipantsMode
} from "@/types/tally";

export function TallyCheckinTab() {
  const { content, updateContent, adminSecret } = useAdmin();
  const forms: TallyFormConfig[] = content?.tally_checkin_forms || [];

  const [tallyFormsList, setTallyFormsList] = useState<TallyApiFormSummary[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);

  const [questionsByForm, setQuestionsByForm] = useState<Record<string, TallyApiQuestion[]>>({});
  const [loadingQuestionsId, setLoadingQuestionsId] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<Record<string, string>>({});

  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");

  const handleFetchTallyForms = async () => {
    setIsLoadingForms(true);
    setFormsError(null);
    try {
      const res = await fetch("/api/admin/tally/forms", {
        headers: { "x-admin-secret": adminSecret || "" }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Errore durante il caricamento dei moduli da Tally.");
      }
      setTallyFormsList(json.forms || []);
    } catch (err: unknown) {
      setFormsError((err as Error)?.message || "Errore di connessione a Tally.");
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleFetchQuestions = async (formId: string) => {
    if (!formId) return;
    setLoadingQuestionsId(formId);
    setQuestionsError((prev) => ({ ...prev, [formId]: "" }));
    try {
      const res = await fetch(`/api/admin/tally/forms/${encodeURIComponent(formId)}/questions`, {
        headers: { "x-admin-secret": adminSecret || "" }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Errore durante il recupero dei campi.");
      }
      setQuestionsByForm((prev) => ({ ...prev, [formId]: json.questions || [] }));
    } catch (err: unknown) {
      setQuestionsError((prev) => ({
        ...prev,
        [formId]: (err as Error)?.message || "Impossibile caricare i campi da Tally."
      }));
    } finally {
      setLoadingQuestionsId(null);
    }
  };

  const addConfiguredForm = (id: string, name: string) => {
    const cleanId = id.trim();
    if (!cleanId) return;
    if (forms.some((f) => f.id === cleanId)) return;

    const nextForm: TallyFormConfig = {
      id: cleanId,
      name: name.trim() || `Modulo ${cleanId}`,
      enabled: true,
      allowedFields: [],
      participantsMode: "one_per_submission"
    };
    updateContent("tally_checkin_forms", [...forms, nextForm]);
  };

  const removeForm = (idx: number) => {
    updateContent(
      "tally_checkin_forms",
      forms.filter((_, i) => i !== idx)
    );
  };

  const updateForm = (idx: number, patch: Partial<TallyFormConfig>) => {
    const next = [...forms];
    next[idx] = { ...next[idx], ...patch };
    updateContent("tally_checkin_forms", next);
  };

  const toggleAllowedField = (formIdx: number, question: TallyApiQuestion) => {
    const target = forms[formIdx];
    const current = target.allowedFields || [];
    const exists = current.some((f) => f.questionId === question.id);

    let nextFields: TallyFormFieldConfig[];
    if (exists) {
      nextFields = current.filter((f) => f.questionId !== question.id);
    } else {
      nextFields = [
        ...current,
        {
          questionId: question.id,
          label: question.title,
          type: question.type
        }
      ];
    }

    const patch: Partial<TallyFormConfig> = { allowedFields: nextFields };
    if (exists && target.primaryFieldId === question.id) {
      patch.primaryFieldId = nextFields[0]?.questionId || "";
    }
    if (exists && target.secondaryFieldId === question.id) {
      patch.secondaryFieldId = "";
    }
    updateForm(formIdx, patch);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminSection
        title="Iscrizioni Tally & Check-in (Area Riservata)"
        description="Configura quali moduli Tally.so sono consultabili in Area Riservata, quali campi estrarre per tutelare la privacy e come calcolare i partecipanti."
        icon={ClipboardCheck}
      >
        <div className="space-y-6">
          {/* Info Box */}
          <div className="p-5 rounded-2xl bg-foreground/5 border border-foreground/5 text-xs text-foreground/80 space-y-2.5 leading-relaxed">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Info size={16} className="text-accent shrink-0" />
                <span>Come funziona la gestione Privacy & Check-in</span>
              </div>
              <Link
                href="/area-riservata/check-in"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 font-bold text-xs transition-colors"
              >
                <span>Apri Area Riservata Check-in</span>
                <ExternalLink size={12} />
              </Link>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-foreground/70">
              <li>
                <strong>Privacy-by-design:</strong> vengono estratti e salvati su Vercel Blob{" "}
                <strong>solo i campi spuntati</strong> qui sotto. Tutti gli altri campi del form Tally vengono ignorati.
              </li>
              <li>
                <strong>Azioni operative:</strong> il <em>Sync da Tally</em> e il <em>Check-in mobile</em> si eseguono direttamente dall&apos;Area Riservata (<code>/area-riservata/check-in</code>).
              </li>
              <li>
                <strong>Ricorda di pubblicare:</strong> dopo aver aggiunto o modificato un modulo, clicca <strong>Pubblica</strong> in alto per salvare in <code>content.json</code>.
              </li>
            </ul>
          </div>

          {/* Import from Tally API */}
          <div className="p-5 rounded-2xl bg-muted/20 border border-foreground/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Aggiungi Modulo dal tuo Account Tally
                </h3>
                <p className="text-xs text-foreground/60">
                  Richiede <code>TALLY_API_KEY</code> configurata sul server.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchTallyForms}
                disabled={isLoadingForms}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isLoadingForms ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>{isLoadingForms ? "Caricamento..." : "Carica Form da Tally"}</span>
              </button>
            </div>

            {formsError && (
              <p className="text-xs font-semibold text-accent bg-accent/10 border border-accent/30 rounded-xl p-3">
                {formsError}
              </p>
            )}

            {tallyFormsList.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {tallyFormsList.map((tf) => {
                  const alreadyAdded = forms.some((f) => f.id === tf.id);
                  return (
                    <div
                      key={tf.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-background/60 border border-foreground/10"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{tf.name}</div>
                        <div className="text-[11px] text-foreground/50">
                          ID: <code>{tf.id}</code>
                          {typeof tf.numberOfSubmissions === "number" &&
                            ` · ${tf.numberOfSubmissions} sub`}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addConfiguredForm(tf.id, tf.name)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-secondary/20 text-secondary hover:bg-secondary/30 disabled:opacity-40 transition-colors"
                      >
                        {alreadyAdded ? "Aggiunto" : "+ Aggiungi"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manual Fallback */}
            <div className="pt-3 border-t border-foreground/10 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
              <div className="flex-1">
                <FormField
                  label="Oppure aggiungi manualmente — ID Modulo Tally (es. LZaPOz)"
                  value={manualId}
                  onChange={setManualId}
                  placeholder="LZaPOz"
                />
              </div>
              <div className="flex-1">
                <FormField
                  label="Nome visualizzato"
                  value={manualName}
                  onChange={setManualName}
                  placeholder="Es. Iscrizione Workshop"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!manualId.trim()) return;
                  addConfiguredForm(manualId, manualName);
                  setManualId("");
                  setManualName("");
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-foreground text-xs font-bold transition-colors shrink-0"
              >
                <Plus size={14} />
                <span>Aggiungi ID</span>
              </button>
            </div>
          </div>

          {/* Configured Forms */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              Moduli Configurati ({forms.length})
            </h3>

            {forms.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-foreground/15 text-center text-xs text-foreground/50">
                Nessun modulo configurato. Carica un form da Tally o inserisci un ID qui sopra.
              </div>
            ) : (
              forms.map((form, idx) => {
                const loadedQuestions = questionsByForm[form.id] || [];
                const availableQuestions: TallyApiQuestion[] =
                  loadedQuestions.length > 0
                    ? loadedQuestions
                    : (form.allowedFields || []).map((af) => ({
                        id: af.questionId,
                        title: af.label,
                        type: af.type || "TEXT"
                      }));

                const qError = questionsError[form.id];
                const isLoadingQ = loadingQuestionsId === form.id;

                return (
                  <AccordionCard
                    key={form.id}
                    index={idx}
                    total={forms.length}
                    onDelete={() => removeForm(idx)}
                    title={form.name || form.id}
                    subtitle={`ID: ${form.id} · ${(form.allowedFields || []).length} campi estratti`}
                    badge={form.enabled !== false ? "Attivo" : "Disattivato"}
                    defaultOpen={idx === 0}
                  >
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <FormField
                          label="Nome Modulo (mostrato in Area Riservata)"
                          value={form.name}
                          onChange={(val) => updateForm(idx, { name: val })}
                        />

                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background/50 border border-foreground/10">
                          <span className="text-xs font-bold text-foreground">
                            Visibile in Area Riservata
                          </span>
                          <input
                            type="checkbox"
                            checked={form.enabled !== false}
                            onChange={(e) => updateForm(idx, { enabled: e.target.checked })}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Privacy Field Selection */}
                      <div className="p-4 rounded-2xl bg-background/40 border border-foreground/10 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Shield size={15} className="text-primary" />
                            <span className="text-xs font-bold text-foreground">
                              Campi da Estrarre (Privacy)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFetchQuestions(form.id)}
                            disabled={isLoadingQ}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 text-[11px] font-bold disabled:opacity-50 transition-colors"
                          >
                            {isLoadingQ ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                            <span>
                              {isLoadingQ ? "Caricamento..." : "Carica Campi da Tally"}
                            </span>
                          </button>
                        </div>

                        {qError && (
                          <p className="text-[11px] font-semibold text-accent">{qError}</p>
                        )}

                        {availableQuestions.length === 0 ? (
                          <p className="text-[11px] text-foreground/60">
                            Clicca <strong>&quot;Carica Campi da Tally&quot;</strong> per scegliere
                            quali campi estrarre da questo modulo.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {availableQuestions.map((q) => {
                              const checked = (form.allowedFields || []).some(
                                (af) => af.questionId === q.id
                              );
                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => toggleAllowedField(idx, q)}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                                    checked
                                      ? "bg-primary/10 border-primary/30 text-foreground"
                                      : "bg-background/40 border-foreground/10 text-foreground/60 hover:text-foreground"
                                  }`}
                                >
                                  {checked ? (
                                    <CheckSquare
                                      size={16}
                                      className="text-primary shrink-0 mt-0.5"
                                    />
                                  ) : (
                                    <Square size={16} className="shrink-0 mt-0.5" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold leading-snug break-words">
                                      {q.title}
                                    </div>
                                    <div className="text-[10px] opacity-60">{q.type}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Display Fields on Mobile Card */}
                      {(form.allowedFields || []).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                              Campo Principale Card (es. Nome)
                            </label>
                            <select
                              value={form.primaryFieldId || ""}
                              onChange={(e) =>
                                updateForm(idx, { primaryFieldId: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-background border border-foreground/15 text-xs text-foreground"
                            >
                              <option value="">(Primo campo disponibile)</option>
                              {(form.allowedFields || []).map((af) => (
                                <option key={af.questionId} value={af.questionId}>
                                  {af.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                              Campo Secondario (es. Email / Turno)
                            </label>
                            <select
                              value={form.secondaryFieldId || ""}
                              onChange={(e) =>
                                updateForm(idx, { secondaryFieldId: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-background border border-foreground/15 text-xs text-foreground"
                            >
                              <option value="">(Nessuno / Automatico)</option>
                              {(form.allowedFields || []).map((af) => (
                                <option key={af.questionId} value={af.questionId}>
                                  {af.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Participants Calculation */}
                      <div className="p-4 rounded-2xl bg-background/40 border border-foreground/10 space-y-3">
                        <div className="flex items-center gap-2">
                          <Users size={15} className="text-secondary" />
                          <span className="text-xs font-bold text-foreground">
                            Conteggio Partecipanti
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                              Modalità di calcolo
                            </label>
                            <select
                              value={form.participantsMode || "one_per_submission"}
                              onChange={(e) =>
                                updateForm(idx, {
                                  participantsMode: e.target.value as TallyParticipantsMode
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-background border border-foreground/15 text-xs text-foreground"
                            >
                              <option value="one_per_submission">
                                1 partecipante per sottomissione
                              </option>
                              <option value="from_field">
                                Da un campo numerico del modulo
                              </option>
                            </select>
                          </div>

                          {form.participantsMode === "from_field" && (
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                                Campo Numero Partecipanti
                              </label>
                              {availableQuestions.length > 0 ? (
                                <select
                                  value={form.participantsFieldId || ""}
                                  onChange={(e) =>
                                    updateForm(idx, { participantsFieldId: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-background border border-foreground/15 text-xs text-foreground"
                                >
                                  <option value="">Seleziona campo...</option>
                                  {availableQuestions.map((q) => (
                                    <option key={q.id} value={q.id}>
                                      {q.title}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={form.participantsFieldId || ""}
                                  onChange={(e) =>
                                    updateForm(idx, { participantsFieldId: e.target.value })
                                  }
                                  placeholder="ID domanda Tally (carica i campi sopra)"
                                  className="w-full px-3 py-2 rounded-xl bg-background border border-foreground/15 text-xs text-foreground"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          href="/area-riservata/check-in"
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                        >
                          <span>Vai al Check-in</span>
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  </AccordionCard>
                );
              })
            )}
          </div>
        </div>
      </AdminSection>
    </div>
  );
}

