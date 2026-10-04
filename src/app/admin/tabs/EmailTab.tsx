"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  CopyPlus,
  Smartphone,
  Monitor,
  Code,
  Eye,
  Sliders,
  Calendar,
  Tag,
  Palette,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Type,
  FileText,
  MousePointerClick,
  Info,
  Image as ImageIcon,
  Columns2,
  Minus,
  Share2,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Layers,
  HelpCircle,
  Braces,
  Maximize2,
  FileJson,
  Search,
  Database,
  Bell,
  Clock
} from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminSection } from "../components/ui/AdminSection";
import { FormField } from "../components/ui/FormField";
import { MediaLibraryModal } from "../components/ui/MediaLibraryModal";
import {
  renderEmailHtml,
  resolveEmailTheme,
  EmailTemplateConfig,
  EmailSubcaseConfig,
  EmailSenderProfile,
  EmailSettingsConfig,
  EmailFieldMapping
} from "@/lib/email/template";
import {
  extractFieldsFromJson,
  ExtractedJsonField,
  flattenJsonToDotNotation,
  getValueByJsonPath,
  resolveRecipientEmail,
  resolveRecipientName
} from "@/lib/email/jsonPath";
import {
  EmailBlock,
  EmailBlockType,
  convertLegacyToBlocks,
  replaceVars
} from "@/lib/email/blocks";
import { LANDING_THEME_PRESETS, LandingThemeColors } from "@/lib/landingThemes";
import { getAutoContrastColor } from "@/lib/devTheme";
import { FailedEmailRecord } from "@/lib/email/dlq";

const DEFAULT_SAMPLE_TALLY_JSON = JSON.stringify(
  {
    eventId: "c96982f1-8cae-4adb-bb69-d709e339842f",
    createdAt: "2026-10-04T12:06:50.446Z",
    data: {
      responseId: "9259bf77-7204-4044-be7e-67bd47252b78",
      submissionId: "mZjPkB",
      respondentId: "w7XW2n",
      formId: "Eky7ON",
      formName: "Cineforum - Le vacanze di Monsieur Hulot - 14 novembre 2026, ore 18:00",
      fields: [
        {
          key: "question_gNPxzl",
          label: "Email",
          type: "INPUT_EMAIL",
          value: "mariorossi@gmail.com"
        },
        {
          key: "question_JkjZo4",
          label: "Nome e Cognome",
          type: "INPUT_TEXT",
          value: "Mario Rossi"
        },
        {
          key: "question_yqAp1B",
          label: "Telefono",
          type: "INPUT_PHONE_NUMBER",
          value: "+32491234567"
        },
        {
          key: "question_rrMWlR",
          label: "Numero di partecipanti",
          type: "INPUT_NUMBER",
          value: 3
        }
      ]
    }
  },
  null,
  2
);

const BLOCK_DEFINITIONS: { type: EmailBlockType; label: string; desc: string; icon: any }[] = [
  { type: "header", label: "Logo & Intestazione", desc: "Nome compagnia, payoff e monogramma", icon: Layers },
  { type: "badge", label: "Badge Pillola", desc: "Etichetta decorativa di categoria", icon: Tag },
  { type: "heading", label: "Titolo Principale", desc: "H1 / H2 con allineamento e colore", icon: Type },
  { type: "text", label: "Paragrafo / Testo Ricco", desc: "Testo formattato con markdown, grassetto e link", icon: FileText },
  { type: "info_box", label: "Card Info Evento", desc: "Box dettagli per Data, Ora, Luogo e Posti", icon: Info },
  { type: "calendar", label: "Appuntamento Calendario", desc: "Box 'Aggiungi al Calendario' (Google, Apple iCal, Outlook) con download .ics", icon: Calendar },
  { type: "image", label: "Immagine / Locandina", desc: "Foto o locandina con didascalia e link", icon: ImageIcon },
  { type: "two_column", label: "Due Colonne", desc: "Due colonne di testo affiancate responsive", icon: Columns2 },
  { type: "divider", label: "Divisore / Spaziatore", desc: "Linea sfumata luminosa o spazio vuoto", icon: Minus },
  { type: "social_links", label: "Canali Social", desc: "Icone link a Instagram, Facebook e sito", icon: Share2 },
  { type: "footer", label: "Piè di Pagina & nLPD", desc: "Note legali, sede e link all'Informativa", icon: ShieldCheck }
];

export function EmailTab() {
  const { content, updateContent, adminSecret } = useAdmin();

  const emailsConfig = content?.emails || {};
  const settings: EmailSettingsConfig = emailsConfig.settings || {};
  const templates: EmailTemplateConfig[] = Array.isArray(emailsConfig.templates) ? emailsConfig.templates : [];
  const registrationPages: any[] = Array.isArray(content?.registration_pages) ? content.registration_pages : [];
  const landings: any[] = Array.isArray(content?.landings) ? content.landings : [];

  // Selected template index
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const activeTemplate = templates[selectedIndex] || templates[0] || null;

  // View state
  const [activeTabSection, setActiveTabSection] = useState<"theme" | "details" | "builder" | "personalization" | "api" | "preview" | "queue">("theme");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "fluid">("desktop");
  const [isPreviewJsonOpen, setIsPreviewJsonOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedCustomSnippet, setCopiedCustomSnippet] = useState(false);
  const [copiedSubcaseSnippet, setCopiedSubcaseSnippet] = useState<string | null>(null);

  // DLQ (Dead Letter Queue) state
  const [queueItems, setQueueItems] = useState<FailedEmailRecord[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isRetryingQueue, setIsRetryingQueue] = useState(false);
  const [retryingQueueId, setRetryingQueueId] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedQueueId, setExpandedQueueId] = useState<string | null>(null);

  // DLQ Cron Notification Test State
  const [isTestingDlqNotify, setIsTestingDlqNotify] = useState(false);
  const [notifyTestResult, setNotifyTestResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleTestDlqNotify = async () => {
    setIsTestingDlqNotify(true);
    setNotifyTestResult(null);
    try {
      const res = await fetch("/api/cron/email-dlq-notify?force=true", {
        headers: { "x-admin-secret": adminSecret || "" }
      });
      const data = await res.json();
      if (data.success) {
        setNotifyTestResult({
          type: "success",
          text: `Email di notifica inviata con successo a: ${data.notifiedTo || settings.dlq_alert_email || "admin"}!`
        });
      } else {
        setNotifyTestResult({
          type: "error",
          text: data.error || data.reason || "Errore durante l'invio della notifica di test."
        });
      }
    } catch (err: any) {
      setNotifyTestResult({
        type: "error",
        text: err?.message || "Errore di connessione."
      });
    } finally {
      setIsTestingDlqNotify(false);
    }
  };

  const fetchQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await fetch("/api/email/queue", {
        headers: { "x-admin-secret": adminSecret || "" }
      });
      if (res.ok) {
        const data = await res.json();
        setQueueItems(Array.isArray(data.items) ? data.items : []);
      }
    } catch (err) {
      console.warn("Failed to fetch email queue:", err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [adminSecret]);

  const handleRetrySingle = async (id: string) => {
    setRetryingQueueId(id);
    setQueueMessage(null);
    try {
      const res = await fetch("/api/email/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || ""
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setQueueMessage({ type: "success", text: "Email reinviata con successo e rimossa dalla coda!" });
        await fetchQueue();
      } else {
        setQueueMessage({ type: "error", text: data.error || data.message || "Tentativo di re-invio fallito." });
        await fetchQueue();
      }
    } catch (err: any) {
      setQueueMessage({ type: "error", text: "Errore di connessione durante il re-invio: " + err?.message });
    } finally {
      setRetryingQueueId(null);
    }
  };

  const handleRetryAll = async () => {
    setIsRetryingQueue(true);
    setQueueMessage(null);
    try {
      const res = await fetch("/api/email/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || ""
        },
        body: JSON.stringify({ all: true })
      });
      const data = await res.json();
      if (data.success) {
        setQueueMessage({
          type: "success",
          text: `Completato! ${data.succeeded || 0} email inviate con successo.`
        });
      } else {
        setQueueMessage({
          type: "error",
          text: `Elaborate: ${data.succeeded || 0} inviate, ${data.failed || 0} ancora in errore.`
        });
      }
      await fetchQueue();
    } catch (err: any) {
      setQueueMessage({ type: "error", text: "Errore durante il re-invio in blocco: " + err?.message });
    } finally {
      setIsRetryingQueue(false);
    }
  };

  const handleDeleteQueueItem = async (id: string) => {
    if (!confirm("Sei sicuro di voler scartare questa email dalla coda di recupero?")) return;
    try {
      const res = await fetch(`/api/email/queue?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-secret": adminSecret || "" }
      });
      if (res.ok) {
        await fetchQueue();
      }
    } catch (err) {
      console.warn("Failed to delete queue item:", err);
    }
  };

  const handleClearAllQueue = async () => {
    if (!confirm("Sei sicuro di voler svuotare l'intera coda di email fallite? Tutte le richieste non inviate verranno eliminate definitivamente.")) return;
    try {
      const res = await fetch("/api/email/queue?all=true", {
        method: "DELETE",
        headers: { "x-admin-secret": adminSecret || "" }
      });
      if (res.ok) {
        await fetchQueue();
      }
    } catch (err) {
      console.warn("Failed to clear queue:", err);
    }
  };

  // Subcases state
  const [selectedSubcaseId, setSelectedSubcaseId] = useState<string | null>(null);
  const [newSubcaseId, setNewSubcaseId] = useState("");
  const [newSubcaseName, setNewSubcaseName] = useState("");
  const [activeSubcaseIndex, setActiveSubcaseIndex] = useState<number>(0);
  const [newSubcaseFieldKey, setNewSubcaseFieldKey] = useState("");
  const [newSubcaseFieldValue, setNewSubcaseFieldValue] = useState("");

  // Field mapping state for JSONPath configuration
  const [newVarName, setNewVarName] = useState("");
  const [newVarPath, setNewVarPath] = useState("");

  // JSON Inspector / Custom Fields state
  const [jsonInput, setJsonInput] = useState<string>("");
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [copiedFieldPath, setCopiedFieldPath] = useState<string | null>(null);
  const [fieldSearchTerm, setFieldSearchTerm] = useState<string>("");

  // Sync jsonInput with activeTemplate.field_mapping.sample_payload_json
  useEffect(() => {
    if (activeTemplate?.field_mapping?.sample_payload_json) {
      setJsonInput(activeTemplate.field_mapping.sample_payload_json);
    } else {
      setJsonInput(DEFAULT_SAMPLE_TALLY_JSON);
    }
    setJsonParseError(null);
  }, [activeTemplate?.id]);

  // Parsed representation of jsonInput
  const parsedSampleJson = useMemo(() => {
    if (!jsonInput.trim()) return null;
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonParseError(null);
      return parsed;
    } catch (err: any) {
      setJsonParseError(err.message || "Sintassi JSON non valida.");
      return null;
    }
  }, [jsonInput]);

  // Extract fields from current JSON input
  const extractedFields: ExtractedJsonField[] = useMemo(() => {
    if (!parsedSampleJson) return [];
    return extractFieldsFromJson(parsedSampleJson);
  }, [parsedSampleJson]);

  // Add block modal state
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [lastExpandedBlockId, setLastExpandedBlockId] = useState<string | null>(null);

  // Media Library state for image blocks
  const [mediaPickerBlockId, setMediaPickerBlockId] = useState<string | null>(null);

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState<string>(settings.from_email || "");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sample variables for live preview (strictly parsed from JSON + custom mappings + selected subcase)
  // NO fake hardcoded defaults like "14 Novembre" or "Monsieur Hulot"
  const sampleVariables = useMemo(() => {
    const vars: Record<string, string> = {};

    if (parsedSampleJson) {
      const flattened = flattenJsonToDotNotation(parsedSampleJson);
      Object.assign(vars, flattened);
    }

    // Merge custom mapped variables
    if (activeTemplate?.field_mapping?.variables_mapping && parsedSampleJson) {
      for (const [varName, pathStr] of Object.entries(activeTemplate.field_mapping.variables_mapping)) {
        const val = getValueByJsonPath(parsedSampleJson, pathStr);
        if (val !== undefined && val !== null) {
          vars[varName] = String(val);
        }
      }
    }

    // Merge active subcase custom fields (if selected)
    if (selectedSubcaseId && Array.isArray(activeTemplate?.subcases)) {
      const sub = activeTemplate.subcases.find(
        (s) => s.id === selectedSubcaseId || s.name === selectedSubcaseId
      );
      if (sub?.custom_fields) {
        Object.assign(vars, sub.custom_fields);
      }
    }

    return vars;
  }, [parsedSampleJson, activeTemplate?.field_mapping?.variables_mapping, activeTemplate?.subcases, selectedSubcaseId]);

  // All available tags for autocomplete in text inputs & textareas
  const allAvailableTags = useMemo(() => {
    const map = new Map<string, { key: string; source?: string; example?: string }>();

    // 1. Standard tags
    const standardList = [
      { key: "name", example: "Mario Rossi", source: "standard" },
      { key: "email", example: "mario.rossi@example.com", source: "standard" },
      { key: "event_title", example: "Cineforum", source: "standard" },
      { key: "event_date", example: "14 Novembre 2026", source: "standard" },
      { key: "event_time", example: "20:30", source: "standard" },
      { key: "event_location", example: "Kulturhaus Helferei, Zurigo", source: "standard" },
      { key: "ticket_count", example: "2", source: "standard" },
      { key: "notes", example: "Posto riservato", source: "standard" },
      { key: "subcase", example: selectedSubcaseId || "default", source: "standard" }
    ];
    standardList.forEach((t) => map.set(t.key, t));

    // 2. Subcase custom fields
    (activeTemplate?.subcases || []).forEach((sub) => {
      if (sub.custom_fields) {
        Object.entries(sub.custom_fields).forEach(([k, val]) => {
          map.set(k, { key: k, source: "subcase", example: String(val) });
        });
      }
    });

    // 3. Custom variable mappings
    if (activeTemplate?.field_mapping?.variables_mapping) {
      Object.entries(activeTemplate.field_mapping.variables_mapping).forEach(([k, path]) => {
        map.set(k, { key: k, source: "mapping", example: path });
      });
    }

    // 4. Extracted fields from sample JSON
    extractedFields.forEach((f) => {
      if (f.path && !f.path.includes(" ") && f.path.length < 50) {
        if (!map.has(f.path)) {
          map.set(f.path, {
            key: f.path,
            source: "json",
            example: typeof f.sampleValue === "string" ? f.sampleValue : JSON.stringify(f.sampleValue)
          });
        }
      }
    });

    return Array.from(map.values());
  }, [activeTemplate?.subcases, activeTemplate?.field_mapping?.variables_mapping, extractedFields, selectedSubcaseId]);

  // Live evaluated technical fields (TO, Name, Subject, Preheader, From, Reply-To)
  const resolvedTechnicalFields = useMemo(() => {
    const payload = parsedSampleJson || {};
    const explicitToPath = activeTemplate?.field_mapping?.recipient_email_path || "";
    const explicitNamePath = activeTemplate?.field_mapping?.recipient_name_path || "";

    const activeSubcase = selectedSubcaseId && Array.isArray(activeTemplate?.subcases)
      ? activeTemplate.subcases.find((s) => s.id === selectedSubcaseId || s.name === selectedSubcaseId)
      : undefined;

    // 1. Resolve TO email
    let resolvedTo = "";
    let toSource = "";
    if (explicitToPath.trim()) {
      resolvedTo = resolveRecipientEmail(payload, explicitToPath);
      toSource = `to_path: ${explicitToPath}`;
      if (!resolvedTo && explicitToPath.includes("{{")) {
        resolvedTo = replaceVars(explicitToPath, sampleVariables, payload);
      }
    } else {
      resolvedTo = resolveRecipientEmail(payload);
      toSource = resolvedTo ? "rilevamento automatico diretto" : "nessun percorso to_path";
    }

    // 2. Resolve Recipient Name
    let resolvedName = "";
    let nameSource = "";
    if (explicitNamePath.trim()) {
      resolvedName = resolveRecipientName(payload, explicitNamePath);
      nameSource = `name_path: ${explicitNamePath}`;
      if (!resolvedName && explicitNamePath.includes("{{")) {
        resolvedName = replaceVars(explicitNamePath, sampleVariables, payload);
      }
    } else {
      resolvedName = resolveRecipientName(payload);
      nameSource = resolvedName ? "rilevamento automatico diretto" : "non specificato";
    }

    // 3. Resolve Subject & Preheader with dynamic variables and JSONPath
    const rawSubject = activeTemplate?.subject || "Notifica da Gli Attomatti";
    const resolvedSubject = replaceVars(rawSubject, sampleVariables, payload);

    const rawPreheader = activeTemplate?.preheader || "";
    const resolvedPreheader = replaceVars(rawPreheader, sampleVariables, payload);

    // 4. Resolve Sender Profile (Subcase -> Template -> Global Settings)
    const senderProfile = activeSubcase?.sender_profile || activeTemplate?.sender_profile || {};
    const rawFromName = senderProfile.from_name || settings.from_name || "Gli Attomatti";
    const resolvedFromName = replaceVars(rawFromName, sampleVariables, payload);
    const resolvedFromEmail = senderProfile.from_email || settings.from_email || "info@gliattomatti.ch";

    const rawReplyTo = senderProfile.reply_to || settings.reply_to || "";
    const resolvedReplyTo = replaceVars(rawReplyTo, sampleVariables, payload);

    return {
      to: resolvedTo,
      toConfigured: explicitToPath,
      toSource,
      name: resolvedName,
      nameConfigured: explicitNamePath,
      nameSource,
      subject: resolvedSubject,
      preheader: resolvedPreheader,
      from: `${resolvedFromName} <${resolvedFromEmail}>`,
      replyTo: resolvedReplyTo || "—",
      hasSampleJson: !!parsedSampleJson
    };
  }, [parsedSampleJson, activeTemplate, selectedSubcaseId, sampleVariables, settings]);

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://gliattomatti.ch";
  const siteBaseUrl =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
      ? window.location.origin
      : "https://gliattomatti.ch";
  const apiEndpointUrl = `${originUrl}/api/email/send?template=${activeTemplate?.id || "template-id"}&secret=TUO_SEGRETO`;

  // Get active blocks, converting legacy templates on the fly if needed
  const activeBlocks: EmailBlock[] = useMemo(() => {
    if (!activeTemplate) return [];
    return convertLegacyToBlocks(activeTemplate);
  }, [activeTemplate]);

  // Update whole template
  const handleUpdateTemplate = (updater: (prev: EmailTemplateConfig) => EmailTemplateConfig) => {
    if (selectedIndex < 0 || selectedIndex >= templates.length) return;
    const updated = [...templates];
    updated[selectedIndex] = updater(updated[selectedIndex]);
    updateContent("emails.templates", updated);
  };

  // Field mapping handlers for uncontrolled payloads / JSONPath
  const fieldMapping: EmailFieldMapping = activeTemplate?.field_mapping || {};

  const handleUpdateFieldMapping = (patch: Partial<EmailFieldMapping>) => {
    handleUpdateTemplate((t) => ({
      ...t,
      field_mapping: {
        ...(t.field_mapping || {}),
        ...patch
      }
    }));
  };

  const handleAddVariableMapping = () => {
    if (!newVarName.trim() || !newVarPath.trim()) return;
    const currentVars = fieldMapping.variables_mapping || {};
    handleUpdateFieldMapping({
      variables_mapping: {
        ...currentVars,
        [newVarName.trim()]: newVarPath.trim()
      }
    });
    setNewVarName("");
    setNewVarPath("");
  };

  const handleRemoveVariableMapping = (varName: string) => {
    const currentVars = { ...(fieldMapping.variables_mapping || {}) };
    delete currentVars[varName];
    handleUpdateFieldMapping({
      variables_mapping: currentVars
    });
  };

  const handleSaveJsonPayload = (newJson: string) => {
    setJsonInput(newJson);
    try {
      if (newJson.trim()) {
        JSON.parse(newJson);
      }
      handleUpdateFieldMapping({ sample_payload_json: newJson });
      setJsonParseError(null);
    } catch (err: any) {
      setJsonParseError(err.message || "Sintassi JSON non valida.");
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      handleSaveJsonPayload(formatted);
    } catch (err: any) {
      setJsonParseError(err.message || "Impossibile formattare: JSON non valido.");
    }
  };

  const handleLoadSampleJson = () => {
    const sample = {
      pippo: "mario.rossi@example.com",
      cliente: {
        nome: "Mario Rossi",
        telefono: "+41 79 123 45 67",
        citta: "Zurigo"
      },
      ordine: {
        id: "ORD-2026-9874",
        data_acquisto: "04/10/2026",
        totale_chf: "35.00"
      },
      evento: {
        titolo: "Le vacanze di Monsieur Hulot",
        data: "14 Novembre 2026",
        ora: "20:30",
        luogo: "Kulturhaus Helferei, Zurigo",
        posto: "Fila 3, Poltrona 12"
      }
    };
    handleSaveJsonPayload(JSON.stringify(sample, null, 2));
  };

  const handleCopyFieldVar = (path: string) => {
    const textToCopy = `{{${path}}}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedFieldPath(path);
    setTimeout(() => setCopiedFieldPath(null), 2000);
  };

  // Block handlers
  const handleUpdateBlocks = (newBlocks: EmailBlock[]) => {
    handleUpdateTemplate((t) => ({ ...t, blocks: newBlocks }));
  };

  const handleUpdateSingleBlock = (id: string, patch: Partial<EmailBlock>) => {
    const updated = activeBlocks.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b));
    handleUpdateBlocks(updated);
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeBlocks.length) return;
    const updated = [...activeBlocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    handleUpdateBlocks(updated);
  };

  const handleDeleteBlock = (index: number) => {
    const updated = activeBlocks.filter((_, i) => i !== index);
    handleUpdateBlocks(updated);
  };

  const handleDuplicateBlock = (index: number) => {
    const source = activeBlocks[index];
    if (!source) return;
    const duplicated: EmailBlock = {
      ...source,
      id: `block-${Date.now()}`
    };
    const updated = [...activeBlocks];
    updated.splice(index + 1, 0, duplicated);
    handleUpdateBlocks(updated);
  };

  const handleAddBlock = (type: EmailBlockType) => {
    const newId = `block-${Date.now()}`;
    let newBlock: EmailBlock;

    switch (type) {
      case "header":
        newBlock = { id: newId, type: "header", brand_name: "GLI ATTOMATTI", tagline: "", align: "center" };
        break;
      case "badge":
        newBlock = { id: newId, type: "badge", text: "Notifica Speciale", align: "center" };
        break;
      case "heading":
        newBlock = { id: newId, type: "heading", text: "Titolo dell'Email", level: "h1", align: "left" };
        break;
      case "text":
        newBlock = { id: newId, type: "text", content: "Ciao {{name}},\n\nquesto è un paragrafo di esempio. Puoi usare il **grassetto** e inserire [link personalizzati](https://gliattomatti.ch).", align: "left" };
        break;
      case "button":
        newBlock = { id: newId, type: "button", label: "Scopri i Dettagli", url: "https://gliattomatti.ch", align: "center", style: "pill" };
        break;
      case "info_box":
        newBlock = {
          id: newId,
          type: "info_box",
          title: "Dettagli Evento",
          items: [
            { label: "Data", value: "" },
            { label: "Luogo", value: "" }
          ]
        };
        break;
      case "calendar":
        newBlock = {
          id: newId,
          type: "calendar",
          header_label: "Promemoria Evento in Agenda",
          title: "Spettacolo Teatrale Gli Attomatti",
          start_date: "{{event_date}}",
          end_date: "",
          location: "Balberstrasse 47, Zurich (Wollishofen)",
          description: "Ti aspettiamo in sala!",
          align: "center"
        };
        break;
      case "image":
        newBlock = {
          id: newId,
          type: "image",
          image_url: `${siteBaseUrl}/images/1782553290530-TheaterCurtain.webp`,
          alt: "Locandina Evento",
          align: "center",
          full_width: false
        };
        break;
      case "two_column":
        newBlock = { id: newId, type: "two_column", col1_title: "Ingresso in Sala", col1_text: "Apertura porte 30 minuti prima dell'inizio.", col2_title: "Come Raggiungerci", col2_text: "Fermata tram nelle immediate vicinanze." };
        break;
      case "divider":
        newBlock = { id: newId, type: "divider", style: "gradient", spacing: "md" };
        break;
      case "social_links":
        newBlock = { id: newId, type: "social_links", website_url: "https://gliattomatti.ch", instagram_url: "https://instagram.com/gliattomatti", align: "center" };
        break;
      case "footer":
        newBlock = { id: newId, type: "footer", legal_text: "Compagnia Teatrale Amatoriale Gli Attomatti • Zurigo, Svizzera", privacy_note: "Ricevi questa email in seguito a una tua richiesta sul sito.", show_privacy_link: true };
        break;
    }

    // Determine insertion position: immediately after the currently or last expanded block
    const targetId = expandedBlockId || lastExpandedBlockId;
    const targetIndex = targetId ? activeBlocks.findIndex((b) => b.id === targetId) : -1;

    let updated: EmailBlock[];
    if (targetIndex !== -1) {
      updated = [
        ...activeBlocks.slice(0, targetIndex + 1),
        newBlock,
        ...activeBlocks.slice(targetIndex + 1)
      ];
    } else {
      updated = [...activeBlocks, newBlock];
    }

    handleUpdateBlocks(updated);
    setExpandedBlockId(newId);
    setLastExpandedBlockId(newId);
    setIsAddBlockOpen(false);
  };

  // Add new template
  const handleAddTemplate = () => {
    const newId = `template-${Date.now()}`;
    const newTpl: EmailTemplateConfig = {
      id: newId,
      name: "Nuovo Template Componibile",
      enabled: true,
      subject: "Notifica: {{event_title}} — Gli Attomatti",
      preheader: "Dettagli importanti sulla tua partecipazione",
      theme: "default",
      blocks: [
        { id: "b1", type: "header", brand_name: "GLI ATTOMATTI", tagline: "", align: "center" },
        { id: "b2", type: "badge", text: "Conferma Iscrizione", align: "center" },
        { id: "b3", type: "heading", text: "La tua prenotazione è confermata!", level: "h1", align: "left" },
        { id: "b4", type: "text", content: "Ciao {{name}},\n\nabbiamo ricevuto la tua registrazione per **{{event_title}}**.\n\nTi aspettiamo in sala!", align: "left" },
        { id: "b5", type: "button", label: "Dettagli Evento", url: "https://gliattomatti.ch", align: "center", style: "pill" },
        { id: "b6", type: "divider", style: "gradient", spacing: "md" },
        { id: "b7", type: "footer", legal_text: "Compagnia Teatrale Amatoriale Gli Attomatti • Zurigo, Svizzera", privacy_note: "Ricevi questa email in seguito a una registrazione.", show_privacy_link: true }
      ]
    };
    const updated = [...templates, newTpl];
    updateContent("emails.templates", updated);
    setSelectedIndex(updated.length - 1);
  };

  // Duplicate template
  const handleDuplicateTemplate = (idx: number) => {
    const source = templates[idx];
    if (!source) return;
    const duplicated: EmailTemplateConfig = {
      ...source,
      id: `template-${Date.now()}`,
      name: `${source.name || "Template"} (Copia)`
    };
    const updated = [...templates, duplicated];
    updateContent("emails.templates", updated);
    setSelectedIndex(updated.length - 1);
  };

  // Delete template
  const handleDeleteTemplate = (idx: number) => {
    if (templates.length <= 1) {
      alert("Deve essere presente almeno un template email.");
      return;
    }
    if (confirm(`Sei sicuro di voler eliminare il template "${templates[idx]?.name}"?`)) {
      const updated = templates.filter((_, i) => i !== idx);
      updateContent("emails.templates", updated);
      setSelectedIndex(0);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      setTestResult({ type: "error", message: "Inserisci un indirizzo email di destinazione valido." });
      return;
    }
    if (!activeTemplate) return;

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const templateToTest: EmailTemplateConfig = {
        ...activeTemplate,
        blocks: activeBlocks
      };

      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || ""
        },
        body: JSON.stringify({
          to: testEmailAddress.trim(),
          template: templateToTest,
          variables: sampleVariables,
          rawJsonObj: parsedSampleJson,
          subcaseId: selectedSubcaseId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setTestResult({ type: "error", message: data.error || "Errore durante l'invio della prova." });
      } else {
        setTestResult({
          type: "success",
          message: data.message || "Email inviata con successo!"
        });
      }
    } catch (err: any) {
      setTestResult({ type: "error", message: err.message || "Errore di connessione." });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Resolved theme for preview
  const resolvedColors = useMemo(() => {
    if (!activeTemplate) return LANDING_THEME_PRESETS[0].colors;
    return resolveEmailTheme(activeTemplate.theme || "default", landings, activeTemplate.customColors);
  }, [activeTemplate, landings]);

  // Live HTML preview
  const livePreviewHtml = useMemo(() => {
    if (!activeTemplate) return "";
    const tplWithBlocks: EmailTemplateConfig = {
      ...activeTemplate,
      blocks: activeBlocks
    };
    return renderEmailHtml({
      template: tplWithBlocks,
      variables: sampleVariables,
      rawJsonObj: parsedSampleJson,
      themeColors: resolvedColors,
      settings,
      baseUrl: siteBaseUrl
    });
  }, [activeTemplate, activeBlocks, sampleVariables, parsedSampleJson, resolvedColors, settings, siteBaseUrl]);

  // Open live HTML in a clean new tab
  const handleOpenInNewTab = () => {
    if (!livePreviewHtml) return;
    const blob = new Blob([livePreviewHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-8 w-full max-w-[1850px] pb-24">
      {/* Header Overview Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10 border border-foreground/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                Email Studio & Builder No-Code
              </h2>
              <p className="text-sm text-foreground/70">
                Costruisci email modulari a componenti in pieno stile Salesforce Marketing Cloud, personalizza ogni colore ed esponi l'API universale.
              </p>
            </div>
          </div>
        </div>

        {/* Universal Trigger Pills */}
        <div className="pt-4 border-t border-foreground/10 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
            <Code size={14} className="text-primary" />
            <span>Attivazione da qualsiasi bottone:</span>
            <code className="bg-background/60 px-2 py-0.5 rounded border border-foreground/10 text-primary font-mono select-all">
              href="#email:{activeTemplate?.id || 'template-id'}"
            </code>
          </div>

          <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
            <Tag size={14} className="text-accent" />
            <span>REST API Endpoint:</span>
            <code className="bg-background/60 px-2 py-0.5 rounded border border-foreground/10 text-accent font-mono select-all">
              POST /api/email/send?template={activeTemplate?.id || 'template-id'}
            </code>
          </div>
        </div>
      </div>

      {/* General Settings Accordion */}
      <AdminSection
        title="Mittente & Impostazioni Generali"
        description="Nome, indirizzo mittente certificato e casella di ricezione risposte."
        icon={Sliders}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FormField
            label="Nome Mittente"
            value={settings.from_name ?? "Gli Attomatti"}
            onChange={(v) => updateContent("emails.settings.from_name", v)}
            placeholder="Gli Attomatti"
          />
          <FormField
            label="Email Mittente"
            value={settings.from_email ?? "info@gliattomatti.ch"}
            onChange={(v) => updateContent("emails.settings.from_email", v)}
            placeholder="info@gliattomatti.ch"
            helpText="Dominio verificato su Resend."
          />
          <FormField
            label="Reply-To (Risposte Partecipanti)"
            value={settings.reply_to ?? "compagniateatralegliattomatti@gmail.com"}
            onChange={(v) => updateContent("emails.settings.reply_to", v)}
            placeholder="compagniateatralegliattomatti@gmail.com"
            helpText="Qualsiasi email (anche una casella Gmail)."
          />
          <FormField
            label="Email Notifiche Cron DLQ"
            value={settings.dlq_alert_email ?? "compagniateatralegliattomatti@gmail.com"}
            onChange={(v) => updateContent("emails.settings.dlq_alert_email", v)}
            placeholder="admin@gliattomatti.ch"
            helpText="Riceve l'alert ogni notte alle 00:10 UTC se ci sono email bloccate in coda."
          />
        </div>
      </AdminSection>

      {/* Main Studio Area */}
      <div className="space-y-6">
        {/* Template Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-muted/30 border border-foreground/5">
            {templates.map((tpl, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tpl.id || idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                    isSelected
                      ? "bg-foreground text-background shadow-xs"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tpl.enabled !== false ? "bg-emerald-400" : "bg-zinc-500"}`} />
                  <span>{tpl.name || `Template ${idx + 1}`}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-md"
            >
              <Plus size={16} /> Nuovo Template
            </button>
          </div>
        </div>

        {activeTemplate && (
          <div className="space-y-6">
            {/* Template Sub-Nav Switcher & Global Actions */}
            <div className="flex flex-wrap items-center justify-between border-b border-foreground/10 pb-2 gap-4 text-xs font-bold uppercase tracking-wider">
              <div className="flex flex-wrap items-center gap-2 sm:gap-6">
                {/* 1. Tema & Colori */}
                <button
                  type="button"
                  onClick={() => setActiveTabSection("theme")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTabSection === "theme" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Palette size={15} /> Tema & Colori
                </button>

                {/* 2. Dettagli Email */}
                <button
                  type="button"
                  onClick={() => setActiveTabSection("details")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTabSection === "details" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Mail size={15} /> Dettagli Email
                </button>

                {/* 3. Componenti */}
                <button
                  type="button"
                  onClick={() => setActiveTabSection("builder")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTabSection === "builder" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Layers size={15} /> Componenti ({activeBlocks.length})
                </button>

                {/* 4. Personalizzazione (Campi, JSON & Subcases) */}
                <button
                  type="button"
                  onClick={() => setActiveTabSection("personalization")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTabSection === "personalization" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Sliders size={15} /> Personalizzazione {activeTemplate.subcases?.length ? `(${activeTemplate.subcases.length})` : ""}
                </button>

                {/* 5. Integrazione (API & Trigger) */}
                <button
                  type="button"
                  onClick={() => setActiveTabSection("api")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTabSection === "api" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Code size={15} /> Integrazione (API & Trigger)
                </button>

                {/* 6. Anteprima */}
                <button
                  type="button"
                  onClick={() => setActiveTabSection("preview")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTabSection === "preview" ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <Eye size={15} /> Anteprima Tutta Pagina
                </button>

                {/* 7. Coda Errori (DLQ) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabSection("queue");
                    fetchQueue();
                  }}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTabSection === "queue" ? "border-rose-400 text-rose-400 font-bold" : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <RotateCcw size={15} className={queueItems.length > 0 ? "text-rose-400 animate-spin-slow" : ""} />
                  <span>Coda Errori</span>
                  {queueItems.length > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black">
                      {queueItems.length}
                    </span>
                  ) : null}
                </button>
              </div>

              <div className="flex items-center gap-2 pb-2">
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-xs text-foreground font-bold transition-all cursor-pointer border border-foreground/10 hover:border-foreground/20 shadow-xs"
                  title="Apri l'anteprima dell'email in una nuova scheda del browser a grandezza naturale"
                >
                  <ExternalLink size={14} className="text-primary" />
                  <span>Apri in Nuova Scheda</span>
                </button>
              </div>
            </div>

            {/* DLQ Alert Warning Banner when queue has failed emails */}
            {queueItems.length > 0 && activeTabSection !== "queue" && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-300">
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={18} className="text-rose-400 shrink-0" />
                  <span>
                    <strong>Attenzione:</strong> Ci sono <strong>{queueItems.length} email in coda di errore</strong> non consegnate (per limite Resend o errori temporanei).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabSection("queue");
                    fetchQueue();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
                >
                  Visualizza & Riprova Invii
                </button>
              </div>
            )}

            {/* FULL-WIDTH PREVIEW SECTION */}
            {activeTabSection === "preview" ? (
              <div className="space-y-6 w-full">
                {/* Full-width Preview Toolbar */}
                <div className="p-4 sm:p-5 rounded-3xl bg-muted/20 border border-foreground/5 glass flex flex-wrap items-center justify-between gap-4">
                  {/* Left: Device Switcher */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground/60 mr-2 flex items-center gap-1.5">
                      <Eye size={15} /> Modalità Display:
                    </span>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-foreground/5 border border-foreground/5 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                          previewDevice === "mobile" ? "bg-foreground text-background shadow-xs" : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        <Smartphone size={14} />
                        <span>Mobile (375px)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                          previewDevice === "desktop" ? "bg-foreground text-background shadow-xs" : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        <Monitor size={14} />
                        <span>Standard (650px)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("fluid")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                          previewDevice === "fluid" ? "bg-foreground text-background shadow-xs" : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        <Maximize2 size={14} />
                        <span>Fluido / Widescreen</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Quick JSON Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsPreviewJsonOpen(!isPreviewJsonOpen)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
                        isPreviewJsonOpen
                          ? "bg-primary text-background border-primary"
                          : "bg-foreground/5 text-foreground/80 border-foreground/10 hover:border-foreground/20"
                      }`}
                    >
                      <FileJson size={14} />
                      <span>{isPreviewJsonOpen ? "Chiudi JSON" : "Modifica JSON"}</span>
                      {parsedSampleJson && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      )}
                    </button>

                    {/* Quick Send Test */}
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="latuaemail@example.com"
                        className="w-48 sm:w-60 px-3 py-1.5 rounded-xl bg-background/50 border border-foreground/10 text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        disabled={isSendingTest}
                        onClick={handleSendTestEmail}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs shrink-0"
                      >
                        <Send size={12} />
                        <span>{isSendingTest ? "..." : "Spedisci"}</span>
                      </button>
                    </div>

                    {/* Open in New Tab Button */}
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-background font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-sm shrink-0"
                    >
                      <ExternalLink size={14} />
                      <span>Apri in Nuova Scheda</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible JSON Test Drawer */}
                {isPreviewJsonOpen && (
                  <div className="p-5 rounded-3xl bg-muted/30 border border-primary/20 glass space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/5 pb-2">
                      <div className="flex items-center gap-2">
                        <FileJson size={16} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-wider text-foreground">
                          Payload JSON di Test (Aggiorna Live Anteprima e Campi Tecnici)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setJsonInput(DEFAULT_SAMPLE_TALLY_JSON);
                            if (activeTemplate?.id) {
                              handleUpdateFieldMapping({ sample_payload_json: DEFAULT_SAMPLE_TALLY_JSON });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-[11px] font-bold text-foreground transition-colors cursor-pointer"
                        >
                          Carica Esempio Tally
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const obj = JSON.parse(jsonInput);
                              const formatted = JSON.stringify(obj, null, 2);
                              setJsonInput(formatted);
                              if (activeTemplate?.id) {
                                handleUpdateFieldMapping({ sample_payload_json: formatted });
                              }
                            } catch {}
                          }}
                          className="px-2.5 py-1 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-[11px] font-bold text-foreground transition-colors cursor-pointer"
                        >
                          Formatta
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setJsonInput("");
                            if (activeTemplate?.id) {
                              handleUpdateFieldMapping({ sample_payload_json: "" });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-foreground/10 hover:bg-rose-500/20 text-[11px] font-bold text-foreground/70 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          Pulisci
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={6}
                      value={jsonInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setJsonInput(val);
                        if (activeTemplate?.id) {
                          handleUpdateFieldMapping({ sample_payload_json: val });
                        }
                      }}
                      placeholder='Incolla qui il JSON di test (es. webhook da Tally)...'
                      className="w-full p-3 rounded-2xl bg-black/50 border border-foreground/10 text-xs font-mono text-emerald-300 focus:outline-none focus:border-primary resize-y"
                    />

                    {jsonParseError ? (
                      <div className="text-xs text-rose-400 flex items-center gap-1.5 font-mono">
                        <AlertCircle size={13} />
                        <span>{jsonParseError}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-foreground/50 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>JSON valido. Tutti i campi e placeholder vengono iniettati in tempo reale nell'anteprima sottostante.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TECHNICAL HEADERS & METADATA INSPECTOR */}
                <div className="p-4 sm:p-5 rounded-3xl bg-muted/20 border border-foreground/10 glass space-y-3">
                  <div className="flex items-center justify-between border-b border-foreground/5 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Sliders size={14} /> Campi Tecnici Risolti (Header Live)
                    </span>
                    <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${
                      resolvedTechnicalFields.hasSampleJson
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-foreground/5 text-foreground/50"
                    }`}>
                      {resolvedTechnicalFields.hasSampleJson ? "Valutato da JSON attivo" : "Valori Predefiniti"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* TO */}
                    <div className="p-3 rounded-2xl bg-background/50 border border-foreground/5 space-y-1">
                      <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider block">
                        Destinatario (TO)
                      </span>
                      <div className="font-mono font-bold text-emerald-400 break-all text-xs">
                        {resolvedTechnicalFields.to || "(Nessun indirizzo trovato)"}
                      </div>
                      <div className="text-[10px] text-foreground/40 font-mono truncate" title={resolvedTechnicalFields.toSource}>
                        Fonte: {resolvedTechnicalFields.toSource}
                      </div>
                    </div>

                    {/* NAME */}
                    <div className="p-3 rounded-2xl bg-background/50 border border-foreground/5 space-y-1">
                      <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider block">
                        Nome Destinatario
                      </span>
                      <div className="font-bold text-foreground break-all text-xs">
                        {resolvedTechnicalFields.name || "(Nessun nome)"}
                      </div>
                      <div className="text-[10px] text-foreground/40 font-mono truncate" title={resolvedTechnicalFields.nameSource}>
                        Fonte: {resolvedTechnicalFields.nameSource}
                      </div>
                    </div>

                    {/* FROM */}
                    <div className="p-3 rounded-2xl bg-background/50 border border-foreground/5 space-y-1">
                      <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider block">
                        Mittente (FROM)
                      </span>
                      <div className="font-mono text-foreground font-semibold break-all text-xs">
                        {resolvedTechnicalFields.from}
                      </div>
                      <div className="text-[10px] text-foreground/40 font-mono truncate">
                        Reply-To: {resolvedTechnicalFields.replyTo}
                      </div>
                    </div>

                    {/* SUBJECT */}
                    <div className="p-3 rounded-2xl bg-background/50 border border-foreground/5 space-y-1">
                      <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider block">
                        Oggetto (SUBJECT)
                      </span>
                      <div className="font-semibold text-foreground break-words text-xs">
                        {resolvedTechnicalFields.subject || "(Nessun oggetto)"}
                      </div>
                      {resolvedTechnicalFields.preheader && (
                        <div className="text-[10px] text-foreground/50 italic truncate" title={resolvedTechnicalFields.preheader}>
                          Preheader: {resolvedTechnicalFields.preheader}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      testResult.type === "success"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    }`}
                  >
                    {testResult.type === "success" ? (
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Full-width Email Studio Canvas */}
                <div className="w-full flex justify-center bg-slate-950/70 p-4 sm:p-8 md:p-12 rounded-3xl border border-foreground/10 overflow-hidden shadow-2xl min-h-[900px]">
                  <div
                    className={`transition-all duration-300 overflow-hidden shadow-2xl rounded-2xl border border-foreground/15 ${
                      previewDevice === "mobile"
                        ? "w-[375px]"
                        : previewDevice === "desktop"
                        ? "w-full max-w-[650px]"
                        : "w-full max-w-5xl"
                    }`}
                  >
                    <iframe
                      title="Email Studio Live Preview Fullscreen"
                      srcDoc={livePreviewHtml}
                      className="w-full h-[880px] bg-slate-900 border-0"
                    />
                  </div>
                </div>
              </div>
            ) : activeTabSection === "queue" ? (
              /* FULL-WIDTH DEAD LETTER QUEUE (DLQ) SECTION */
              <div className="space-y-6 w-full">
                {/* DLQ Header & Action Bar */}
                <div className="p-6 md:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/5 pb-4">
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                        <RotateCcw size={18} className="text-rose-400" />
                        Coda Errori & Invii Falliti (Dead Letter Queue)
                      </h4>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Cattura tutte le email non consegnate (limite 100/giorno di Resend, disservizi o errori di rete). Puoi ritriggerarle in qualsiasi momento.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchQueue}
                        disabled={isLoadingQueue}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-xs font-bold text-foreground transition-all cursor-pointer border border-foreground/10"
                        title="Ricarica stato coda"
                      >
                        <RotateCcw size={13} className={isLoadingQueue ? "animate-spin" : ""} />
                        <span>Aggiorna</span>
                      </button>

                      {queueItems.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleClearAllQueue}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-400 transition-all cursor-pointer border border-rose-500/20"
                            title="Elimina tutte le email in coda"
                          >
                            <Trash2 size={13} />
                            <span>Svuota Coda</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRetryAll}
                            disabled={isRetryingQueue}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-background font-black text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                          >
                            <Send size={13} />
                            <span>{isRetryingQueue ? "Re-invio in corso..." : `Riprova Tutte (${queueItems.length})`}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {queueMessage && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
                        queueMessage.type === "success"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {queueMessage.type === "success" ? (
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-rose-400 shrink-0" />
                        )}
                        <span>{queueMessage.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQueueMessage(null)}
                        className="text-foreground/40 hover:text-foreground cursor-pointer text-xs"
                      >
                        Chiudi
                      </button>
                    </div>
                  )}

                  {/* Cron Notification Configuration Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-foreground/[0.03] border border-foreground/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span>Notifica Automatica Cron (Mezzanotte e 10 UTC)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-mono font-medium border border-amber-400/20">
                              10 0 * * *
                            </span>
                          </div>
                          <p className="text-[11px] text-foreground/60 mt-0.5">
                            Se ci sono email non recapitate in coda, invia un alert 10 minuti dopo il ripristino della quota giornaliera di 100 email di Resend.
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 bg-background/50 px-3 py-1.5 rounded-xl border border-foreground/10">
                        <input
                          type="checkbox"
                          checked={settings.dlq_alert_enabled !== false}
                          onChange={(e) => updateContent("emails.settings.dlq_alert_enabled", e.target.checked)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                        <span className="text-xs font-bold text-foreground">
                          {settings.dlq_alert_enabled !== false ? "Notifica Attiva" : "Disattivata"}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-foreground/5 items-end">
                      <div className="sm:col-span-2">
                        <FormField
                          label="Email Admin per la Notifica"
                          value={settings.dlq_alert_email ?? "compagniateatralegliattomatti@gmail.com"}
                          onChange={(v) => updateContent("emails.settings.dlq_alert_email", v)}
                          placeholder="compagniateatralegliattomatti@gmail.com"
                          helpText="Riceverà l'avviso con l'elenco delle email bloccate e il link rapido per ritriggerarle."
                        />
                      </div>
                      <div className="pb-1">
                        <button
                          type="button"
                          onClick={handleTestDlqNotify}
                          disabled={isTestingDlqNotify}
                          className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-xs font-bold text-foreground border border-foreground/15 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Bell size={13} className={isTestingDlqNotify ? "animate-bounce" : ""} />
                          <span>{isTestingDlqNotify ? "Invio test in corso..." : "Invia Test Notifica"}</span>
                        </button>
                      </div>
                    </div>

                    {notifyTestResult && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                          notifyTestResult.type === "success"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {notifyTestResult.type === "success" ? (
                            <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                          ) : (
                            <AlertCircle size={14} className="shrink-0 text-rose-400" />
                          )}
                          <span>{notifyTestResult.text}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifyTestResult(null)}
                          className="text-foreground/40 hover:text-foreground text-[11px] cursor-pointer"
                        >
                          Chiudi
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Empty State */}
                  {queueItems.length === 0 && !isLoadingQueue && (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                        <CheckCircle2 size={28} />
                      </div>
                      <h5 className="text-sm font-bold text-foreground">Nessuna email in errore</h5>
                      <p className="text-xs text-foreground/50 max-w-md mx-auto">
                        Tutte le email transazionali inviate sono state consegnate correttamente. In caso di quota Resend superata o errori di rete, compariranno automaticamente qui per essere ritriggerate.
                      </p>
                    </div>
                  )}

                  {/* Queue Items List */}
                  {queueItems.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {queueItems.map((item) => {
                        const isExpanded = expandedQueueId === item.id;
                        const isRetrying = retryingQueueId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-3 transition-all hover:border-foreground/20"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {/* Left Info */}
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-foreground">
                                    {Array.isArray(item.recipient.email) ? item.recipient.email.join(", ") : item.recipient.email}
                                  </span>
                                  {item.recipient.name && (
                                    <span className="text-[11px] text-foreground/60">
                                      ({item.recipient.name})
                                    </span>
                                  )}
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 text-foreground/60 font-mono">
                                    {item.templateId || "Template generico"}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
                                    {item.attempts} {item.attempts === 1 ? "tentativo" : "tentativi"}
                                  </span>
                                </div>

                                <div className="text-xs text-foreground/80 font-medium">
                                  Oggetto: <span className="text-foreground">{item.subject}</span>
                                </div>
                                <div className="text-[11px] text-foreground/40 font-mono">
                                  Fallita il: {new Date(item.createdAt).toLocaleString("it-IT")}
                                </div>
                              </div>

                              {/* Right Actions */}
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setExpandedQueueId(isExpanded ? null : item.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-foreground text-[11px] font-semibold transition-colors cursor-pointer border border-foreground/5"
                                >
                                  {isExpanded ? "Nascondi Payload" : "Vedi Payload"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQueueItem(item.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                  title="Scarta da coda"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  disabled={isRetrying || isRetryingQueue}
                                  onClick={() => handleRetrySingle(item.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-background font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                                >
                                  <Send size={12} />
                                  <span>{isRetrying ? "Invio..." : "Riprova"}</span>
                                </button>
                              </div>
                            </div>

                            {/* Error Reason Banner */}
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-xs">
                              <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-rose-400 mr-2">Motivo Errore:</span>
                                <span className="font-mono text-rose-300">{item.error.message}</span>
                              </div>
                            </div>

                            {/* Expanded Payload & Inspection */}
                            {isExpanded && (
                              <div className="p-4 rounded-xl bg-slate-950 border border-foreground/10 space-y-2 text-xs font-mono">
                                <div className="text-[11px] text-foreground/50 font-bold uppercase tracking-wider">
                                  Dettagli Richiesta Originale & Payload:
                                </div>
                                <pre className="text-[11px] text-emerald-400 overflow-x-auto max-h-60 p-2 rounded bg-black/40 border border-foreground/5">
                                  {JSON.stringify(
                                    {
                                      id: item.id,
                                      templateId: item.templateId,
                                      subcaseId: item.subcaseId,
                                      recipient: item.recipient,
                                      subject: item.subject,
                                      originalRequest: item.originalRequest,
                                      compiledOptions: {
                                        to: item.compiledOptions.to,
                                        subject: item.compiledOptions.subject,
                                        from: item.compiledOptions.from,
                                        replyTo: item.compiledOptions.replyTo,
                                        hasAttachments: Boolean(item.compiledOptions.attachments?.length)
                                      }
                                    },
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 6 Cols: Builder Controls */}
                <div className="lg:col-span-6 space-y-6">

              {/* SECTION 1: THEME & COLOR CUSTOMIZER */}
              {activeTabSection === "theme" && (
                <div className="p-6 md:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
                  <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tight text-foreground">
                        Personalizzazione Stile & Palette Colori
                      </h4>
                      <p className="text-xs text-foreground/60">
                        Scegli una base dai preset ufficiali o personalizza manualmente ogni singola tonalità dell'email.
                      </p>
                    </div>
                  </div>

                  {/* Preset Suggestions */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block">
                      Preset Consigliati & Temi Landing:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateTemplate((t) => ({ ...t, theme: "default", customColors: undefined }))}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          activeTemplate.theme === "default" && !activeTemplate.customColors
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-background/40 border-foreground/5 text-foreground/70 hover:border-foreground/20"
                        }`}
                      >
                        <span className="font-bold text-xs block">Ufficiale Attomatti</span>
                        <span className="text-[10px] text-foreground/50 block">Ardesia & Rosa</span>
                      </button>

                      {LANDING_THEME_PRESETS.filter((p) => p.id !== "default").map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleUpdateTemplate((t) => ({ ...t, theme: preset.id, customColors: undefined }))}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            activeTemplate.theme === preset.id && !activeTemplate.customColors
                              ? "bg-primary/10 border-primary text-foreground"
                              : "bg-background/40 border-foreground/5 text-foreground/70 hover:border-foreground/20"
                          }`}
                        >
                          <span className="font-bold text-xs block">{preset.name}</span>
                          <span className="text-[10px] text-foreground/50 block">{preset.tagline}</span>
                        </button>
                      ))}

                      {landings.map((l) => (
                        <button
                          key={l.id || l.slug}
                          type="button"
                          onClick={() => handleUpdateTemplate((t) => ({ ...t, theme: l.slug, customColors: undefined }))}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            activeTemplate.theme === l.slug && !activeTemplate.customColors
                              ? "bg-primary/10 border-primary text-foreground"
                              : "bg-background/40 border-foreground/5 text-foreground/70 hover:border-foreground/20"
                          }`}
                        >
                          <span className="font-bold text-xs block">Landing: {l.slug}</span>
                          <span className="text-[10px] text-foreground/50 block">{l.title || "Tema dedicato"}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Color Pickers */}
                  <div className="pt-4 border-t border-foreground/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                        Override Colori Personalizzati:
                      </span>
                      {activeTemplate.customColors && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTemplate((t) => ({ ...t, customColors: undefined }))}
                          className="inline-flex items-center gap-1 text-[11px] text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                        >
                          <RotateCcw size={12} /> Ripristina Preset
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Canvas Background */}
                      <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Sfondo Canvas Esterno</span>
                          <span className="text-[10px] text-foreground/50 block">Colore sfondo principale</span>
                        </div>
                        <input
                          type="color"
                          value={resolvedColors.background}
                          onChange={(e) => {
                            const newColors = { ...(activeTemplate.customColors || {}), background: e.target.value };
                            handleUpdateTemplate((t) => ({ ...t, customColors: newColors }));
                          }}
                          className="w-9 h-9 rounded-xl border border-foreground/15 cursor-pointer bg-transparent"
                        />
                      </div>

                      {/* Card Background */}
                      <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Sfondo Card Centrale</span>
                          <span className="text-[10px] text-foreground/50 block">Superficie del contenuto</span>
                        </div>
                        <input
                          type="color"
                          value={resolvedColors.muted}
                          onChange={(e) => {
                            const newColors = { ...(activeTemplate.customColors || {}), muted: e.target.value };
                            handleUpdateTemplate((t) => ({ ...t, customColors: newColors }));
                          }}
                          className="w-9 h-9 rounded-xl border border-foreground/15 cursor-pointer bg-transparent"
                        />
                      </div>

                      {/* Primary Color (Buttons) */}
                      <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Colore Primario Pulsanti</span>
                          <span className="text-[10px] text-foreground/50 block">CTA e accenti principali</span>
                        </div>
                        <input
                          type="color"
                          value={resolvedColors.primary}
                          onChange={(e) => {
                            const newPrimary = e.target.value;
                            const newColors = {
                              ...(activeTemplate.customColors || {}),
                              primary: newPrimary,
                              primaryForeground: getAutoContrastColor(newPrimary)
                            };
                            handleUpdateTemplate((t) => ({ ...t, customColors: newColors }));
                          }}
                          className="w-9 h-9 rounded-xl border border-foreground/15 cursor-pointer bg-transparent"
                        />
                      </div>

                      {/* Text on Primary */}
                      <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Testo sul Pulsante</span>
                          <span className="text-[10px] text-foreground/50 block">Calcolato per contrasto leggibile</span>
                        </div>
                        <input
                          type="color"
                          value={resolvedColors.primaryForeground || "#000000"}
                          onChange={(e) => {
                            const newColors = { ...(activeTemplate.customColors || {}), primaryForeground: e.target.value };
                            handleUpdateTemplate((t) => ({ ...t, customColors: newColors }));
                          }}
                          className="w-9 h-9 rounded-xl border border-foreground/15 cursor-pointer bg-transparent"
                        />
                      </div>

                      {/* Accent Color */}
                      <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Colore Accento & Titoli Info</span>
                          <span className="text-[10px] text-foreground/50 block">Bordi luminosi e badge</span>
                        </div>
                        <input
                          type="color"
                          value={resolvedColors.accent}
                          onChange={(e) => {
                            const newColors = { ...(activeTemplate.customColors || {}), accent: e.target.value };
                            handleUpdateTemplate((t) => ({ ...t, customColors: newColors }));
                          }}
                          className="w-9 h-9 rounded-xl border border-foreground/15 cursor-pointer bg-transparent"
                        />
                      </div>

                      {/* Main Text Foreground */}
                      <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-foreground/5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block">Colore Testo Principale</span>
                          <span className="text-[10px] text-foreground/50 block">Tipografia e titoli</span>
                        </div>
                        <input
                          type="color"
                          value={resolvedColors.foreground}
                          onChange={(e) => {
                            const newColors = { ...(activeTemplate.customColors || {}), foreground: e.target.value };
                            handleUpdateTemplate((t) => ({ ...t, customColors: newColors }));
                          }}
                          className="w-9 h-9 rounded-xl border border-foreground/15 cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: DETTAGLI EMAIL (METADATI, SENDER & DESTINATARIO) */}
              {activeTabSection === "details" && (
                <div className="space-y-6">
                  {/* Card 1: Informazioni Template, Oggetto & Preheader */}
                  <div className="p-6 md:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-5 glass">
                    <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                      <div>
                        <h4 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                          <FileText size={18} className="text-primary" />
                          Informazioni & Oggetto Email
                        </h4>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          Definisci nome, identificatore, oggetto della mail e testo di anteprima per la posta in arrivo.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          id="email-template-enabled-toggle"
                          aria-checked={activeTemplate.enabled !== false}
                          onClick={() => handleUpdateTemplate((t) => ({ ...t, enabled: t.enabled === false }))}
                          title={activeTemplate.enabled !== false ? "Disattiva invio di questa email" : "Attiva invio di questa email"}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                            activeTemplate.enabled !== false
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-foreground/5 text-foreground/50 border-foreground/10 hover:bg-foreground/10"
                          }`}
                        >
                          <span className={`relative inline-block w-7 h-4 rounded-full transition-colors ${activeTemplate.enabled !== false ? "bg-emerald-400" : "bg-foreground/20"}`}>
                            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-background transition-all ${activeTemplate.enabled !== false ? "left-3.5" : "left-0.5"}`} />
                          </span>
                          {activeTemplate.enabled !== false ? "Attiva" : "Disattivata"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateTemplate(selectedIndex)}
                          title="Duplica intero template"
                          className="p-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                        >
                          <CopyPlus size={15} />
                        </button>
                        {templates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(selectedIndex)}
                            title="Elimina template"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        label="Nome Template (Interno)"
                        value={activeTemplate.name || ""}
                        onChange={(v) => handleUpdateTemplate((t) => ({ ...t, name: v }))}
                        placeholder="es. Conferma Iscrizione Cineforum"
                      />
                      <FormField
                        label="Identificativo ID"
                        value={activeTemplate.id || ""}
                        onChange={(v) => handleUpdateTemplate((t) => ({ ...t, id: v }))}
                        placeholder="cineforum-confirmation"
                        helpText="Usato nei bottoni del sito: href='#email:ID'"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Oggetto dell'Email"
                        value={activeTemplate.subject || ""}
                        onChange={(v) => handleUpdateTemplate((t) => ({ ...t, subject: v }))}
                        placeholder="Iscrizione confermata: {{event_title}} — Gli Attomatti"
                        autocompleteTags={allAvailableTags}
                        helpText="Supporta tag dinamici come {{event_title}} o {{nome}}"
                      />

                      <FormField
                        label="Preheader (Testo di Anteprima Inbox)"
                        value={activeTemplate.preheader || ""}
                        onChange={(v) => handleUpdateTemplate((t) => ({ ...t, preheader: v }))}
                        placeholder="Breve frase visibile nell'elenco della posta in arrivo"
                        autocompleteTags={allAvailableTags}
                        helpText="Visibile prima dell'apertura dell'email nei client di posta"
                      />
                    </div>
                  </div>

                  {/* Card 2: Destinatario (A / To) */}
                  <div className="p-6 md:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-5 glass">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-foreground/5 pb-4 gap-3">
                      <div>
                        <h4 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                          <Send size={18} className="text-primary" />
                          Destinatario (A / To)
                        </h4>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          Definisci da dove estrarre l'email e il nome del destinatario. Supporta campi form, variabili o percorsi JSON per webhook e payload terzi.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* to_path */}
                      <div className="space-y-1.5 p-4 rounded-2xl bg-background/50 border border-foreground/10">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground block">
                            Percorso Email Destinatario (<code className="text-primary font-mono">to_path</code>)
                          </label>
                          {fieldMapping.recipient_email_path && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFieldMapping({ recipient_email_path: "" })}
                              className="text-[11px] text-foreground/40 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              Reimposta automatico
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={fieldMapping.recipient_email_path || ""}
                          onChange={(e) => handleUpdateFieldMapping({ recipient_email_path: e.target.value })}
                          placeholder="es. {{data.fields[0].value}}, email, customer.email"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-foreground/10 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                        />
                        {/* Live preview badge for to_path */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-background/60 border border-foreground/10 text-xs">
                          <span className="text-foreground/60 font-semibold">Valore risolto:</span>
                          {resolvedTechnicalFields.to ? (
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30">
                              {resolvedTechnicalFields.to}
                            </span>
                          ) : (
                            <span className="font-mono text-amber-400 italic">
                              {parsedSampleJson ? "Nessuna email trovata per questo percorso" : "Nessun JSON di test fornito"}
                            </span>
                          )}
                          <span className="text-[10px] text-foreground/40 font-mono ml-auto">
                            ({resolvedTechnicalFields.toSource})
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/50">
                          Supporta percorsi come <code className="font-mono text-primary">{"{{data.fields[0].value}}"}</code>, <code className="font-mono text-primary">customer.email</code> o filtri RFC JSONPath. Se vuoto, cerca in automatico campi email noti.
                        </p>
                      </div>

                      {/* name_path */}
                      <div className="space-y-1.5 p-4 rounded-2xl bg-background/50 border border-foreground/10">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground block">
                            Percorso Nome Destinatario (<code className="text-primary font-mono">name_path</code>)
                          </label>
                          {fieldMapping.recipient_name_path && (
                            <button
                              type="button"
                              onClick={() => handleUpdateFieldMapping({ recipient_name_path: "" })}
                              className="text-[11px] text-foreground/40 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              Reimposta automatico
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={fieldMapping.recipient_name_path || ""}
                          onChange={(e) => handleUpdateFieldMapping({ recipient_name_path: e.target.value })}
                          placeholder="es. {{data.fields[0].value}}, customer.first_name, cliente.nome"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-muted/60 border border-foreground/10 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                        />
                        {/* Live preview badge for name_path */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-background/60 border border-foreground/10 text-xs">
                          <span className="text-foreground/60 font-semibold">Valore risolto:</span>
                          {resolvedTechnicalFields.name ? (
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30">
                              {resolvedTechnicalFields.name}
                            </span>
                          ) : (
                            <span className="font-mono text-foreground/40 italic">
                              {parsedSampleJson ? "Nessun nome rilevato con questo percorso" : "Nessun JSON di test fornito"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-foreground/50">
                          Viene iniettato automaticamente nelle variabili <code className="font-mono">{"{{name}}"}</code> e <code className="font-mono">{"{{nome}}"}</code>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Profilo Mittente (Da / From & Reply-To) */}
                  <div className="p-6 md:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-foreground/5 pb-4 gap-3">
                      <div>
                        <h4 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                          <Mail size={18} className="text-primary" />
                          Profilo Mittente Personalizzato & Dinamico (Da / From & Reply-To)
                        </h4>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          Definisci chi appare come mittente e l'indirizzo di risposta per questo template. Puoi usare testo fisso o tag dinamici <code className="text-primary font-mono">{"{{...}}"}</code> estratti dal form, dai webhook o dai custom fields!
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* From Name */}
                      <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-2">
                        <FormField
                          label="Nome Mittente (From Name):"
                          value={activeTemplate.sender_profile?.from_name ?? ""}
                          onChange={(val) => {
                            handleUpdateTemplate((t) => ({
                              ...t,
                              sender_profile: {
                                ...(t.sender_profile || {}),
                                from_name: val
                              }
                            }));
                          }}
                          placeholder={`Default: ${settings.from_name || "Gli Attomatti"} (o es. {{event_title}})`}
                          helpText="Es. Gli Attomatti Cineforum o dinamico {{organizzatore}}"
                          autocompleteTags={allAvailableTags}
                        />
                      </div>

                      {/* From Email */}
                      <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-2">
                        <FormField
                          label="Email Mittente (From Email):"
                          value={activeTemplate.sender_profile?.from_email ?? ""}
                          onChange={(val) => {
                            handleUpdateTemplate((t) => ({
                              ...t,
                              sender_profile: {
                                ...(t.sender_profile || {}),
                                from_email: val
                              }
                            }));
                          }}
                          placeholder={`Default: ${settings.from_email || "no-reply@mail.gliattomatti.ch"}`}
                          helpText="Deve appartenere al dominio verificato su Resend (es. mail.gliattomatti.ch)"
                        />
                      </div>

                      {/* Reply-To */}
                      <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-2">
                        <FormField
                          label="Indirizzo Reply-To (Rispondi a):"
                          value={activeTemplate.sender_profile?.reply_to ?? ""}
                          onChange={(val) => {
                            handleUpdateTemplate((t) => ({
                              ...t,
                              sender_profile: {
                                ...(t.sender_profile || {}),
                                reply_to: val
                              }
                            }));
                          }}
                          placeholder={`Default: ${settings.reply_to || "compagniateatralegliattomatti@gmail.com"}`}
                          helpText="Dove riceverai le risposte dei destinatari. Supporta anche tag come {{x-reply-to}}"
                          autocompleteTags={allAvailableTags}
                        />
                      </div>
                    </div>

                    {/* Resolved preview badge */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-foreground block">Intestazione Mittente Risolta:</span>
                        <span className="text-xs font-mono text-primary mt-0.5 block">
                          {resolvedTechnicalFields.from}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-foreground/50 block">Reply-To attivo:</span>
                        <span className="text-xs font-mono text-foreground/80 mt-0.5 block">
                          {resolvedTechnicalFields.replyTo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: BUILDER COMPONENTS */}
              {activeTabSection === "builder" && (
                <div className="space-y-5">

                  {/* Component Blocks List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-foreground/70">
                        Struttura dell'Email a Blocchi
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddBlockOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Aggiungi Componente
                      </button>
                    </div>

                    {activeBlocks.map((block, idx) => {
                      const def = BLOCK_DEFINITIONS.find((d) => d.type === block.type) || BLOCK_DEFINITIONS[0];
                      const Icon = def.icon;
                      const isExpanded = expandedBlockId === block.id;

                      return (
                        <div
                          key={block.id}
                          className="rounded-2xl bg-muted/20 border border-foreground/5 overflow-hidden transition-all glass hover:border-foreground/10"
                        >
                          {/* Block Header */}
                          <div className="p-3.5 flex items-center justify-between gap-3 bg-foreground/[0.02]">
                            <div
                              onClick={() => {
                                const next = isExpanded ? null : block.id;
                                setExpandedBlockId(next);
                                if (!isExpanded) {
                                  setLastExpandedBlockId(block.id);
                                }
                              }}
                              className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                            >
                              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-primary shrink-0">
                                <Icon size={16} />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-foreground block">
                                  {def.label}
                                </span>
                                <span className="text-[10px] text-foreground/50 block">
                                  {def.desc}
                                </span>
                              </div>
                            </div>

                            {/* Block Action Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveBlock(idx, "up")}
                                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors cursor-pointer"
                                title="Sposta su"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === activeBlocks.length - 1}
                                onClick={() => handleMoveBlock(idx, "down")}
                                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground disabled:opacity-20 transition-colors cursor-pointer"
                                title="Sposta giù"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateBlock(idx)}
                                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                                title="Duplica blocco"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(idx)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title="Elimina blocco"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground transition-colors cursor-pointer ml-1"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Block Inspector (Expanded properties) */}
                          {isExpanded && (
                            <div className="p-5 border-t border-foreground/5 space-y-4 bg-background/30">
                              
                              {/* Header Block Properties */}
                              {block.type === "header" && (
                                <div className="space-y-3">
                                  <FormField
                                    label="Nome Marchio / Brand"
                                    value={block.brand_name || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { brand_name: v })}
                                    placeholder="GLI ATTOMATTI"
                                    autocompleteTags={allAvailableTags}
                                  />
                                  <FormField
                                    label="Sottotitolo / Payoff"
                                    value={block.tagline || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { tagline: v })}
                                    placeholder="Teatro Italiano • Zurigo"
                                    autocompleteTags={allAvailableTags}
                                  />
                                  <FormField
                                    label="Allineamento"
                                    value={block.align || "center"}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { align: v })}
                                    type="select"
                                    options={[
                                      { label: "Centrato", value: "center" },
                                      { label: "A Sinistra", value: "left" }
                                    ]}
                                  />
                                </div>
                              )}

                              {/* Badge Block Properties */}
                              {block.type === "badge" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    label="Testo del Badge"
                                    value={block.text || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { text: v })}
                                    placeholder="es. Cineforum, Workshop"
                                    autocompleteTags={allAvailableTags}
                                  />
                                  <FormField
                                    label="Allineamento"
                                    value={block.align || "center"}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { align: v })}
                                    type="select"
                                    options={[
                                      { label: "Centrato", value: "center" },
                                      { label: "A Sinistra", value: "left" }
                                    ]}
                                  />
                                </div>
                              )}

                              {/* Heading Block Properties */}
                              {block.type === "heading" && (
                                <div className="space-y-3">
                                  <FormField
                                    label="Testo del Titolo"
                                    value={block.text || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { text: v })}
                                    placeholder="La tua prenotazione è confermata!"
                                    autocompleteTags={allAvailableTags}
                                  />
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                      label="Dimensione / Livello"
                                      value={block.level || "h1"}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { level: v })}
                                      type="select"
                                      options={[
                                        { label: "Grande (H1 - 24px)", value: "h1" },
                                        { label: "Medio (H2 - 20px)", value: "h2" },
                                        { label: "Compatto (H3 - 17px)", value: "h3" }
                                      ]}
                                    />
                                    <FormField
                                      label="Allineamento"
                                      value={block.align || "left"}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { align: v })}
                                      type="select"
                                      options={[
                                        { label: "A Sinistra", value: "left" },
                                        { label: "Centrato", value: "center" }
                                      ]}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Text Block Properties */}
                              {block.type === "text" && (
                                <div className="space-y-3">
                                  <FormField
                                    label="Contenuto del Messaggio"
                                    value={block.content || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { content: v })}
                                    type="textarea"
                                    rows={5}
                                    helpText="Supporta Markdown: **grassetto**, [link](https://...) e variabili {{name}}."
                                    autocompleteTags={allAvailableTags}
                                  />
                                  <FormField
                                    label="Allineamento"
                                    value={block.align || "left"}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { align: v })}
                                    type="select"
                                    options={[
                                      { label: "A Sinistra", value: "left" },
                                      { label: "Centrato", value: "center" }
                                    ]}
                                  />
                                </div>
                              )}

                              {/* Button Block Properties */}
                              {block.type === "button" && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                      label="Etichetta Pulsante"
                                      value={block.label || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { label: v })}
                                      placeholder="es. Dettagli Evento"
                                      autocompleteTags={allAvailableTags}
                                    />
                                    <FormField
                                      label="Indirizzo URL"
                                      value={block.url || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { url: v })}
                                      placeholder="https://gliattomatti.ch o {{event_url}}"
                                      autocompleteTags={allAvailableTags}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                      label="Allineamento / Larghezza"
                                      value={block.align || "center"}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { align: v })}
                                      type="select"
                                      options={[
                                        { label: "Centrato", value: "center" },
                                        { label: "A Sinistra", value: "left" },
                                        { label: "Larghezza Piena (Full Width)", value: "full" }
                                      ]}
                                    />
                                    <FormField
                                      label="Stile Angoli"
                                      value={block.style || "pill"}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { style: v })}
                                      type="select"
                                      options={[
                                        { label: "Arrotondato (Pillola)", value: "pill" },
                                        { label: "Morbido (12px)", value: "rounded" },
                                        { label: "Squadrato (4px)", value: "square" }
                                      ]}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Info Box Properties */}
                              {block.type === "info_box" && (
                                <div className="space-y-4">
                                  <FormField
                                    label="Titolo Box Info"
                                    value={block.title || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { title: v })}
                                    placeholder="Riepilogo Evento"
                                    autocompleteTags={allAvailableTags}
                                  />
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block">
                                      Voci della Scheda Info:
                                    </label>
                                    {(block.items || []).map((item, itemIdx) => (
                                      <div key={itemIdx} className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          value={item.label}
                                          onChange={(e) => {
                                            const updatedItems = [...block.items];
                                            updatedItems[itemIdx] = { ...updatedItems[itemIdx], label: e.target.value };
                                            handleUpdateSingleBlock(block.id, { items: updatedItems });
                                          }}
                                          placeholder="Etichetta (es. Data)"
                                          className="w-1/3 px-3 py-2 rounded-xl bg-background/50 border border-foreground/10 text-xs text-foreground focus:outline-none focus:border-primary shrink-0 self-start mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <FormField
                                            label=""
                                            value={item.value}
                                            onChange={(v) => {
                                              const updatedItems = [...block.items];
                                              updatedItems[itemIdx] = { ...updatedItems[itemIdx], value: v };
                                              handleUpdateSingleBlock(block.id, { items: updatedItems });
                                            }}
                                            placeholder="Valore (es. {{event_date}})"
                                            autocompleteTags={allAvailableTags}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedItems = block.items.filter((_, i) => i !== itemIdx);
                                            handleUpdateSingleBlock(block.id, { items: updatedItems });
                                          }}
                                          className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0 self-start mt-1.5"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedItems = [...(block.items || []), { label: "Nuova Voce", value: "" }];
                                        handleUpdateSingleBlock(block.id, { items: updatedItems });
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-[11px] font-bold text-foreground transition-colors cursor-pointer"
                                    >
                                      <Plus size={12} /> Aggiungi Voce
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Calendar Appointment Block Properties */}
                              {block.type === "calendar" && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                      label="Testo Header / Badge Superiore"
                                      value={block.header_label ?? ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { header_label: v })}
                                      placeholder="Default: Promemoria Evento in Agenda"
                                      helpText="Es. Promemoria Evento in Agenda, Save the Date, o {{badge_text}}"
                                      autocompleteTags={allAvailableTags}
                                    />
                                    <FormField
                                      label="Titolo Appuntamento / Evento"
                                      value={block.title || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { title: v })}
                                      placeholder="Spettacolo Teatrale Gli Attomatti o {{event_title}}"
                                      autocompleteTags={allAvailableTags}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                      label="Data & Ora Inizio"
                                      value={block.start_date || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { start_date: v })}
                                      placeholder="2026-11-14T18:00:00 o {{event_date}}"
                                      helpText="Formato ISO (es. 2026-11-14T18:00:00) o tag dinamico {{event_date}}"
                                      autocompleteTags={allAvailableTags}
                                    />
                                    <FormField
                                      label="Data & Ora Fine (Opzionale)"
                                      value={block.end_date || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { end_date: v })}
                                      placeholder="2026-11-14T20:30:00 (default: +2 ore)"
                                      helpText="Se non specificata, calcola automaticamente +2 ore"
                                      autocompleteTags={allAvailableTags}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                      label="Luogo Evento"
                                      value={block.location || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { location: v })}
                                      placeholder="Balberstrasse 47, Zurigo o {{event_location}}"
                                      autocompleteTags={allAvailableTags}
                                    />
                                    <FormField
                                      label="Descrizione Promemoria (Opzionale)"
                                      value={block.description || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { description: v })}
                                      placeholder="Porta con te la conferma della prenotazione!"
                                      autocompleteTags={allAvailableTags}
                                    />
                                  </div>

                                  <div className="p-3.5 rounded-2xl bg-foreground/[0.03] border border-foreground/10 flex items-center gap-3">
                                    <span className="text-base select-none">🗓️</span>
                                    <div className="text-[11px] text-foreground/70 leading-relaxed">
                                      Nell&apos;email vengono generati direttamente 3 pulsanti di aggiunta all&apos;agenda: <strong>Google Calendar</strong>, <strong>Apple / iCal (.ics)</strong> e <strong>Outlook</strong>.
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Image Block Properties */}
                              {block.type === "image" && (
                                <div className="space-y-4">
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <FormField
                                        label="URL Immagine"
                                        value={block.image_url || ""}
                                        onChange={(v) => handleUpdateSingleBlock(block.id, { image_url: v })}
                                        placeholder="https://gliattomatti.ch/images/locandina.webp o {{poster_image}}"
                                        autocompleteTags={allAvailableTags}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setMediaPickerBlockId(block.id)}
                                      className="self-end mb-1 px-3 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-xs font-bold transition-colors cursor-pointer shrink-0"
                                    >
                                      Galleria
                                    </button>
                                  </div>

                                  {/* Full width toggle */}
                                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-foreground/[0.03] border border-foreground/10">
                                    <div className="space-y-0.5 pr-4">
                                      <label className="text-xs font-bold text-foreground block cursor-pointer">
                                        Larghezza Piena (Full Width a filo scheda)
                                      </label>
                                      <span className="text-[11px] text-foreground/50 block">
                                        Estende l&apos;immagine al 100% da bordo a bordo della scheda bianca (senza margini laterali).
                                      </span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(block.full_width || block.align === "full")}
                                      onChange={(e) => {
                                        const isFull = e.target.checked;
                                        handleUpdateSingleBlock(block.id, {
                                          full_width: isFull,
                                          align: isFull ? "full" : "center"
                                        });
                                      }}
                                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                                    />
                                  </div>

                                  {/* Alignment if not full width */}
                                  {!(block.full_width || block.align === "full") && (
                                    <FormField
                                      label="Allineamento"
                                      value={block.align || "center"}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { align: v as any })}
                                      type="select"
                                      options={[
                                        { label: "Centrato", value: "center" },
                                        { label: "A Sinistra", value: "left" },
                                        { label: "A Destra", value: "right" }
                                      ]}
                                    />
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                      label="Didascalia (Opzionale)"
                                      value={block.caption || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { caption: v })}
                                      placeholder="Scena dello spettacolo"
                                      autocompleteTags={allAvailableTags}
                                    />
                                    <FormField
                                      label="Link al click (Opzionale)"
                                      value={block.link_url || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { link_url: v })}
                                      placeholder="https://gliattomatti.ch o {{cta_url}}"
                                      autocompleteTags={allAvailableTags}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Two Column Properties */}
                              {block.type === "two_column" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <FormField
                                      label="Titolo Colonna 1"
                                      value={block.col1_title || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { col1_title: v })}
                                      autocompleteTags={allAvailableTags}
                                    />
                                    <FormField
                                      label="Testo Colonna 1"
                                      value={block.col1_text || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { col1_text: v })}
                                      type="textarea"
                                      rows={3}
                                      autocompleteTags={allAvailableTags}
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <FormField
                                      label="Titolo Colonna 2"
                                      value={block.col2_title || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { col2_title: v })}
                                      autocompleteTags={allAvailableTags}
                                    />
                                    <FormField
                                      label="Testo Colonna 2"
                                      value={block.col2_text || ""}
                                      onChange={(v) => handleUpdateSingleBlock(block.id, { col2_text: v })}
                                      type="textarea"
                                      rows={3}
                                      autocompleteTags={allAvailableTags}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Divider Properties */}
                              {block.type === "divider" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    label="Stile Divisore"
                                    value={block.style || "gradient"}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { style: v })}
                                    type="select"
                                    options={[
                                      { label: "Gradiente Sfumato Luminoso", value: "gradient" },
                                      { label: "Linea Sottile Piatta", value: "solid" },
                                      { label: "Solo Spaziatore Trasparente", value: "spacer" }
                                    ]}
                                  />
                                  <FormField
                                    label="Spaziatura"
                                    value={block.spacing || "md"}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { spacing: v })}
                                    type="select"
                                    options={[
                                      { label: "Compatta (12px)", value: "sm" },
                                      { label: "Media (20px)", value: "md" },
                                      { label: "Ampia (32px)", value: "lg" }
                                    ]}
                                  />
                                </div>
                              )}

                              {/* Social Block Properties */}
                              {block.type === "social_links" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    label="Link Instagram"
                                    value={block.instagram_url || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { instagram_url: v })}
                                    placeholder="https://instagram.com/..."
                                  />
                                  <FormField
                                    label="Link Sito Web"
                                    value={block.website_url || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { website_url: v })}
                                    placeholder="https://gliattomatti.ch"
                                  />
                                </div>
                              )}

                              {/* Footer Block Properties */}
                              {block.type === "footer" && (
                                <div className="space-y-3">
                                  <FormField
                                    label="Testo Istituzionale"
                                    value={block.legal_text || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { legal_text: v })}
                                    placeholder="Compagnia Teatrale Amatoriale Gli Attomatti • Zurigo, Svizzera"
                                    autocompleteTags={allAvailableTags}
                                  />
                                  <FormField
                                    label="Nota di Conformità Privacy"
                                    value={block.privacy_note || ""}
                                    onChange={(v) => handleUpdateSingleBlock(block.id, { privacy_note: v })}
                                    autocompleteTags={allAvailableTags}
                                  />
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* SECTION 4: PERSONALIZZAZIONE (SUBCASES + CAMPI/JSON) */}
              {activeTabSection === "personalization" && (
                <div className="space-y-6">
                  {/* Card 1: Subcases & Varianti Controllate da Tag */}
                  <div className="p-6 md:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-foreground/5 pb-4 gap-3">
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                        <Tag size={18} className="text-primary" />
                        Subcases & Varianti Controllate da Tag
                      </h4>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Un unico template email per gestire più date o varianti di evento (es. 3 Cineforum differenti). Ogni subcase definisce i propri custom fields e viene attivato sul sito tramite <code className="text-primary font-mono font-bold">#email:{activeTemplate.id}:subcase-id</code>.
                      </p>
                    </div>
                  </div>

                  {/* Add Subcase Input Bar */}
                  <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-3">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                      Aggiungi Nuovo Subcase / Variante:
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newSubcaseId}
                        onChange={(e) => setNewSubcaseId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        placeholder="ID / Tag univoco (es. cineforum-1)"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-muted/60 border border-foreground/10 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={newSubcaseName}
                        onChange={(e) => setNewSubcaseName(e.target.value)}
                        placeholder="Nome descrittivo (es. 14 Novembre - Monsieur Hulot)"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-muted/60 border border-foreground/10 text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        disabled={!newSubcaseId.trim()}
                        onClick={() => {
                          const id = newSubcaseId.trim();
                          const name = newSubcaseName.trim() || id;
                          const existing = activeTemplate.subcases || [];
                          if (existing.some((s) => s.id === id)) {
                            alert(`Esiste già un subcase con ID "${id}".`);
                            return;
                          }
                          const updatedSubcases: EmailSubcaseConfig[] = [
                            ...existing,
                            {
                              id,
                              name,
                              custom_fields: {}
                            }
                          ];
                          handleUpdateTemplate((t) => ({ ...t, subcases: updatedSubcases }));
                          setNewSubcaseId("");
                          setNewSubcaseName("");
                          setSelectedSubcaseId(id);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-primary text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                      >
                        + Aggiungi Subcase
                      </button>
                    </div>
                  </div>

                  {/* List of existing subcases */}
                  {(!activeTemplate.subcases || activeTemplate.subcases.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-foreground/[0.02] border border-dashed border-foreground/10 text-center space-y-2">
                      <p className="text-xs text-foreground/60">
                        Nessun subcase configurato per questo template.
                      </p>
                      <p className="text-[11px] text-foreground/40 max-w-md mx-auto">
                        Aggiungendo dei subcase (es. <code className="text-primary font-mono">cineforum-1</code>, <code className="text-primary font-mono">cineforum-2</code>) potrai personalizzare titolo del film, data e orario per ciascun evento senza dover duplicare l'intero template email!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeTemplate.subcases.map((sub, sIdx) => {
                        const isSelectedInPreview = selectedSubcaseId === sub.id;
                        const subcaseTagSnippet = `#email:${activeTemplate.id}:${sub.id}`;
                        const isCopied = copiedSubcaseSnippet === sub.id;

                        return (
                          <div
                            key={sub.id}
                            className={`p-5 rounded-2xl border transition-all space-y-4 ${
                              isSelectedInPreview
                                ? "bg-primary/5 border-primary/40 shadow-xs"
                                : "bg-background/40 border-foreground/5 hover:border-foreground/15"
                            }`}
                          >
                            {/* Subcase Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/5 pb-3">
                              <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                                      {sub.id}
                                    </span>
                                    <span className="font-bold text-sm text-foreground">{sub.name}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* Link Snippet Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(subcaseTagSnippet);
                                    setCopiedSubcaseSnippet(sub.id);
                                    setTimeout(() => setCopiedSubcaseSnippet(null), 2000);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-xs text-foreground font-mono transition-colors cursor-pointer"
                                  title="Copia link per i pulsanti del sito"
                                >
                                  {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                  <span>{subcaseTagSnippet}</span>
                                </button>

                                {/* Preview Button */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubcaseId(isSelectedInPreview ? null : sub.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                    isSelectedInPreview
                                      ? "bg-primary text-background"
                                      : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
                                  }`}
                                >
                                  {isSelectedInPreview ? "Attivo in Anteprima ✓" : "Anteprima"}
                                </button>

                                {/* Delete Subcase Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Eliminare il subcase "${sub.name}" (${sub.id})?`)) {
                                      const updated = (activeTemplate.subcases || []).filter((_, i) => i !== sIdx);
                                      handleUpdateTemplate((t) => ({ ...t, subcases: updated }));
                                      if (selectedSubcaseId === sub.id) setSelectedSubcaseId(null);
                                    }
                                  }}
                                  className="p-1.5 rounded-xl text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Elimina Subcase"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Subcase Custom Fields */}
                            <div className="space-y-3">
                              <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider block">
                                Custom Fields di questo Subcase:
                              </span>

                              {/* Existing fields grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(sub.custom_fields || {}).map(([fKey, fVal]) => (
                                  <div
                                    key={fKey}
                                    className="p-2.5 rounded-xl bg-background/60 border border-foreground/5 flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="font-mono text-xs font-bold text-primary block truncate">
                                        {"{{" + fKey + "}}"}
                                      </span>
                                      <input
                                        type="text"
                                        value={fVal}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const updatedSubcases = (activeTemplate.subcases || []).map((s, idx) => {
                                            if (idx !== sIdx) return s;
                                            return {
                                              ...s,
                                              custom_fields: {
                                                ...(s.custom_fields || {}),
                                                [fKey]: val
                                              }
                                            };
                                          });
                                          handleUpdateTemplate((t) => ({ ...t, subcases: updatedSubcases }));
                                        }}
                                        className="w-full text-xs text-foreground bg-transparent focus:outline-none focus:underline"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedSubcases = (activeTemplate.subcases || []).map((s, idx) => {
                                          if (idx !== sIdx) return s;
                                          const newFields = { ...(s.custom_fields || {}) };
                                          delete newFields[fKey];
                                          return { ...s, custom_fields: newFields };
                                        });
                                        handleUpdateTemplate((t) => ({ ...t, subcases: updatedSubcases }));
                                      }}
                                      className="p-1 text-foreground/30 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                                      title="Rimuovi campo"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Add Field to Subcase */}
                              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="Nuova chiave (es. event_date, poster_image, locazione)"
                                  value={activeSubcaseIndex === sIdx ? newSubcaseFieldKey : ""}
                                  onChange={(e) => {
                                    setActiveSubcaseIndex(sIdx);
                                    setNewSubcaseFieldKey(e.target.value.trim().replace(/[^a-zA-Z0-9_-]/g, ""));
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-background/50 border border-foreground/10 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                                />
                                <input
                                  type="text"
                                  placeholder="Valore del campo per questo subcase"
                                  value={activeSubcaseIndex === sIdx ? newSubcaseFieldValue : ""}
                                  onChange={(e) => {
                                    setActiveSubcaseIndex(sIdx);
                                    setNewSubcaseFieldValue(e.target.value);
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-background/50 border border-foreground/10 text-xs text-foreground focus:outline-none focus:border-primary"
                                />
                                <button
                                  type="button"
                                  disabled={activeSubcaseIndex !== sIdx || !newSubcaseFieldKey.trim()}
                                  onClick={() => {
                                    if (activeSubcaseIndex !== sIdx || !newSubcaseFieldKey.trim()) return;
                                    const updatedSubcases = (activeTemplate.subcases || []).map((s, idx) => {
                                      if (idx !== sIdx) return s;
                                      return {
                                        ...s,
                                        custom_fields: {
                                          ...(s.custom_fields || {}),
                                          [newSubcaseFieldKey]: newSubcaseFieldValue
                                        }
                                      };
                                    });
                                    handleUpdateTemplate((t) => ({ ...t, subcases: updatedSubcases }));
                                    setNewSubcaseFieldKey("");
                                    setNewSubcaseFieldValue("");
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary font-bold text-xs hover:bg-primary/30 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                                >
                                  + Aggiungi Campo
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>

                  {/* Card 2: Campi Personalizzati & Analizzatore JSON */}
                  <div className="p-6 md:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-foreground/5 pb-4 gap-3">
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                        <FileJson size={18} className="text-primary" />
                        Campi Personalizzati & Analizzatore JSON
                      </h4>
                      <p className="text-xs text-foreground/60 mt-0.5">
                        Incolla qualsiasi payload JSON per estrarre tutti i campi disponibili, verificare i valori di prova e copiare i tag delle variabili con un click.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSampleJson}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-xs text-foreground font-semibold border border-foreground/10 transition-colors cursor-pointer"
                      >
                        <Database size={13} className="text-primary" />
                        <span>Carica Esempio</span>
                      </button>
                      {jsonInput && (
                        <button
                          type="button"
                          onClick={handleFormatJson}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-xs text-foreground font-semibold border border-foreground/10 transition-colors cursor-pointer"
                        >
                          <Sparkles size={13} className="text-accent" />
                          <span>Formatta</span>
                        </button>
                      )}
                      {jsonInput && (
                        <button
                          type="button"
                          onClick={() => handleSaveJsonPayload("")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 font-semibold transition-colors cursor-pointer"
                          title="Svuota JSON"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* JSON Textarea Area */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>Payload JSON del Webhook / Servizio Terzo:</span>
                      <span className="text-[11px] text-foreground/50 font-normal">
                        Salvataggio automatico con il template
                      </span>
                    </div>

                    <textarea
                      value={jsonInput}
                      onChange={(e) => handleSaveJsonPayload(e.target.value)}
                      placeholder={`Incolla qui il JSON inviato da Stripe, Typeform, Tally o dal tuo script...\nEsempio:\n{\n  "pippo": "mario.rossi@example.com",\n  "cliente": {\n    "nome": "Mario Rossi",\n    "citta": "Zurigo"\n  }\n}`}
                      rows={9}
                      className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-foreground/15 text-xs font-mono text-emerald-400 focus:outline-none focus:border-primary placeholder:text-foreground/30 leading-relaxed shadow-inner"
                    />

                    {jsonParseError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0 text-rose-400" />
                        <span>Errore di sintassi JSON: {jsonParseError}</span>
                      </div>
                    )}
                  </div>

                  {/* Extracted Fields Explorer */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-foreground">
                          Campi Rilevati nel JSON
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                          {extractedFields.length} {extractedFields.length === 1 ? "campo" : "campi"}
                        </span>
                      </div>

                      {/* Filter Input */}
                      {extractedFields.length > 3 && (
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-2.5 text-foreground/40" />
                          <input
                            type="text"
                            value={fieldSearchTerm}
                            onChange={(e) => setFieldSearchTerm(e.target.value)}
                            placeholder="Filtra campi per nome..."
                            className="pl-8 pr-3 py-1.5 rounded-xl bg-background/50 border border-foreground/10 text-xs text-foreground focus:outline-none focus:border-primary w-48 sm:w-56"
                          />
                        </div>
                      )}
                    </div>

                    {extractedFields.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-muted/30 border border-dashed border-foreground/15 space-y-2">
                        <FileJson size={32} className="mx-auto text-foreground/30" />
                        <p className="text-xs text-foreground/70 font-bold">
                          Nessun campo estratto
                        </p>
                        <p className="text-[11px] text-foreground/50 max-w-sm mx-auto">
                          Incolla un payload JSON nel riquadro sopra oppure clicca su &quot;Carica Esempio&quot; per vedere come i dati vengono analizzati.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                        {extractedFields
                          .filter((f) => !fieldSearchTerm || f.path.toLowerCase().includes(fieldSearchTerm.toLowerCase()) || f.sampleValue.toLowerCase().includes(fieldSearchTerm.toLowerCase()))
                          .map((field) => {
                            const isCurrentEmail = fieldMapping.recipient_email_path === field.path;
                            const isCurrentName = fieldMapping.recipient_name_path === field.path;
                            const isCopied = copiedFieldPath === field.path;

                            return (
                              <div
                                key={field.path}
                                className="p-3.5 rounded-2xl bg-background/50 border border-foreground/10 hover:border-foreground/20 transition-all space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-black text-primary px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20">
                                      {field.path}
                                    </span>

                                    {field.isEmailCandidate && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                        Email ✉️
                                      </span>
                                    )}
                                    {field.isNameCandidate && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        Nome 👤
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono text-foreground/50 px-2 py-0.5 rounded-full bg-foreground/5">
                                      {field.type}
                                    </span>
                                  </div>

                                  {/* Copy {{path}} button */}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyFieldVar(field.path)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-xs text-foreground font-bold transition-all cursor-pointer border border-foreground/10 shrink-0"
                                  >
                                    {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    <span>{isCopied ? "Copiato!" : `Copia {{${field.path}}}`}</span>
                                  </button>
                                </div>

                                {/* Sample Value Preview */}
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-foreground/50 text-[11px]">Valore rilevato:</span>
                                  <span className="font-mono text-emerald-400/90 bg-black/40 px-2 py-0.5 rounded-md truncate max-w-md text-[11px]">
                                    {field.sampleValue}
                                  </span>
                                </div>

                                {/* Quick Action Helpers */}
                                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-foreground/5 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFieldMapping({ recipient_email_path: isCurrentEmail ? "" : field.path })}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                      isCurrentEmail
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70"
                                    }`}
                                  >
                                    {isCurrentEmail && <Check size={11} />}
                                    {isCurrentEmail ? "Email Destinatario Attiva" : "Imposta come Email (to_path)"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFieldMapping({ recipient_name_path: isCurrentName ? "" : field.path })}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                      isCurrentName
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70"
                                    }`}
                                  >
                                    {isCurrentName && <Check size={11} />}
                                    {isCurrentName ? "Nome Destinatario Attivo" : "Imposta come Nome (name_path)"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const segments = field.path.split(/[\.\[\]]/).filter(Boolean);
                                      const suggestedVar = segments[segments.length - 1] || "campo";
                                      setNewVarName(suggestedVar);
                                      setNewVarPath(field.path);
                                      setActiveTabSection("api");
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-foreground/5 hover:bg-foreground/10 text-foreground/70 transition-all cursor-pointer ml-auto"
                                  >
                                    <span>+ Mappa in API</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Live Preview Sync Callout */}
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                    <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-foreground/80 leading-relaxed">
                      <strong className="text-foreground">Sincronizzazione Live con l'Anteprima:</strong> I valori rilevati da questo JSON vengono usati automaticamente come dati di prova nell'anteprima dell'email a destra e a schermo intero! Se modifichi il JSON qui sopra, l'anteprima si aggiorna all'istante con i tuoi dati reali.
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: API & INTEGRATION HELPER */}
              {activeTabSection === "api" && (
                <div className="p-6 md:p-8 rounded-3xl bg-muted/20 border border-foreground/5 space-y-6 glass">
                  <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                    <div>
                      <h4 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                        <Braces size={18} className="text-primary" />
                        Integrazione API, Webhook & Payload Terzi
                      </h4>
                      <p className="text-xs text-foreground/60">
                        Configura percorsi JSON per payload arbitrari, webhook esterni o bottoni del sito.
                      </p>
                    </div>
                  </div>

                  {/* FEATURE: JSON PATH & PAYLOAD MAPPING */}
                  <div className="p-5 rounded-2xl bg-background/50 border border-foreground/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                          Mappatura Payload & JSON Path (per Payload Non Standard)
                        </span>
                        <p className="text-xs text-foreground/70 mt-0.5">
                          Se il servizio esterno (es. Stripe, Typeform, webhook terzi) usa nomi di campi personalizzati come <code className="text-primary font-mono">pippo</code> o <code className="text-primary font-mono">customer.email</code>, configurali qui.
                        </p>
                      </div>
                    </div>

                    {/* Pointer to Dettagli Email for to_path & name_path */}
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-foreground/80">
                        <Info size={16} className="text-primary shrink-0" />
                        <span>
                          La configurazione del <strong>Destinatario (Email & Nome)</strong> è ora nella scheda{" "}
                          <button
                            type="button"
                            onClick={() => setActiveTabSection("details")}
                            className="text-primary underline font-semibold hover:opacity-80 cursor-pointer"
                          >
                            Dettagli Email
                          </button>.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                        <span className="text-foreground/50">to:</span>
                        <span className="text-emerald-400 font-bold">{resolvedTechnicalFields.to || "non rilevata"}</span>
                      </div>
                    </div>

                    {/* Custom Variables Mapping */}
                    <div className="pt-3 border-t border-foreground/5 space-y-3">
                      <span className="text-xs font-bold text-foreground/80 block">
                        Mappatura Variabili Aggiuntive (Opzionale)
                      </span>

                      {fieldMapping.variables_mapping && Object.keys(fieldMapping.variables_mapping).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(fieldMapping.variables_mapping).map(([varKey, pathVal]) => (
                            <div key={varKey} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-muted/40 border border-foreground/5 text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="text-secondary font-bold">{"{{" + varKey + "}}"}</span>
                                <span className="text-foreground/40">➔</span>
                                <span className="text-emerald-400">{pathVal}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariableMapping(varKey)}
                                className="p-1 text-foreground/40 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Rimuovi mappatura"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new mapping row */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          value={newVarName}
                          onChange={(e) => setNewVarName(e.target.value)}
                          placeholder="Nome Variabile (es. codice_posto)"
                          className="flex-1 px-3 py-2 rounded-xl bg-muted/60 border border-foreground/10 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                        />
                        <input
                          type="text"
                          value={newVarPath}
                          onChange={(e) => setNewVarPath(e.target.value)}
                          placeholder="JSON Path (es. ticket.seat_number)"
                          className="flex-1 px-3 py-2 rounded-xl bg-muted/60 border border-foreground/10 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={handleAddVariableMapping}
                          disabled={!newVarName.trim() || !newVarPath.trim()}
                          className="px-3.5 py-2 rounded-xl bg-primary/20 text-primary font-bold text-xs hover:bg-primary/30 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                        >
                          + Mappa
                        </button>
                      </div>
                    </div>

                    {/* Automatic dot-notation notice */}
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                      <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
                      <div className="text-[11px] text-foreground/80 leading-relaxed">
                        <strong className="text-foreground">Appiattimento Automatico Dot-Notation:</strong> Non è obbligatorio mappare tutti i campi! Qualsiasi JSON inviato viene automaticamente appiattito. Se invii <code className="font-mono text-primary">{"{\"ordine\": {\"id\": \"#123\", \"posto\": \"Fila A\"}}"}</code>, puoi già usare direttamente <code className="font-mono text-primary">{"{{ordine.id}}"}</code> e <code className="font-mono text-primary">{"{{ordine.posto}}"}</code> nel template dell'email!
                      </div>
                    </div>
                  </div>

                  {/* Method 1: Website Button */}
                  <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                      1. Da qualsiasi Pulsante del Sito (Senza Codice)
                    </span>
                    <p className="text-xs text-foreground/70">
                      Imposta il link di qualsiasi pulsante (anche nell'Admin delle Landing o Spettacoli) su:
                    </p>
                    <code className="block p-2.5 rounded-xl bg-muted text-primary text-xs font-mono border border-foreground/5 select-all">
                      #email:{activeTemplate.id}
                    </code>
                    {activeTemplate.subcases && activeTemplate.subcases.length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <span className="text-xs font-bold text-foreground/80 block">
                          Oppure per un Subcase / Variante specifica:
                        </span>
                        {activeTemplate.subcases.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted border border-foreground/5 font-mono text-xs">
                            <span className="text-accent">#email:{activeTemplate.id}:{sub.id}</span>
                            <span className="text-[11px] text-foreground/40 font-sans">{sub.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-foreground/50">
                      Al click si aprirà automaticamente il popup protetto per raccogliere l'email e inviare questo template (con i dati del subcase selezionato)!
                    </p>
                  </div>

                  {/* Method 1b: Subcases in Query Param or Body (No Headers Needed!) */}
                  <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-2">
                    <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                      Varianti e Subcases da Webhook / API (Senza Header!)
                    </span>
                    <p className="text-xs text-foreground/70">
                      Puoi specificare il Subcase direttamente nell'URL del Webhook (es. Tally, Zapier, Make) senza bisogno di configurare header HTTP aggiuntivi:
                    </p>
                    <div className="p-3 rounded-xl bg-muted/80 text-foreground font-mono text-xs space-y-2">
                      <div>
                        <span className="text-foreground/50 block text-[10px] uppercase font-sans">Opzione A (Query param &subcase):</span>
                        <code className="text-primary font-bold">/api/email/send?template={activeTemplate.id}&subcase=cineforum-1&secret=TUO_SEGRETO</code>
                      </div>
                      <div>
                        <span className="text-foreground/50 block text-[10px] uppercase font-sans">Opzione B (Sintassi con due punti):</span>
                        <code className="text-accent font-bold">/api/email/send?template={activeTemplate.id}:cineforum-1&secret=TUO_SEGRETO</code>
                      </div>
                      <div>
                        <span className="text-foreground/50 block text-[10px] uppercase font-sans">Opzione C (Nel Body JSON):</span>
                        <code className="text-emerald-400 font-bold">{`{ "subcase": "cineforum-1" }`}</code>
                      </div>
                    </div>
                    <p className="text-[11px] text-foreground/50">
                      Tutti i campi personalizzati definiti nel subcase (es. data, orario, luogo, film) vengono automaticamente applicati all'email!
                    </p>
                  </div>

                  {/* Method 1c: Custom Webhook Headers (Alternative) */}
                  <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-2">
                    <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider block">
                      Alternativa: Personalizzazione tramite Custom Header HTTP (Tally / Zapier / Make)
                    </span>
                    <p className="text-xs text-foreground/70">
                      Se preferisci passare parametri non presenti nel modulo tramite header HTTP:
                    </p>
                    <div className="p-3 rounded-xl bg-muted/80 text-foreground font-mono text-xs space-y-1">
                      <div><span className="text-primary font-bold">x-subcase</span>: cineforum-1</div>
                      <div><span className="text-primary font-bold">x-event-date</span>: 14 Novembre 2026</div>
                      <div><span className="text-primary font-bold">x-event-title</span>: Le vacanze di Monsieur Hulot</div>
                      <div><span className="text-primary font-bold">x-reply-to</span>: cineforum@gliattomatti.ch</div>
                    </div>
                    <p className="text-[11px] text-foreground/50">
                      Gli header con prefisso <code className="text-primary font-mono">x-event-*</code> o <code className="text-primary font-mono">x-var-*</code> diventano automaticamente variabili utilizzabili nell'email.
                    </p>
                  </div>

                  {/* Method 2: cURL Command */}
                  <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                        2. Chiamata REST API Universale (cURL / Zapier / Make / Webhook)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const snippet = `curl -X POST "${originUrl}/api/email/send?template=${activeTemplate.id}&secret=TUO_SEGRETO" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "to": "mario.rossi@example.com",\n    "name": "Mario Rossi",\n    "event_title": "Monsieur Hulot"\n  }'`;
                            navigator.clipboard.writeText(snippet);
                            setCopiedSnippet(true);
                            setTimeout(() => setCopiedSnippet(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-xs text-foreground font-semibold transition-colors cursor-pointer"
                        >
                          {copiedSnippet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          {copiedSnippet ? "Copiato!" : "Copia cURL Standard"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const customSnippet = `curl -X POST "${originUrl}/api/email/send?template=${activeTemplate.id}&secret=TUO_SEGRETO&to_path=pippo" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "pippo": "mario.rossi@example.com",\n    "cliente": {\n      "nome": "Mario Rossi",\n      "citta": "Zurigo"\n    },\n    "ordine": {\n      "codice": "ORD-1234",\n      "posto": "Fila 3, Poltrona 12"\n    }\n  }'`;
                            navigator.clipboard.writeText(customSnippet);
                            setCopiedCustomSnippet(true);
                            setTimeout(() => setCopiedCustomSnippet(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-xs text-primary font-semibold transition-colors cursor-pointer"
                        >
                          {copiedCustomSnippet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          {copiedCustomSnippet ? "Copiato!" : "Copia cURL con ?to_path=pippo"}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-foreground/70">
                      Esempio con payload personalizzato (dove l'email è nel campo <code className="text-primary font-mono">pippo</code> o annidata in oggetti):
                    </p>

                    <pre className="p-3.5 rounded-xl bg-black/60 text-emerald-400 text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed border border-foreground/10">
{`curl -X POST "${originUrl}/api/email/send?template=${activeTemplate.id}&secret=TUO_SEGRETO&to_path=pippo" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pippo": "mario.rossi@example.com",
    "cliente": {
      "nome": "Mario Rossi",
      "citta": "Zurigo"
    },
    "ordine": {
      "codice": "ORD-1234",
      "posto": "Fila 3, Poltrona 12"
    }
  }'`}
                    </pre>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-foreground/60 pt-1">
                      <div><strong className="text-foreground font-mono">?to_path=...</strong> Sovrascrive il percorso email nel payload.</div>
                      <div><strong className="text-foreground font-mono">?name_path=...</strong> Sovrascrive il percorso nome nel payload.</div>
                      <div><strong className="text-foreground font-mono">?theme=...</strong> Sovrascrive il tema colore per questo invio.</div>
                      <div><strong className="text-foreground font-mono">?test=true</strong> Dry-run: restituisce l'anteprima HTML senza inviare.</div>
                    </div>
                  </div>

                  {/* Method 3: Webhook esterni (es. Tally) */}
                  <div className="p-4 rounded-2xl bg-background/50 border border-foreground/10 space-y-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                      3. Webhook Esterni (Tally, Typeform, ecc.)
                    </span>
                    <p className="text-xs text-foreground/70">
                      Nelle impostazioni webhook del servizio esterno, inserisci l'endpoint universale:
                    </p>
                    <code className="block p-2.5 rounded-xl bg-muted text-foreground text-xs font-mono border border-foreground/5 select-all break-all">
                      {originUrl}/api/email/send?template={activeTemplate.id}&secret=TUO_SEGRETO
                    </code>
                    <p className="text-[11px] text-foreground/50">
                      Il destinatario viene risolto tramite <code className="font-mono">to_path</code> (es. <code className="font-mono">{"{{data.fields[0].value}}"}</code>) o rilevato automaticamente.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Right 6 Cols: Live Preview & Test Send */}
            <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-24">
              
              {/* Test Send Box */}
              <div className="p-6 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                  <Send size={15} /> Invia Prova Reale
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="latuaemail@example.com"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-background/50 border border-foreground/10 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      disabled={isSendingTest}
                      onClick={handleSendTestEmail}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-background font-black text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      {isSendingTest ? "Invio..." : "Spedisci"}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        testResult.type === "success"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      }`}
                    >
                      {testResult.type === "success" ? (
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Container */}
              <div className="p-4 sm:p-6 rounded-3xl bg-muted/20 border border-foreground/5 space-y-4 glass">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground/70">
                    <Eye size={15} /> Anteprima Live
                    {activeTemplate.subcases && activeTemplate.subcases.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-2 normal-case font-normal">
                        <span className="text-[11px] text-foreground/50">Subcase:</span>
                        <select
                          value={selectedSubcaseId || ""}
                          onChange={(e) => setSelectedSubcaseId(e.target.value || null)}
                          className="px-2 py-1 rounded-lg bg-foreground/10 border border-foreground/10 text-foreground text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="">Nessuno (Default)</option>
                          {activeTemplate.subcases.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name || sub.id} ({sub.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Device Toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-foreground/5 border border-foreground/5 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          previewDevice === "desktop" ? "bg-foreground text-background" : "text-foreground/50 hover:text-foreground"
                        }`}
                        title="Vista Computer (650px)"
                      >
                        <Monitor size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          previewDevice === "mobile" ? "bg-foreground text-background" : "text-foreground/50 hover:text-foreground"
                        }`}
                        title="Vista Smartphone (360px)"
                      >
                        <Smartphone size={15} />
                      </button>
                    </div>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      onClick={() => setActiveTabSection("preview")}
                      className="p-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/15 text-foreground/70 hover:text-foreground transition-colors cursor-pointer border border-foreground/5"
                      title="Espandi a tutta pagina"
                    >
                      <Maximize2 size={15} />
                    </button>

                    {/* Open in new tab button */}
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold transition-colors cursor-pointer"
                      title="Apri l'anteprima dell'email in una nuova scheda a grandezza naturale"
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">Nuova Scheda</span>
                    </button>
                  </div>
                </div>

                {/* Compact Technical Header Inspector */}
                <div className="p-3 rounded-2xl bg-background/50 border border-foreground/10 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[10px] text-foreground/50 uppercase tracking-wider font-sans font-bold">
                    <span>Header Email Risolti</span>
                    <span className="text-emerald-400 font-mono lowercase">{resolvedTechnicalFields.hasSampleJson ? "da JSON test" : "predefiniti"}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-foreground/40 shrink-0 font-sans font-semibold">A:</span>
                    <span className="text-emerald-400 font-bold truncate">
                      {resolvedTechnicalFields.to || "(Nessun destinatario)"}
                    </span>
                    {resolvedTechnicalFields.name && (
                      <span className="text-foreground/60 text-[11px] shrink-0 font-sans">
                        ({resolvedTechnicalFields.name})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 truncate text-[11px]">
                    <span className="text-foreground/40 shrink-0 font-sans font-semibold">Oggetto:</span>
                    <span className="text-foreground/90 font-sans truncate font-medium">
                      {resolvedTechnicalFields.subject || "(Nessun oggetto)"}
                    </span>
                  </div>
                </div>

                {/* Email Live Iframe Frame */}
                <div className="w-full flex justify-center bg-black/40 p-2 sm:p-4 rounded-2xl border border-foreground/5 overflow-hidden">
                  <div
                    className={`transition-all duration-300 overflow-hidden shadow-2xl rounded-xl border border-foreground/10 ${
                      previewDevice === "mobile" ? "w-[360px]" : "w-full max-w-[650px]"
                    }`}
                  >
                    <iframe
                      title="Email Live Preview"
                      srcDoc={livePreviewHtml}
                      className="w-full h-[750px] bg-slate-900 border-0"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    )}
      </div>

      {/* MODAL: ADD COMPONENT DIALOG */}
      {isAddBlockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-muted/95 border border-foreground/15 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight text-foreground">
                  Aggiungi Componente all&apos;Email
                </h4>
                <p className="text-xs text-foreground/60">
                  {(() => {
                    const targetId = expandedBlockId || lastExpandedBlockId;
                    const targetBlock = targetId ? activeBlocks.find((b) => b.id === targetId) : null;
                    const targetDef = targetBlock ? BLOCK_DEFINITIONS.find((d) => d.type === targetBlock.type) : null;
                    if (targetDef) {
                      return (
                        <>
                          Verrà inserito subito dopo:{" "}
                          <span className="text-primary font-bold">
                            {targetDef.label}
                          </span>
                        </>
                      );
                    }
                    return "Scegli il blocco da inserire nella sequenza.";
                  })()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBlockOpen(false)}
                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto p-1">
              {BLOCK_DEFINITIONS.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    type="button"
                    onClick={() => handleAddBlock(def.type)}
                    className="p-3.5 rounded-2xl bg-foreground/[0.03] hover:bg-primary/10 hover:border-primary/30 border border-foreground/5 text-left transition-all cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-foreground/5 group-hover:bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Icon size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block group-hover:text-primary transition-colors">
                        {def.label}
                      </span>
                      <span className="text-[10px] text-foreground/50 block">
                        {def.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MEDIA LIBRARY MODAL FOR IMAGES */}
      <MediaLibraryModal
        isOpen={Boolean(mediaPickerBlockId)}
        onClose={() => setMediaPickerBlockId(null)}
        onSelect={(selected) => {
          if (mediaPickerBlockId && selected[0]) {
            const rawUrl = selected[0];
            const fullUrl =
              rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
                ? rawUrl
                : `${siteBaseUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
            handleUpdateSingleBlock(mediaPickerBlockId, { image_url: fullUrl });
          }
          setMediaPickerBlockId(null);
        }}
        multiple={false}
      />
    </div>
  );
}
