<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Gli Attomatti — Project & AI Agent Guidelines

## 1. Project Overview & Identity
- **Company**: *Gli Attomatti* — an amateur Italian-language theatre company based in Zurich, Switzerland.
- **Language Policy**: **Italian ONLY for all user-facing content** (copy, labels, buttons, navigation, meta descriptions, alt texts). Instructions to you may be in English, but the website copy must always remain in Italian.
- **Design Spirit**: Young, modern, energetic, theatrical, and humorous without sacrificing polish and elegance.
- **Critical File Rules**:
  - **Always ignore the `TODO` file.**
  - **Never touch or delete QR redirects**: In `next.config.ts`, `/Saalvermietung` and `/saalvermietung` redirect to a Tally form used on physical flyers and QR codes.

---

## 2. Tech Stack & Key Libraries
- **Framework**: Next.js 16 (App Router, Turbopack, dynamic rendering via `export const dynamic = 'force-dynamic'`).
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline` in `src/app/globals.css`).
- **Icons**: `lucide-react`.
- **Animations**: `framer-motion` (slideshows, modals, floating elements, interactive hover states).
- **Image Processing**: `sharp` (server-side WebP compression and EXIF auto-rotation).

---

## 3. Data Architecture: Git-Backed Headless CMS
This project does **not** use a traditional database.
- **Single Source of Truth**: All editable site content is stored in `src/data/content.json`.
- **Data Access**: Components read content using `getContent()` from `src/lib/data.ts`.
  - In development: reads `src/data/content.json` fresh from the local filesystem on each request.
  - In production: uses the bundled JSON file updated via commits.
- **Admin Panel (`/admin`)**:
  - Access controlled by `x-admin-secret` header verified against `process.env.ADMIN_SECRET`.
  - When publishing via `POST /api/content`, content is committed directly to GitHub using the REST API (`src/lib/github.ts`).
  - Image uploads via `POST /api/upload` optimize images to `.webp` (max 1920px) and commit them to `public/images/`.
- **Branch Resolution**:
  - `dev` branch: Preview deployments on Vercel. Admin actions automatically target `dev`.
  - `main` branch: Live production domain. Admin actions on production automatically target `main`.

---

## 4. UI & Design System Rules
- **Color Variables**: Never hardcode arbitrary hex colors in component styles. Use semantic theme tokens mapped in `src/app/globals.css`:
  - `var(--background)` / `#0f172a` (Slate 900)
  - `var(--foreground)` / `#f8fafc` (Slate 50)
  - `var(--primary)` / `#fb7185` (Rose 400)
  - `var(--secondary)` / `#818cf8` (Indigo 400)
  - `var(--accent)` / `#fbbf24` (Amber 400)
  - `var(--muted)` / `#1e293b` (Slate 800)
- **Glassmorphism**: Use the `.glass` utility (`backdrop-filter: blur(10px)`) for floating badges, cards, and modal dialogs.
- **Layout Architecture**:
  - `LayoutWrapper.tsx` wraps all standard pages with fixed `Navbar` (`pt-20` on `<main>`) and `Footer`.
  - The `/admin` path is automatically excluded from the public Navbar/Footer layout.
- **Typography & Fluid Spacing**:
  - Avoid rigid fixed-pixel heights (`h-[200px]`, `h-8`) on text containers to prevent multi-line overlapping on long titles or taglines.
  - Use responsive fluid typography (e.g. `text-4xl sm:text-6xl md:text-8xl` with `leading-[0.95]`).

---

## 5. Defensive Coding & Stability Guidelines
- **Safe `<Link>` Rendering**: Next.js `<Link>` crashes if `href` is `undefined` or null. Always check if an `href` exists before rendering `<Link>`:
  ```tsx
  {item.href ? (
    <Link href={item.href}>{item.label}</Link>
  ) : (
    <div>{item.label}</div>
  )}
  ```
- **Safe `<Image>` Rendering**: Next.js throws an error if `src=""` (empty string). Always provide a fallback:
  ```tsx
  <Image
    src={show.image?.trim() || "/images/1782553290530-TheaterCurtain.webp"}
    alt={show.title || "Spettacolo"}
    ...
  />
  ```
- **Dynamic Content**: Always verify nested optional arrays or properties exist (`content.pages?.spettacoli?.archive_sections || []`) to prevent runtime crashes when content schema evolves.

---

## 6. Legal & Regulatory Compliance Verification (Mandatory)
Every time an AI agent introduces or modifies a feature, tool, or data flow, **the agent MUST systematically verify whether the legal documents require updating**:

### Trigger Checklist (When to check legal docs):
- **Third-Party Services & Integrations**: Adding, updating, or embedding external tools (e.g. ticketing like *Eventfrog*, form builders like *Tally*, analytics like *Google Analytics*, pixels like *Meta Pixel*, maps, external APIs).
- **Embedded Components (iFrames & Widgets)**: Embedding external content or checkout/registration frames into pages (e.g. `/Biglietti/[slug]`, `/Registrazioni/[slug]`, landing pages).
- **Data Collection & Forms**: Adding new input fields, registration flows, contact mechanisms, user data storage, newsletter subscriptions, or surveys.
- **Cookies & Storage**: Setting new cookies, local storage keys, session tokens, or third-party session cookies.
- **Transactional & Event Rules**: Modifying ticket pricing, refund rules, event attendance rules, cancellation policies, or registration procedures.

### Legal Documents to Audit & Update:
1. **`src/app/Privacy/page.tsx` (Informativa sulla Privacy — nLPD / revFADP & GDPR)**:
   - Disclose data controllers, data processors, processing purposes, server locations (EU/CH/US), and data retention.
   - Update the **Cookie & Storage Table** (distinguish between strictly necessary technical session cookies vs. opt-in analytics/marketing).
   - Ensure conditional flags (e.g. `isEventfrogActive`, `isTallyActive`, `isGaActive`) correctly detect active pages or content structures.
2. **`src/app/Termini/page.tsx` (Termini e Condizioni — Regolamento Spettacoli & Eventi)**:
   - Update purchase conditions, registration validity, refund/cancellation policies, no-show guidelines, and technical liability disclaimers for embedded third-party services.
3. **`src/app/Impressum/page.tsx` (Note Legali / Impressum)**:
   - Ensure the disclaimer (Haftungsausschluss) covers new external links or embedded iframe services.
4. **`src/components/analytics/CookieBanner.tsx`**:
   - Ensure cookie descriptions, categories, and opt-in toggles remain accurate.

*Remember: All legal copy must be written in **rigorous, professional Italian** and conform strictly to Swiss law (nLPD).*