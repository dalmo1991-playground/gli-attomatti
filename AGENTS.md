<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 (App Router + Turbopack)
Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. Heed breaking changes and deprecation notices.
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
- **Unica fonte di verità**: `src/data/content.json` (nessun database SQL/NoSQL).
- **Lettura dati**: `getContent()` da `src/lib/data.ts`.
- **Pubblicazione & Commit**: `/admin` effettua commit via GitHub REST API (`src/lib/github.ts`).
  - Deploy `dev` ➔ target branch `dev`.
  - Deploy produzione (`main`) ➔ target branch `main`.
- **Upload immagini**: `POST /api/upload` comprime in `.webp` (max 1920px) e scrive in `public/images/`.

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

## 4. Conformità Legale Svizzera (nLPD / revFADP)
Ogni volta che modifichi strumenti esterni, flussi dati o acquisti, **verifica e aggiorna la documentazione legale**:

| Trigger | Azione Richiesta |
| :--- | :--- |
| **Terze parti / Embed** (Eventfrog, Tally, iframe) | Aggiorna `src/app/Termini/page.tsx` (responsabilità, rimborsi) e `src/app/Privacy/page.tsx` (responsabili del trattamento). |
| **Tracciamento / Cookie / Analytics** (GA, Pixel) | Aggiorna tabella cookie in `src/app/Privacy/page.tsx` e banner in `src/components/analytics/CookieBanner.tsx`. |
| **Form & Raccolta Dati** (contatti, registrazioni) | Aggiorna finalità, conservazione e server esteri in `src/app/Privacy/page.tsx`. |
| **Link esterni o servizi integrati** | Verifica disclaimer in `src/app/Impressum/page.tsx`. |

*Tutti i testi legali devono essere in italiano formale e conformi alla legge svizzera (nLPD).*