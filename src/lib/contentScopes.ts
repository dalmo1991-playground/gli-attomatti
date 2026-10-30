/**
 * Utility to discover, map and extract scoped page content from content.json.
 * Completely dynamic and resilient to any future pages or collections.
 */

export interface PageScope {
  id: string;              // unique ID (e.g. 'page-home', 'show-non-sottovalutare-i-40')
  url: string;             // website URL (e.g. '/', '/Spettacoli/non-sottovalutare-i-40')
  title: string;           // readable label (e.g. 'Home Page', 'Spettacolo: Non Sottovalutare i 40')
  category: string;        // 'Pagine Principali' | 'Spettacoli' | 'Blog' | 'Iniziative' | 'Locations' | 'Landings' | 'Altro'
  jsonPath: string;        // dot-notation path in content.json (e.g. 'pages.home', 'shows[0]')
  slug?: string;
}

export interface ExtractedScopeData {
  scope: PageScope;
  sourceValue: any;
  targetValue: any;
  hasDiff: boolean;
  diffSummary?: string;
  sourceImages: string[];
  targetImages: string[];
}

/**
 * Traverses an object/array and returns all string values matching image paths (/images/...).
 */
export function extractImagesFromValue(val: any): string[] {
  const found = new Set<string>();

  function walk(node: any) {
    if (!node) return;
    if (typeof node === 'string') {
      if (node.startsWith('/images/') || node.match(/\.(webp|jpg|jpeg|png|gif|svg)$/i)) {
        found.add(node.startsWith('/') ? node : `/${node}`);
      }
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  }

  walk(val);
  return Array.from(found);
}

/**
 * Retrieves a nested value by dot-path (with optional array index support e.g. "shows[2]" or "pages.home").
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.');
  let current = obj;
  for (const p of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[p];
  }
  return current;
}

/**
 * Sets a nested value by dot-path immutably (returns cloned root object).
 */
export function setValueByPath(root: any, path: string, newValue: any): any {
  const clone = JSON.parse(JSON.stringify(root || {}));
  const parts = path.replace(/\[(\w+)\]/g, '.$1').split('.');
  let current = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    const nextIsNum = /^\d+$/.test(nextKey);

    if (current[key] === undefined || current[key] === null) {
      current[key] = nextIsNum ? [] : {};
    }
    current = current[key];
  }

  const lastKey = parts[parts.length - 1];
  if (newValue === undefined) {
    if (Array.isArray(current)) {
      current.splice(Number(lastKey), 1);
    } else {
      delete current[lastKey];
    }
  } else {
    current[lastKey] = newValue;
  }

  return clone;
}

/**
 * Discovers all page scopes dynamically by examining content.json structure.
 * Will discover any new page added under pages.* or any new item in shows, blog.articles, etc.
 */
export function discoverPageScopes(contentA: any, contentB?: any): PageScope[] {
  const scopes: PageScope[] = [];
  const seenUrls = new Set<string>();

  const union = (key: string): any[] => {
    const arrA = Array.isArray(contentA?.[key]) ? contentA[key] : [];
    const arrB = Array.isArray(contentB?.[key]) ? contentB[key] : [];
    const map = new Map<string, any>();
    // index items by slug or title or index
    arrA.forEach((item, idx) => map.set(item.slug || `idx-${idx}`, item));
    arrB.forEach((item, idx) => {
      const id = item.slug || `idx-${idx}`;
      if (!map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  };

  // 1. Pages under `pages.*`
  const allPageKeys = Array.from(
    new Set([
      ...Object.keys(contentA?.pages || {}),
      ...Object.keys(contentB?.pages || {})
    ])
  );

  const PAGE_URL_MAP: Record<string, { url: string; title: string; category: string }> = {
    home: { url: '/', title: 'Home Page', category: 'Pagine Principali' },
    chi_siamo: { url: '/Chi_Siamo', title: 'Chi Siamo', category: 'Pagine Principali' },
    attori: { url: '/Chi_Siamo/Attori', title: 'Cast & Staff (Pagina)', category: 'Pagine Principali' },
    parlano_di_noi: { url: '/Chi_Siamo/Parlano_di_noi', title: 'Dicono di Noi', category: 'Pagine Principali' },
    press: { url: '/Chi_Siamo/Parlano_di_noi', title: 'Dicono di Noi', category: 'Pagine Principali' },
    blog: { url: '/Chi_Siamo/Blog', title: 'Blog & Notizie (Indice)', category: 'Blog' },
    spettacoli: { url: '/Spettacoli', title: 'Spettacoli (Indice)', category: 'Spettacoli' },
    iniziative: { url: '/Iniziative', title: 'Iniziative (Indice)', category: 'Iniziative' },
    ticketing: { url: '/Biglietti', title: 'Biglietti & Casse', category: 'Pagine Principali' },
    registrations: { url: '/Registrazioni', title: 'Registrazioni & Moduli', category: 'Pagine Principali' },
    locations: { url: '/Location', title: 'Teatri & Location (Indice)', category: 'Locations' },
    contatti: { url: '/Contatti', title: 'Contatti', category: 'Pagine Principali' },
    contact: { url: '/Contatti', title: 'Contatti', category: 'Pagine Principali' }
  };

  for (const key of allPageKeys) {
    if (key === 'guida') continue; // internal admin guide
    const info = PAGE_URL_MAP[key] || {
      url: `/${key.charAt(0).toUpperCase() + key.slice(1)}`,
      title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      category: 'Pagine Principali'
    };

    scopes.push({
      id: `page-${key}`,
      url: info.url,
      title: info.title,
      category: info.category,
      jsonPath: `pages.${key}`
    });
    seenUrls.add(info.url);
  }

  // 2. Actors collection (Cast & Staff data)
  if (contentA?.actors || contentB?.actors) {
    scopes.push({
      id: 'collection-actors',
      url: '/Chi_Siamo/Attori#dati',
      title: 'Cast & Staff (Schede attori)',
      category: 'Pagine Principali',
      jsonPath: 'actors'
    });
  }

  // 3. Spettacoli (shows collection)
  const shows = union('shows');
  shows.forEach((show, idx) => {
    if (!show?.slug) return;
    const url = `/Spettacoli/${show.slug}`;
    scopes.push({
      id: `show-${show.slug}`,
      url,
      title: `Spettacolo: ${show.title || show.slug}`,
      category: 'Spettacoli',
      jsonPath: `shows[slug=${show.slug}]`,
      slug: show.slug
    });
    seenUrls.add(url);
  });

  // 4. Iniziative (initiatives collection)
  const initiatives = union('initiatives');
  initiatives.forEach((ini, idx) => {
    if (!ini?.slug) return;
    const url = `/Iniziative/${ini.slug}`;
    scopes.push({
      id: `initiative-${ini.slug}`,
      url,
      title: `Iniziativa: ${ini.title || ini.slug}`,
      category: 'Iniziative',
      jsonPath: `initiatives[slug=${ini.slug}]`,
      slug: ini.slug
    });
    seenUrls.add(url);
  });

  // 5. Locations (locations collection)
  const locations = union('locations');
  locations.forEach((loc, idx) => {
    if (!loc?.slug) return;
    const url = `/Location/${loc.slug}`;
    scopes.push({
      id: `location-${loc.slug}`,
      url,
      title: `Location: ${loc.name || loc.title || loc.slug}`,
      category: 'Locations',
      jsonPath: `locations[slug=${loc.slug}]`,
      slug: loc.slug
    });
    seenUrls.add(url);
  });

  // 6. Blog articles
  const articlesA = Array.isArray(contentA?.blog?.articles) ? contentA.blog.articles : [];
  const articlesB = Array.isArray(contentB?.blog?.articles) ? contentB.blog.articles : [];
  const allArticlesMap = new Map<string, any>();
  articlesA.forEach((a: any) => a.slug && allArticlesMap.set(a.slug, a));
  articlesB.forEach((a: any) => a.slug && allArticlesMap.set(a.slug, a));

  allArticlesMap.forEach((art, slug) => {
    const url = `/Chi_Siamo/Blog/${slug}`;
    scopes.push({
      id: `blog-${slug}`,
      url,
      title: `Articolo: ${art.title || slug}`,
      category: 'Blog',
      jsonPath: `blog.articles[slug=${slug}]`,
      slug
    });
    seenUrls.add(url);
  });

  // 7. Landings
  const landings = union('landings');
  landings.forEach((l) => {
    if (!l?.slug) return;
    const url = `/landing/${l.slug}`;
    scopes.push({
      id: `landing-${l.slug}`,
      url,
      title: `Landing: ${l.name || l.title || l.slug}`,
      category: 'Landings',
      jsonPath: `landings[slug=${l.slug}]`,
      slug: l.slug
    });
    seenUrls.add(url);
  });

  // 8. Navigation & Site Globals
  scopes.push({
    id: 'global-navigation',
    url: '(Globale) /_menu',
    title: 'Menu di Navigazione',
    category: 'Configurazione',
    jsonPath: 'navigation'
  });

  scopes.push({
    id: 'global-site',
    url: '(Globale) /_seo',
    title: 'Informazioni Sito & SEO',
    category: 'Configurazione',
    jsonPath: 'site'
  });

  return scopes;
}

/**
 * Resolves content for a given jsonPath (supports collection search by slug like `shows[slug=foo]`).
 */
export function resolveScopedValue(content: any, path: string): any {
  if (!content) return undefined;

  const slugMatch = path.match(/^([\w.]+)\s*\[slug=([\w-]+)\]$/);
  if (slugMatch) {
    const parentPath = slugMatch[1];
    const targetSlug = slugMatch[2];
    const list = getValueByPath(content, parentPath);
    if (!Array.isArray(list)) return undefined;
    return list.find((item: any) => item?.slug === targetSlug);
  }

  return getValueByPath(content, path);
}

/**
 * Applies scoped value promotion: overwrites the target content with the source value at the specific path.
 */
export function applyScopedPromotion(targetContent: any, sourceContent: any, path: string): any {
  const sourceVal = resolveScopedValue(sourceContent, path);

  const slugMatch = path.match(/^([\w.]+)\s*\[slug=([\w-]+)\]$/);
  if (slugMatch) {
    const parentPath = slugMatch[1];
    const targetSlug = slugMatch[2];

    const clone = JSON.parse(JSON.stringify(targetContent || {}));
    const list = getValueByPath(clone, parentPath);
    if (!Array.isArray(list)) {
      // create array if missing
      return setValueByPath(clone, parentPath, sourceVal ? [sourceVal] : []);
    }

    const targetIdx = list.findIndex((item: any) => item?.slug === targetSlug);
    if (sourceVal === undefined) {
      if (targetIdx !== -1) list.splice(targetIdx, 1);
    } else if (targetIdx !== -1) {
      list[targetIdx] = sourceVal;
    } else {
      list.push(sourceVal);
    }
    return clone;
  }

  return setValueByPath(targetContent, path, sourceVal);
}
