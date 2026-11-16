<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Gli Attomatti — Agent Directives

## 1. Regole Inderogabili (Hard Rules)
1. **Lingua**: **Italiano SEMPRE** per tutti i contenuti utente (testi, bottoni, label, meta, alt text).
2. **File da non toccare**:
   - Ignora sempre il file `TODO`.
   - **MAI rimuovere i redirect QR** in `next.config.ts` (`/Saalvermietung` e `/saalvermietung`).
3. **No hardcoded theme colors**: Usa solo token semantici (`var(--background)`, `var(--primary)`, `var(--secondary)`, `var(--accent)`, `var(--muted)`). Mai colori hex arbitrari nei componenti.
4. **Defensive UI**:
   - `<Link>`: verifica sempre `href` prima di renderizzare (`href ? <Link> : <div>`).
   - `<Image>`: mai `src=""`, usa sempre fallback sicuro (`getSafeImageProps` o fallback WebP).
   - Array opzionali: fornisci sempre fallback vuoto `|| []`.

---

## 2. Architettura Dati & Headless CMS
- **Contenuti editoriali (unica fonte di verità)**: `src/data/content.json` (nessun database SQL/NoSQL per i contenuti del sito).
- **Lettura dati**: `getContent()` da `src/lib/data.ts`.
- **Pubblicazione & Commit**: `/admin` effettua commit via GitHub REST API (`src/lib/github.ts`).
  - Deploy `dev` ➔ target branch `dev`.
  - Deploy produzione (`main`) ➔ target branch `main`.
  - Pubblicazione programmata (`/api/content/schedule` + `SchedulePublishModal.tsx`): salva uno snapshot su Vercel Blob (`scheduled-content/<branch>.json`) e pianifica un callback one-shot su Upstash QStash verso `/api/cron/publish-scheduled` (limite piano gratuito QStash: **max 7 giorni**).
- **Upload immagini**: `POST /api/upload` comprime in `.webp` (max 1920px) e scrive in `public/images/`.
- **Dati operativi e code (Vercel Blob + Upstash)**:
  - **Vercel Blob** (`@vercel/blob`, fallback locale `.data/` in dev): snapshot permanenti Tally (`tally-submissions/<formId>/submissions.json` e `checkins.json`), pubblicazioni programmate (`scheduled-content/<branch>.json`), Dead Letter Queue email (`src/lib/email/dlq.ts`) e bounce Resend (`src/lib/email/bounces.ts`).
  - **Upstash Redis** (`src/lib/redis.ts`, `src/lib/tallyLiveRedis.ts`): stato live del check-in (`checkin:counts:<formId>`, `checkin:meta:<formId>`, `checkin:seeded:<formId>`, `checkin:ver:<formId>`, `checkin:dirty`, `checkin:backup-msg:<formId>`, TTL 14 giorni). Il polling browser in `/area-riservata/check-in` usa `UPSTASH_REDIS_REST_READONLY_TOKEN` su `checkin:ver:<formId>`.
  - **Upstash QStash** (`src/lib/qstash.ts`): callback differiti one-shot per pubblicazione programmata e flush Redis→Blob (`/api/tally-submissions/flush`), autenticati con `CRON_SECRET` (`Upstash-Forward-Authorization`).

---

## 3. Risoluzione Contenuti Slug (3 Livelli & Soppressione)
Per qualsiasi testo/intestazione nelle pagine dinamiche `[slug]` (`/Location`, `/Spettacoli`, `/Iniziative`, `/Biglietti`, `/Registrazioni`), usa `resolveSlugText()` (`src/lib/contentResolver.ts`) o `defaultText()` (`src/lib/utils.ts`):

```
Prio 1: Oggetto slug specifico (es. location.steps_heading)
  ↓ (se undefined o "")
Prio 2: Default globale di sezione (es. content.pages.locations.steps_heading)
  ↓ (se undefined o "")
Prio 3: Fallback hardcoded nel codice (es. "Guida fotografica")
```

> **Soppressione esplicita**: se Prio 1 o Prio 2 contengono **`null`**, ritorna `null` e l'elemento UI **non deve essere renderizzato** (non deve cadere nei fallback).

### Principio di Semplicità Admin UI (Admin Restraint)
- **Non aggiungere campi secondari di fine-tuning nella UI dell'admin**: intestazioni ausiliarie, testi minori o soppressioni specifiche con `null` si configurano direttamente in `src/data/content.json` (o tramite la scheda *JSON* dell'admin).
- La UI visiva di `/admin` deve restare focalizzata solo sui dati primari (titolo, date, immagini, descrizioni principali, link).

---

## 4. Infrastruttura & Servizi Esterni
- **Vercel**:
  - **Team**: `dalmo1991's projects` (`team_T6mttwla6PJsAjRKYX8LZmA4`, slug `dalmo1991s-projects`)
  - **Progetto**: `gli-attomatti` (`prj_CDQERihdUJ6lH65vSjA8WfEqVwLG`), Next.js `16.2.11` / React `19.2.4` / Node `24.x`
  - **Domini & Branch**:
    - Produzione (`main`): `https://gliattomatti.ch`
    - Preview/Dev (`dev`): `https://gli-attomatti.vercel.app` (protetto da `DEV_GATE_PASSWORD` quando `NEXT_PUBLIC_IS_DEV_SITE=true`)
  - **Vercel Cron** (`vercel.json`): `GET /api/cron/email-dlq-notify` (`10 0 * * *`, ogni giorno alle 00:10 UTC).
- **Upstash**:
  - **Redis DB**: `Attomatti checkin` (`a4ed9ea3-c4a1-4c06-a95d-a55cf5438114`), region `global` (primary `eu-central-1`), endpoint `shining-wildcat-97102.upstash.io`.
  - **QStash**: job differiti su `/api/cron/publish-scheduled` e `/api/tally-submissions/flush` con `Upstash-Forward-Authorization: Bearer <CRON_SECRET>` (e opzionale `VERCEL_AUTOMATION_BYPASS_SECRET`).
- **Tally**:
  - **Workspace**: `My workspace` (`wdQAMV`). I singoli form sono gestiti come contenuto dinamico su Tally / `content.json` (fatta eccezione per il redirect QR permanente `/Saalvermietung` in `next.config.ts`).
  - **Integrazione**: `src/lib/tallySubmissions.ts` sincronizza le submission via API Tally (`TALLY_API_KEY`) su Vercel Blob con cache in memoria di 45s; supporta check-in live (`/area-riservata/check-in` e `/admin` `TallyCheckinTab.tsx`), export PDF (`checkinPdfExport.ts`) e invio email massivo agli iscritti.
- **Resend & Sistema Email**:
  - `src/lib/email/` (`blocks.ts`, `template.ts`, `blogToEmail.ts`, `calendar.ts`, `csvParser.ts`, `resend.ts`, `dlq.ts`, `bounces.ts`), invio massivo da Tally (`/api/email/mass-send`), webhook `/api/webhooks/resend` e gestione in `/admin` (`EmailTab.tsx`).
- **Area Riservata**:
  - `/area-riservata` (`appuntamenti`, `assenze`, `check-in`) protetta da `AREA_RISERVATA_PIN` (`src/app/actions/areaRiservataAuth.ts`).
- **Variabili d'ambiente su Vercel** (solo nomi; mai salvare valori o segreti nei file):
  - Auth/Security: `ADMIN_SECRET`, `AREA_RISERVATA_PIN`, `DEV_GATE_PASSWORD`, `CRON_SECRET`, `EMAIL_API_SECRET`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - GitHub CMS: `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`
  - Vercel Blob: `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`
  - Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_REDIS_REST_READONLY_TOKEN`, `QSTASH_TOKEN`, `QSTASH_URL`
  - Tally & Resend: `TALLY_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`

---

## 5. Conformità Legale Svizzera (nLPD / revFADP)
Lo stato dei provider opzionali (`google_analytics`, `meta_pixel`, `YouTube`) è determinato dinamicamente da `content.json` tramite `src/lib/legalProviders.ts` e `src/lib/legalContent.ts`, mantenendo allineate `Privacy`, `Impressum` e `Termini`. Ogni volta che modifichi strumenti esterni, flussi dati o acquisti, **verifica e aggiorna la documentazione legale**:

| Trigger | Azione Richiesta |
| :--- | :--- |
| **Terze parti / Embed** (Eventfrog, Tally, iframe) | Aggiorna `src/app/Termini/page.tsx` (responsabilità, rimborsi) e `src/app/Privacy/page.tsx` (responsabili del trattamento). |
| **Tracciamento / Cookie / Analytics** (GA, Pixel) | Aggiorna tabella cookie in `src/app/Privacy/page.tsx` e banner in `src/components/analytics/CookieBanner.tsx`. |
| **Form & Raccolta Dati** (contatti, registrazioni) | Aggiorna finalità, conservazione e server esteri in `src/app/Privacy/page.tsx`. |
| **Link esterni o servizi integrati** | Verifica disclaimer in `src/app/Impressum/page.tsx`. |

*Tutti i testi legali devono essere in italiano formale e conformi alla legge svizzera (nLPD).*