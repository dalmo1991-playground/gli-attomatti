import { isYouTubeUrl } from "@/lib/youtube";

export interface LegalProvider {
  id: string;
  name: string;
  role: string;
  location: string;
  privacyUrl: string;
  privacyLabel: string;
  conditional?: boolean;
}

export interface ActiveIntegrationsState {
  isGaActive: boolean;
  isMetaActive: boolean;
  isYouTubeActive: boolean;
  isAnyTrackerActive: boolean;
}

interface ImageItem {
  url?: string;
}

interface ContentBlock {
  hero_image?: string;
  image?: string;
  images?: ImageItem[];
}

interface MediaEntity {
  hero_image?: string;
  image?: string;
  images?: ImageItem[];
  blocks?: ContentBlock[];
}

interface LegalContentShape {
  integrations?: {
    google_analytics?: {
      enabled?: boolean;
      measurement_id?: string;
    };
    meta_pixel?: {
      enabled?: boolean;
      pixel_id?: string;
    };
  };
  pages?: {
    privacy?: {
      youtube?: unknown;
    };
  };
  shows?: MediaEntity[];
  initiatives?: MediaEntity[];
  landing_pages?: MediaEntity[];
}

function hasYouTubeInEntity(entity: MediaEntity): boolean {
  if (
    isYouTubeUrl(entity.hero_image) ||
    isYouTubeUrl(entity.image) ||
    entity.images?.some((img) => isYouTubeUrl(img.url))
  ) {
    return true;
  }
  return Boolean(
    entity.blocks?.some(
      (b) =>
        isYouTubeUrl(b.hero_image) ||
        isYouTubeUrl(b.image) ||
        b.images?.some((img) => isYouTubeUrl(img.url))
    )
  );
}

/**
 * Determines which optional/configurable integrations are active based on content.json.
 * Used identically by Privacy and Impressum so legal disclosures never drift.
 */
export function getActiveIntegrationsState(
  content: LegalContentShape | null | undefined
): ActiveIntegrationsState {
  const integrations = content?.integrations || {};
  const p = content?.pages?.privacy;

  const isGaActive = Boolean(
    integrations?.google_analytics?.enabled &&
      integrations?.google_analytics?.measurement_id?.trim()
  );

  const isMetaActive = Boolean(
    integrations?.meta_pixel?.enabled &&
      integrations?.meta_pixel?.pixel_id?.trim()
  );

  const isYouTubeActive = Boolean(
    p?.youtube ||
      content?.shows?.some(hasYouTubeInEntity) ||
      content?.initiatives?.some(hasYouTubeInEntity) ||
      content?.landing_pages?.some(hasYouTubeInEntity)
  );

  return {
    isGaActive,
    isMetaActive,
    isYouTubeActive,
    isAnyTrackerActive: isGaActive || isMetaActive,
  };
}

/**
 * Single source of truth for third-party service providers shown in Impressum and Privacy.
 */
export function getActiveLegalProviders(
  content: LegalContentShape | null | undefined
): LegalProvider[] {
  const { isGaActive, isMetaActive, isYouTubeActive } =
    getActiveIntegrationsState(content);

  const providers: LegalProvider[] = [
    {
      id: "vercel",
      name: "Vercel Inc.",
      role: "Hosting, CDN, log di sicurezza e archiviazione temporanea Vercel Blob (check-in / area riservata)",
      location: "USA / Data center UE (Francoforte, Germania)",
      privacyUrl: "https://vercel.com/legal/privacy-policy",
      privacyLabel: "vercel.com/legal/privacy-policy",
    },
    {
      id: "eventfrog",
      name: "Eventfrog AG",
      role: "Piattaforma tecnica di biglietteria online ed emissione biglietti QR",
      location: "Olten, Svizzera",
      privacyUrl: "https://eventfrog.ch/datenschutz",
      privacyLabel: "eventfrog.ch/datenschutz",
    },
    {
      id: "tally",
      name: "Tally BV",
      role: "Moduli interattivi per registrazioni a eventi gratuiti e workshop",
      location: "Gand, Belgio (server UE)",
      privacyUrl: "https://tally.so/help/privacy-policy",
      privacyLabel: "tally.so/help/privacy-policy",
    },
    {
      id: "resend",
      name: "Resend Inc.",
      role: "Invio di email transazionali, conferme e notifiche",
      location: "USA (DPA & SCC)",
      privacyUrl: "https://resend.com/legal/privacy-policy",
      privacyLabel: "resend.com/legal/privacy-policy",
    },
    {
      id: "google_workspace",
      name: "Google Workspace / Gmail (Google Cloud EMEA Ltd.)",
      role: "Gestione della casella di posta elettronica ufficiale",
      location: "Dublino, Irlanda",
      privacyUrl: "https://policies.google.com/privacy",
      privacyLabel: "policies.google.com/privacy",
    },
    {
      id: "recaptcha",
      name: "Google reCAPTCHA v3 (Google LLC)",
      role: "Protezione anti-bot e anti-spam sui moduli di contatto",
      location: "USA (Swiss-U.S. DPF)",
      privacyUrl: "https://policies.google.com/privacy",
      privacyLabel: "policies.google.com/privacy",
    },
    {
      id: "instagram",
      name: "Instagram / Meta Platforms Ireland Ltd.",
      role: "Visualizzazione di post social incorporati con blocco preventivo 2-Click",
      location: "Dublino, Irlanda",
      privacyUrl: "https://privacycenter.instagram.com/policy",
      privacyLabel: "privacycenter.instagram.com/policy",
    },
  ];

  if (isYouTubeActive) {
    providers.push({
      id: "youtube",
      name: "YouTube (Google Ireland Ltd.)",
      role: "Riproduzione trailer video su richiesta (modalità privacy youtube-nocookie.com)",
      location: "Dublino, Irlanda / USA",
      privacyUrl: "https://policies.google.com/privacy",
      privacyLabel: "policies.google.com/privacy",
      conditional: true,
    });
  }

  if (isGaActive) {
    providers.push({
      id: "google_analytics",
      name: "Google Analytics 4 (Google LLC)",
      role: "Analisi statistica anonimizzata delle visite (attiva solo previo consenso)",
      location: "USA (Swiss-U.S. DPF)",
      privacyUrl: "https://policies.google.com/privacy",
      privacyLabel: "policies.google.com/privacy",
      conditional: true,
    });
  }

  if (isMetaActive) {
    providers.push({
      id: "meta_pixel",
      name: "Meta Pixel (Meta Platforms Ireland Ltd.)",
      role: "Misurazione campagne promozionali su Instagram e Facebook (attivo solo previo consenso)",
      location: "Dublino, Irlanda",
      privacyUrl: "https://privacycenter.instagram.com/policy",
      privacyLabel: "privacycenter.instagram.com/policy",
      conditional: true,
    });
  }

  return providers;
}
